import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/drizzle";
import {
  agendaDiscussionPoint,
  agendaDiscussionPointVote,
  agendaEvent,
  member,
} from "@/db/schema";
import { auth } from "@/lib/auth";

const discussionPointSchema = z.object({
  id: z.string().trim().optional(),
  topic: z.string().trim().min(1),
  notes: z.string().trim().optional().default(""),
  votingEnabled: z.boolean().default(false),
  votePrompt: z.string().trim().optional().default(""),
});

const itemTypeEnum = ["meeting", "event", "general_members_assembly"] as const;

const updateAgendaEventSchema = z.object({
  start: z.string().trim().min(1).optional(),
  end: z.string().trim().min(1).optional(),
  title: z.string().trim().min(1).optional(),
  itemType: z.enum(itemTypeEnum).optional(),
  isDeadline: z.boolean().optional(),
  allowVoting: z.boolean().optional(),
  description: z.string().trim().min(1).optional(),
  location: z.string().trim().optional(),
  attendees: z.string().trim().optional(),
  isMeeting: z.boolean().optional(),
  minutesSummary: z.string().trim().optional(),
  minutesDecisions: z.string().trim().optional(),
  minutesActions: z.string().trim().optional(),
  minutes: z.string().trim().optional(),
  discussionPoints: z.array(discussionPointSchema).optional(),
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
    return { allowed: false as const, event: null, isAdmin: false as const };
  }

  const membership = await db.query.member.findFirst({
    where: and(
      eq(member.userId, userId),
      eq(member.organizationId, event.organizationId)
    ),
  });

  if (!membership) {
    return {
      allowed: false as const,
      event,
      isAdmin: false as const,
    };
  }

  if (membership.role === "admin") {
    return {
      allowed: true as const,
      event,
      isAdmin: true as const,
    };
  }

  if (membership.role === "member") {
    return {
      allowed: event.createdByUserId === userId,
      event,
      isAdmin: false as const,
    };
  }

  if (event.createdByUserId === userId) {
    return {
      allowed: true as const,
      event,
      isAdmin: false as const,
    };
  }

  const creatorMembership = await db.query.member.findFirst({
    where: and(
      eq(member.userId, event.createdByUserId),
      eq(member.organizationId, event.organizationId)
    ),
  });

  const allowed =
    creatorMembership?.role === "owner" || creatorMembership?.role === "member";

  return {
    allowed,
    event,
    isAdmin: false as const,
  };
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Update flow handles type/deadline transitions and coordinated replacement of discussion points and votes.
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
      { error: "You are not allowed to update this agenda event" },
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

  if (typeof parsed.data.allowVoting === "boolean" && !access.isAdmin) {
    return NextResponse.json(
      { error: "Only admins can enable member voting" },
      { status: 403 }
    );
  }

  const nextItemType =
    parsed.data.itemType ?? access.event?.itemType ?? "event";
  const nextIsDeadline =
    parsed.data.isDeadline ?? access.event?.isDeadline ?? false;
  const isMeetingLike =
    nextItemType === "meeting" || nextItemType === "general_members_assembly";

  if (nextIsDeadline && nextItemType !== "event") {
    return NextResponse.json(
      { error: "Only event items can be marked as deadline" },
      { status: 400 }
    );
  }

  const nextTitle =
    parsed.data.title ??
    (nextIsDeadline ? "Deadline" : (access.event?.title ?? ""));

  let nextCategory = access.event?.category ?? "task";

  if (nextIsDeadline) {
    nextCategory = "deadline";
  } else if (nextItemType === "meeting") {
    nextCategory = "meeting";
  } else if (nextItemType === "general_members_assembly") {
    nextCategory = "review";
  } else if (nextCategory === "deadline") {
    nextCategory = "task";
  }

  let nextAllowVoting = false;

  if (!nextIsDeadline && isMeetingLike) {
    nextAllowVoting =
      parsed.data.allowVoting ?? access.event?.allowVoting ?? false;
  }

  await db
    .update(agendaEvent)
    .set({
      ...parsed.data,
      title: nextTitle,
      itemType: nextItemType,
      isDeadline: nextIsDeadline,
      allowVoting: nextAllowVoting,
      category: nextCategory,
      location: parsed.data.location ?? access.event?.location,
      attendees: parsed.data.attendees ?? access.event?.attendees,
      isMeeting: nextIsDeadline ? false : isMeetingLike,
      minutesSummary:
        parsed.data.minutesSummary ?? access.event?.minutesSummary ?? null,
      minutesDecisions:
        parsed.data.minutesDecisions ?? access.event?.minutesDecisions ?? null,
      minutesActions:
        parsed.data.minutesActions ?? access.event?.minutesActions ?? null,
      updatedAt: new Date(),
    })
    .where(eq(agendaEvent.id, eventId));

  if (parsed.data.discussionPoints) {
    await db
      .delete(agendaDiscussionPointVote)
      .where(eq(agendaDiscussionPointVote.eventId, eventId));

    await db
      .delete(agendaDiscussionPoint)
      .where(eq(agendaDiscussionPoint.eventId, eventId));

    if (
      !nextIsDeadline &&
      isMeetingLike &&
      parsed.data.discussionPoints.length > 0
    ) {
      await db.insert(agendaDiscussionPoint).values(
        parsed.data.discussionPoints.map((point, index) => ({
          id: point.id || crypto.randomUUID(),
          eventId,
          position: index,
          topic: point.topic,
          notes: point.notes || null,
          votePrompt: point.votePrompt || null,
          votingEnabled:
            (parsed.data.allowVoting ?? access.event?.allowVoting ?? false) &&
            point.votingEnabled,
          createdAt: new Date(),
          updatedAt: new Date(),
        }))
      );
    }
  }

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
      { error: "You are not allowed to delete this agenda event" },
      { status: 403 }
    );
  }

  await db.delete(agendaEvent).where(eq(agendaEvent.id, eventId));

  return NextResponse.json({ success: true });
}
