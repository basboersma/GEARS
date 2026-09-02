import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/drizzle";
import { member, organization } from "@/db/schema";
import { auth } from "@/lib/auth";

const trailingSlashPattern = /\/$/;

const inviteSchema = z.object({
  organizationId: z.string().min(1),
  email: z.string().trim().email("Enter a valid email address."),
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
      { error: "Invalid email address or organization." },
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
      { error: "Admin or owner access is required to send invitations." },
      { status: 403 }
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
  const recipient = parsed.data.email;
  const loginUrl = `${appUrl}/login`;

  try {
    const { Resend } = await import("resend");
    const result = await new Resend(apiKey).emails.send({
      from: `${senderName} <${senderAddress}>`,
      to: [recipient],
      subject: `You're invited to join ${selectedOrganization.name} on GEARS`,
      html: `<p>Hello,</p><p>${session.user.name} has invited you to join <strong>${selectedOrganization.name}</strong> on GEARS.</p><p>You can sign in at <a href="${loginUrl}">${loginUrl}</a>.</p>`,
      text: `Hello,\n\n${session.user.name} has invited you to join ${selectedOrganization.name} on GEARS.\n\nYou can sign in at ${loginUrl}.`,
    });

    if (result.error) {
      console.error(
        "Resend reported an invitation delivery error",
        result.error
      );
      return NextResponse.json(
        { error: result.error.message || "Unable to send invitation email." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Invitation email send failed", error);
    return NextResponse.json(
      { error: "Failed to send invitation email." },
      { status: 500 }
    );
  }
}
