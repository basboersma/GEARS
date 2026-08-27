import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/drizzle";
import { agendaEvent, member } from "@/db/schema";
import { auth } from "@/lib/auth";

const updateAgendaEventSchema = z.object({
  start: z.string().trim().min(1).optional(),
  end: z.string().trim().min(1).optional(),
  title: z.string().trim().min(1).optional(),
  description: z.string().trim().min(1).optional(),
  location: z.string().trim().optional(),
  attendees: z.string().trim().optional(),
  isMeeting: z.boolean().optional(),
  minutes: z.string().trim().optional(),
});

async function getSessionUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return null;
  }

  return session.user;
}

async function canManageEvent(userId: string, eventId: string) {
  const event = await db.query.agendaEvent.findFirst({
    where: eq(agendaEvent.id, eventId),
  });

  if (!event) {
    return { allowed: false as const, event: null };
  }

  const membership = await db.query.member.findFirst({
    where: and(
      eq(member.userId, userId),
      eq(member.organizationId, event.organizationId)
    ),
  });

  const allowed = Boolean(
    membership && (membership.role === "owner" || membership.role === "admin")
  );

  return { allowed, event };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { eventId } = await params;

  const access = await canManageEvent(user.id, eventId);

  if (!access.allowed) {
    return NextResponse.json(
      { error: "Only owners and admins can update agenda events" },
      { status: 403 }
    );
  }

  const payload = await request.json();
  const parsed = updateAgendaEventSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid update payload",
        details: parsed.error.flatten(),
      },
      { status: 400 }
    );
  }

  await db
    .update(agendaEvent)
    .set({
      ...parsed.data,
      location: parsed.data.location ?? access.event?.location,
      attendees: parsed.data.attendees ?? access.event?.attendees,
      updatedAt: new Date(),
    })
    .where(eq(agendaEvent.id, eventId));

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { eventId } = await params;

  const access = await canManageEvent(user.id, eventId);

  if (!access.allowed) {
    return NextResponse.json(
      { error: "Only owners and admins can delete agenda events" },
      { status: 403 }
    );
  }

  await db.delete(agendaEvent).where(eq(agendaEvent.id, eventId));

  return NextResponse.json({ success: true });
}
