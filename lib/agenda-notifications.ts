import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db/drizzle";
import { member, organization, user } from "@/db/schema";

const emailAddressPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ITEM_TYPE_LABEL: Record<string, string> = {
  meeting: "Meeting",
  event: "Event",
  general_members_assembly: "General Members Assembly",
};

function formatEventDate(iso: string) {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? iso
    : date.toLocaleString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
}

export async function sendEventInvitationEmails({
  organizationId,
  memberIds,
  event,
}: {
  organizationId: string;
  memberIds: string[];
  event: {
    title: string;
    itemType: string;
    description: string;
    location?: string | null;
    start: string;
    end: string;
  };
}) {
  if (memberIds.length === 0) {
    return;
  }

  if (!process.env.RESEND_API_KEY) {
    console.warn("Skipping agenda event email due to missing RESEND_API_KEY");
    return;
  }

  const senderAddress = process.env.EMAIL_SENDER_ADDRESS?.trim();

  if (!(senderAddress && emailAddressPattern.test(senderAddress))) {
    console.warn(
      "Skipping agenda event email due to missing/invalid EMAIL_SENDER_ADDRESS"
    );
    return;
  }

  const senderName = process.env.EMAIL_SENDER_NAME?.trim() || "GEARS";

  const org = await db.query.organization.findFirst({
    where: eq(organization.id, organizationId),
  });

  if (!org) {
    console.warn("Skipping agenda event email: organization not found", {
      organizationId,
    });
    return;
  }

  const recipients = await db
    .select({ email: user.email, name: user.name })
    .from(member)
    .innerJoin(user, eq(member.userId, user.id))
    .where(
      and(
        eq(member.organizationId, organizationId),
        inArray(member.id, memberIds)
      )
    );

  if (recipients.length === 0) {
    return;
  }

  const { Resend } = await import("resend");
  const client = new Resend(process.env.RESEND_API_KEY);

  const typeLabel = ITEM_TYPE_LABEL[event.itemType] ?? "Agenda item";
  const subject = `New ${typeLabel.toLowerCase()}: ${event.title} — ${org.name}`;
  const startFormatted = formatEventDate(event.start);
  const endFormatted = formatEventDate(event.end);

  await Promise.allSettled(
    recipients.map(async (recipient) => {
      const html = `
        <p>Hi ${recipient.name},</p>
        <p>You've been invited to a ${typeLabel.toLowerCase()} for <strong>${org.name}</strong>:</p>
        <p><strong>${event.title}</strong></p>
        <p>${startFormatted} – ${endFormatted}</p>
        ${event.location ? `<p>Location: ${event.location}</p>` : ""}
        <p>${event.description}</p>
      `;
      const text = `Hi ${recipient.name},\n\nYou've been invited to a ${typeLabel.toLowerCase()} for ${org.name}:\n\n${event.title}\n${startFormatted} – ${endFormatted}\n${event.location ? `Location: ${event.location}\n` : ""}\n${event.description}`;

      try {
        const result = await client.emails.send({
          from: `${senderName} <${senderAddress}>`,
          to: [recipient.email],
          subject,
          html,
          text,
        });

        if (result.error) {
          console.error("Resend reported an agenda event email error", {
            to: recipient.email,
            error: result.error,
          });
        }
      } catch (error) {
        console.error("Unexpected agenda event email send failure", {
          to: recipient.email,
          error,
        });
      }
    })
  );
}
