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

const voteSchema = z.object({
  value: z.enum(["for", "against", "abstain"]),
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

async function canVoteOnEvent(userId: string, eventId: string) {
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

  return { allowed: Boolean(membership), event };
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventId: string; pointId: string }> }
) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { eventId, pointId } = await params;

  const access = await canVoteOnEvent(user.id, eventId);

  if (!(access.allowed && access.event)) {
    return NextResponse.json(
      { error: "Only organization members can vote" },
      { status: 403 }
    );
  }

  if (!access.event.allowVoting) {
    return NextResponse.json(
      { error: "Voting is disabled for this agenda item" },
      { status: 400 }
    );
  }

  const point = await db.query.agendaDiscussionPoint.findFirst({
    where: and(
      eq(agendaDiscussionPoint.id, pointId),
      eq(agendaDiscussionPoint.eventId, eventId)
    ),
  });

  if (!point) {
    return NextResponse.json(
      { error: "Discussion point not found" },
      { status: 404 }
    );
  }

  if (!point.votingEnabled) {
    return NextResponse.json(
      { error: "Voting is not enabled for this discussion point" },
      { status: 400 }
    );
  }

  const payload = await request.json();
  const parsed = voteSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid vote payload",
        details: parsed.error.flatten(),
      },
      { status: 400 }
    );
  }

  const existingVote = await db.query.agendaDiscussionPointVote.findFirst({
    where: and(
      eq(agendaDiscussionPointVote.discussionPointId, pointId),
      eq(agendaDiscussionPointVote.userId, user.id)
    ),
  });

  if (existingVote) {
    await db
      .update(agendaDiscussionPointVote)
      .set({
        value: parsed.data.value,
        updatedAt: new Date(),
      })
      .where(eq(agendaDiscussionPointVote.id, existingVote.id));
  } else {
    await db.insert(agendaDiscussionPointVote).values({
      id: crypto.randomUUID(),
      discussionPointId: pointId,
      eventId,
      organizationId: access.event.organizationId,
      userId: user.id,
      value: parsed.data.value,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  const votes = await db.query.agendaDiscussionPointVote.findMany({
    where: eq(agendaDiscussionPointVote.discussionPointId, pointId),
  });

  return NextResponse.json({
    success: true,
    votes: {
      for: votes.filter((vote) => vote.value === "for").length,
      against: votes.filter((vote) => vote.value === "against").length,
      abstain: votes.filter((vote) => vote.value === "abstain").length,
      currentUserVote:
        votes.find((vote) => vote.userId === user.id)?.value ?? null,
    },
  });
}
