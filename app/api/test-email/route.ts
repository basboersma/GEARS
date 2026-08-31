import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/drizzle";
import { member } from "@/db/schema";
import { auth } from "@/lib/auth";

const emailSchema = z.object({
  organizationId: z.string().min(1, "Organization is required."),
  email: z.string().trim().email("Please enter a valid email address."),
});

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json();
  const parsed = emailSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid email address or organization.",
      },
      { status: 400 }
    );
  }

  const membership = await db.query.member.findFirst({
    where: and(
      eq(member.userId, session.user.id),
      eq(member.organizationId, parsed.data.organizationId),
      eq(member.role, "owner")
    ),
  });

  if (!membership) {
    return NextResponse.json(
      { error: "Owner access required for this organization." },
      { status: 403 }
    );
  }

  const { email } = parsed.data;
  const resend = process.env.RESEND_API_KEY
    ? (await import("resend")).Resend
    : null;

  if (!(resend && process.env.EMAIL_SENDER_ADDRESS)) {
    return NextResponse.json(
      { error: "Email sending is not configured on this server." },
      { status: 500 }
    );
  }

  const client = new resend(process.env.RESEND_API_KEY);
  const senderEmail = process.env.EMAIL_SENDER_ADDRESS;
  const senderName = process.env.EMAIL_SENDER_NAME ?? "GEARS";

  try {
    const result = await client.emails.send({
      from: `${senderName} <${senderEmail}>`,
      to: [email],
      subject: "GEARS test email",
      html: "<p>This is a test email from GEARS.</p><p>If you received this, email delivery is working correctly.</p>",
      text: "This is a test email from GEARS. If you received this, email delivery is working correctly.",
    });

    if (result.error) {
      return NextResponse.json(
        { error: result.error.message || "Unable to send test email." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Test email send failed", error);
    return NextResponse.json(
      { error: "Failed to send test email." },
      { status: 500 }
    );
  }
}
