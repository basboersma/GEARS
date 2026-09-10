import { eq } from "drizzle-orm";
import { db } from "@/db/drizzle";
import { agendaEvent, organization } from "@/db/schema";

const escapeIcs = (value: string) =>
  value
    .replaceAll("\\", "\\\\")
    .replaceAll(";", "\\;")
    .replaceAll(",", "\\,")
    .replaceAll("\n", "\\n");

const icsDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toISOString().replaceAll(/[-:]/g, "").replace(".000", "");
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const org = await db.query.organization.findFirst({
    where: eq(organization.calendarFeedToken, token),
  });
  if (!org) {
    return new Response("Not found", { status: 404 });
  }
  const events = await db.query.agendaEvent.findMany({
    where: eq(agendaEvent.organizationId, org.id),
  });
  const body = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//GearsNL//Organization Agenda//EN",
    "CALSCALE:GREGORIAN",
    ...events.flatMap((event) => [
      "BEGIN:VEVENT",
      `UID:${event.id}@gearsnl.org`,
      `DTSTAMP:${icsDate(event.updatedAt.toISOString())}`,
      `DTSTART:${icsDate(event.start)}`,
      `DTEND:${icsDate(event.end)}`,
      `SUMMARY:${escapeIcs(event.title)}`,
      `DESCRIPTION:${escapeIcs(event.description)}`,
      `LOCATION:${escapeIcs(event.location ?? "")}`,
      "END:VEVENT",
    ]),
    "END:VCALENDAR",
    "",
  ].join("\r\n");
  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
