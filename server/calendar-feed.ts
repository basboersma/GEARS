import { eq } from "drizzle-orm";
import { db } from "@/db/drizzle";
import { organization } from "@/db/schema";

const TRAILING_SLASH = /\/$/;

export async function getCalendarFeedUrl(organizationId: string) {
  const current = await db.query.organization.findFirst({
    where: eq(organization.id, organizationId),
  });
  if (!current) {
    throw new Error("Organization not found.");
  }
  const token = current.calendarFeedToken ?? crypto.randomUUID();
  if (!current.calendarFeedToken) {
    await db
      .update(organization)
      .set({ calendarFeedToken: token })
      .where(eq(organization.id, organizationId));
  }
  const origin =
    process.env.NEXT_PUBLIC_APP_URL?.replace(TRAILING_SLASH, "") ??
    process.env.BETTER_AUTH_URL?.replace(TRAILING_SLASH, "") ??
    "http://localhost:3000";
  return `${origin}/api/calendar-feed/${token}.ics`;
}
