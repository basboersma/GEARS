import { and, eq, inArray } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/drizzle";
import {
  departmentInvitation,
  member,
  organization,
  organizationDepartment,
  user,
} from "@/db/schema";
import { auth } from "@/lib/auth";

const trailingSlashPattern = /\/$/;

const inviteSchema = z.object({
  organizationId: z.string().min(1),
  memberId: z.string().min(1),
  departmentIds: z
    .array(z.string().min(1))
    .min(1, "Select at least one department."),
});

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json();
  const parsed = inviteSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid member or department selection." },
      { status: 400 }
    );
  }

  const membership = await db.query.member.findFirst({
    where: and(
      eq(member.userId, session.user.id),
      eq(member.organizationId, parsed.data.organizationId)
    ),
  });

  if (!(membership?.role === "admin" || membership?.role === "owner")) {
    return NextResponse.json(
      { error: "Admin or owner access is required to invite members." },
      { status: 403 }
    );
  }

  const targetMember = await db
    .select({ id: member.id, email: user.email, name: user.name })
    .from(member)
    .innerJoin(user, eq(member.userId, user.id))
    .where(
      and(
        eq(member.id, parsed.data.memberId),
        eq(member.organizationId, parsed.data.organizationId)
      )
    )
    .then((rows) => rows[0]);

  if (!targetMember) {
    return NextResponse.json({ error: "Member not found." }, { status: 404 });
  }

  const departments = await db.query.organizationDepartment.findMany({
    where: and(
      eq(organizationDepartment.organizationId, parsed.data.organizationId),
      inArray(organizationDepartment.id, parsed.data.departmentIds)
    ),
  });

  if (departments.length === 0) {
    return NextResponse.json(
      { error: "No valid departments selected." },
      { status: 400 }
    );
  }

  const selectedOrganization = await db.query.organization.findFirst({
    where: eq(organization.id, parsed.data.organizationId),
  });

  if (!selectedOrganization) {
    return NextResponse.json(
      { error: "Organization not found." },
      { status: 404 }
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  const senderAddress = process.env.EMAIL_SENDER_ADDRESS?.trim();

  if (!(apiKey && senderAddress)) {
    return NextResponse.json(
      { error: "Email sending is not configured correctly on this server." },
      { status: 500 }
    );
  }

  const senderName = process.env.EMAIL_SENDER_NAME?.trim() || "GEARS";
  const appUrl = (
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.BETTER_AUTH_URL?.trim() ||
    "https://gearsnl.org"
  ).replace(trailingSlashPattern, "");

  const invitationId = crypto.randomUUID();
  const invitationUrl = `${appUrl}/api/accept-member-department-invitation/${invitationId}`;
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
  const departmentNames = departments.map((d) => d.name).join(", ");

  await db.insert(departmentInvitation).values({
    id: invitationId,
    organizationId: parsed.data.organizationId,
    memberId: targetMember.id,
    departmentIds: JSON.stringify(departments.map((d) => d.id)),
    status: "pending",
    expiresAt,
    inviterId: session.user.id,
  });

  try {
    const { Resend } = await import("resend");
    const result = await new Resend(apiKey).emails.send({
      from: `${senderName} <${senderAddress}>`,
      to: [targetMember.email],
      subject: `You're invited to join ${departmentNames} at ${selectedOrganization.name}`,
      html: `<p>Hi ${targetMember.name},</p><p>${session.user.name} has invited you to join <strong>${departmentNames}</strong> at ${selectedOrganization.name} on GEARS.</p><p><a href="${invitationUrl}">Accept invitation</a></p><p>This invitation expires in 48 hours.</p>`,
      text: `Hi ${targetMember.name},\n\n${session.user.name} has invited you to join ${departmentNames} at ${selectedOrganization.name} on GEARS.\n\nAccept your invitation: ${invitationUrl}\n\nThis invitation expires in 48 hours.`,
    });

    if (result.error) {
      console.error(
        "Resend reported a department invitation delivery error",
        result.error
      );
      await db
        .delete(departmentInvitation)
        .where(eq(departmentInvitation.id, invitationId));
      return NextResponse.json(
        { error: result.error.message || "Unable to send invitation email." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Department invitation email send failed", error);
    await db
      .delete(departmentInvitation)
      .where(eq(departmentInvitation.id, invitationId));
    return NextResponse.json(
      { error: "Failed to send invitation email." },
      { status: 500 }
    );
  }
}
