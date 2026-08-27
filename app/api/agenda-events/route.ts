import { and, asc, eq, inArray } from "drizzle-orm";
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

const categoryEnum = [
  "meeting",
  "review",
  "task",
  "deadline",
  "break",
  "personal",
] as const;

const itemTypeEnum = ["meeting", "event", "general_members_assembly"] as const;

const discussionPointSchema = z.object({
  topic: z.string().trim().min(1),
  notes: z.string().trim().optional().default(""),
  votingEnabled: z.boolean().default(false),
  votePrompt: z.string().trim().optional().default(""),
});

const createAgendaEventSchema = z.object({
  organizationId: z.string().min(1),
  start: z.string().trim().min(1),
  end: z.string().trim().min(1),
  title: z.string().trim().optional().default(""),
  itemType: z.enum(itemTypeEnum),
  isDeadline: z.boolean().default(false),
  allowVoting: z.boolean().default(false),
  category: z.enum(categoryEnum).optional(),
  description: z.string().trim().min(1),
  location: z.string().trim().optional().default(""),
  attendees: z.string().trim().optional().default(""),
  minutesSummary: z.string().trim().optional().default(""),
  minutesDecisions: z.string().trim().optional().default(""),
  minutesActions: z.string().trim().optional().default(""),
  discussionPoints: z.array(discussionPointSchema).default([]),
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

async function canManageAgenda(userId: string, organizationId: string) {
  const membership = await db.query.member.findFirst({
    where: and(
      eq(member.userId, userId),
      eq(member.organizationId, organizationId)
    ),
  });

  if (!membership) {
    return false;
  }

  return membership.role === "owner" || membership.role === "admin";
}

export async function GET(request: Request) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get("organizationId");

  if (!organizationId) {
    return NextResponse.json(
      { error: "organizationId is required" },
      { status: 400 }
    );
  }

  const hasAccess = await canManageAgenda(user.id, organizationId);

  if (!hasAccess) {
    return NextResponse.json(
      { error: "Only owners and admins can view agenda" },
      { status: 403 }
    );
  }

  const events = await db.query.agendaEvent.findMany({
    where: eq(agendaEvent.organizationId, organizationId),
    orderBy: [asc(agendaEvent.start), asc(agendaEvent.createdAt)],
  });

  const eventIds = events.map((event) => event.id);

  if (eventIds.length === 0) {
    return NextResponse.json({ events: [] });
  }

  const points = await db.query.agendaDiscussionPoint.findMany({
    where: inArray(agendaDiscussionPoint.eventId, eventIds),
    orderBy: [
      asc(agendaDiscussionPoint.position),
      asc(agendaDiscussionPoint.createdAt),
    ],
  });

  const pointIds = points.map((point) => point.id);

  const votes =
    pointIds.length === 0
      ? []
      : await db.query.agendaDiscussionPointVote.findMany({
          where: inArray(agendaDiscussionPointVote.discussionPointId, pointIds),
        });

  const pointsByEventId = new Map<string, typeof points>();
  const votesByPointId = new Map<string, typeof votes>();

  for (const point of points) {
    const list = pointsByEventId.get(point.eventId) ?? [];
    list.push(point);
    pointsByEventId.set(point.eventId, list);
  }

  for (const vote of votes) {
    const list = votesByPointId.get(vote.discussionPointId) ?? [];
    list.push(vote);
    votesByPointId.set(vote.discussionPointId, list);
  }

  const eventWithPoints = events.map((event) => {
    const eventPoints = (pointsByEventId.get(event.id) ?? []).map((point) => {
      const pointVotes = votesByPointId.get(point.id) ?? [];

      return {
        ...point,
        votes: {
          for: pointVotes.filter((vote) => vote.value === "for").length,
          against: pointVotes.filter((vote) => vote.value === "against").length,
          abstain: pointVotes.filter((vote) => vote.value === "abstain").length,
          currentUserVote:
            pointVotes.find((vote) => vote.userId === user.id)?.value ?? null,
        },
      };
    });

    return {
      ...event,
      discussionPoints: eventPoints,
    };
  });

  return NextResponse.json({ events: eventWithPoints });
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: This handler validates multiple item types and derives persisted shape based on type/deadline rules.
export async function POST(request: Request) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json();
  const parsed = createAgendaEventSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid agenda event payload",
        details: parsed.error.flatten(),
      },
      { status: 400 }
    );
  }

  const hasAccess = await canManageAgenda(user.id, parsed.data.organizationId);

  if (!hasAccess) {
    return NextResponse.json(
      { error: "Only owners and admins can create agenda events" },
      { status: 403 }
    );
  }

  const itemType = parsed.data.itemType;
  const isDeadline = parsed.data.isDeadline;
  const isMeetingLike =
    itemType === "meeting" || itemType === "general_members_assembly";

  if (!isDeadline && parsed.data.title.trim() === "") {
    return NextResponse.json(
      { error: "title is required for non-deadline items" },
      { status: 400 }
    );
  }

  if (isDeadline && itemType !== "event") {
    return NextResponse.json(
      { error: "Only event items can be marked as deadline" },
      { status: 400 }
    );
  }

  const eventId = crypto.randomUUID();

  let derivedCategory: (typeof categoryEnum)[number] = "task";

  if (isDeadline) {
    derivedCategory = "deadline";
  } else if (itemType === "meeting") {
    derivedCategory = "meeting";
  } else if (itemType === "general_members_assembly") {
    derivedCategory = "review";
  }

  await db.insert(agendaEvent).values({
    id: eventId,
    organizationId: parsed.data.organizationId,
    createdByUserId: user.id,
    start: parsed.data.start,
    end: parsed.data.end,
    title: isDeadline ? "Deadline" : parsed.data.title,
    itemType,
    isDeadline,
    allowVoting: isMeetingLike ? parsed.data.allowVoting : false,
    category: parsed.data.category ?? derivedCategory,
    description: parsed.data.description,
    location: isDeadline ? null : parsed.data.location || null,
    attendees: isDeadline ? null : parsed.data.attendees || null,
    isMeeting: isMeetingLike,
    minutes: null,
    minutesSummary: isMeetingLike ? parsed.data.minutesSummary || null : null,
    minutesDecisions: isMeetingLike
      ? parsed.data.minutesDecisions || null
      : null,
    minutesActions: isMeetingLike ? parsed.data.minutesActions || null : null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  if (isMeetingLike && parsed.data.discussionPoints.length > 0) {
    await db.insert(agendaDiscussionPoint).values(
      parsed.data.discussionPoints.map((point, index) => ({
        id: crypto.randomUUID(),
        eventId,
        position: index,
        topic: point.topic,
        notes: point.notes || null,
        votePrompt: point.votePrompt || null,
        votingEnabled: parsed.data.allowVoting && point.votingEnabled,
        createdAt: new Date(),
        updatedAt: new Date(),
      }))
    );
  }

  return NextResponse.json({ success: true });
}
