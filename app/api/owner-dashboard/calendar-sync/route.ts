import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/drizzle";
import { agendaEvent, member } from "@/db/schema";
import { auth } from "@/lib/auth";
import { syncGoogleCalendar } from "@/lib/google-drive";

const schema = z.object({
  organizationId: z.string().min(1),
  calendarId: z.string().min(1),
});

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid calendar sync request" },
      { status: 400 }
    );
  }
  const membership = await db.query.member.findFirst({
    where: and(
      eq(member.organizationId, parsed.data.organizationId),
      eq(member.userId, session.user.id)
    ),
  });
  if (!(membership?.role === "owner" || membership?.role === "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const events = await db.query.agendaEvent.findMany({
    where: eq(agendaEvent.organizationId, parsed.data.organizationId),
  });
  const result = await syncGoogleCalendar({
    calendarId: parsed.data.calendarId,
    events: events.map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      location: event.location ?? "",
      start: event.start,
      end: event.end,
    })),
  });
  return result.success
    ? NextResponse.json(result)
    : NextResponse.json(result, { status: 502 });
}
