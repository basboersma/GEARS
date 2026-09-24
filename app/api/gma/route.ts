// biome-ignore-all lint: GMA state transitions are intentionally centralized in this route.
import { and, desc, eq, gte, inArray } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/drizzle";
import {
  gmaMotion,
  gmaMotionVote,
  gmaPresence,
  gmaSession,
  member,
  user,
} from "@/db/schema";
import { auth } from "@/lib/auth";
import { boardLock, getBoardLockRequirements } from "@/lib/board-lock";

const presenceWindowMs = 30_000;
const motionSchema = z.object({
  action: z.literal("suggest"),
  organizationId: z.string().min(1),
  title: z.string().trim().min(1).max(200),
  text: z.string().trim().max(5000).default(""),
});
const sessionSchema = z.object({
  action: z.literal("create-session"),
  organizationId: z.string().min(1),
  startDate: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  boardPasswords: z.array(z.string()).min(1),
});
const voteSchema = z.object({
  action: z.literal("vote"),
  motionId: z.string().min(1),
  value: z.enum(["for", "against", "abstain"]),
});
const manageSchema = z.object({
  action: z.enum([
    "push-active",
    "start",
    "pause",
    "add-time",
    "remove-time",
    "end",
  ]),
  motionId: z.string().min(1).optional(),
});

async function getUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

function getLatestSession(organizationId: string) {
  return db.query.gmaSession.findFirst({
    where: eq(gmaSession.organizationId, organizationId),
    orderBy: [desc(gmaSession.createdAt)],
  });
}

async function getMembership(userId: string, organizationId: string) {
  return db.query.member.findFirst({
    where: and(
      eq(member.userId, userId),
      eq(member.organizationId, organizationId)
    ),
  });
}

function remainingSeconds(motion: typeof gmaMotion.$inferSelect) {
  if (
    motion.status !== "active" ||
    motion.timerPaused ||
    !motion.timerStartedAt
  ) {
    return motion.timerSeconds;
  }
  return Math.max(
    0,
    motion.timerSeconds -
      Math.floor((Date.now() - motion.timerStartedAt.getTime()) / 1000)
  );
}

async function stateFor(
  userId: string,
  session: typeof gmaSession.$inferSelect
) {
  const now = new Date();
  await db
    .insert(gmaPresence)
    .values({ sessionId: session.id, userId, lastSeenAt: now })
    .onConflictDoUpdate({
      target: [gmaPresence.sessionId, gmaPresence.userId],
      set: { lastSeenAt: now },
    });

  const presentSince = new Date(Date.now() - presenceWindowMs);
  const present = await db.query.gmaPresence.findMany({
    where: and(
      eq(gmaPresence.sessionId, session.id),
      gte(gmaPresence.lastSeenAt, presentSince)
    ),
  });
  const motions = await db.query.gmaMotion.findMany({
    where: eq(gmaMotion.sessionId, session.id),
    orderBy: [desc(gmaMotion.createdAt)],
  });
  const motionIds = motions.map((motion) => motion.id);
  const votes = motionIds.length
    ? await db.query.gmaMotionVote.findMany({
        where: inArray(gmaMotionVote.motionId, motionIds),
      })
    : [];
  const authors = motions.length
    ? await db.query.user.findMany({
        where: inArray(
          user.id,
          motions.map((motion) => motion.authorId)
        ),
      })
    : [];
  const authorNames = new Map(
    authors.map((author) => [author.id, author.name])
  );
  const votesByMotion = new Map<string, typeof votes>();
  for (const vote of votes) {
    votesByMotion.set(vote.motionId, [
      ...(votesByMotion.get(vote.motionId) ?? []),
      vote,
    ]);
  }

  return {
    session: {
      ...session,
      presentCount: present.length,
      requiredVotes: Math.max(1, Math.ceil(present.length * 0.3)),
    },
    motions: motions.map((motion) => {
      const motionVotes = votesByMotion.get(motion.id) ?? [];
      return {
        ...motion,
        author: authorNames.get(motion.authorId) ?? "Member",
        votesFor: motionVotes.filter((vote) => vote.value === "for").length,
        votesAgainst: motionVotes.filter((vote) => vote.value === "against")
          .length,
        votesAbstain: motionVotes.filter((vote) => vote.value === "abstain")
          .length,
        votesTotal: motionVotes.length,
        currentUserVote:
          motionVotes.find((vote) => vote.userId === userId)?.value ?? null,
        remainingSeconds: remainingSeconds(motion),
      };
    }),
  };
}

export async function GET(request: Request) {
  const currentUser = await getUser();
  if (!currentUser)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const organizationId = new URL(request.url).searchParams.get(
    "organizationId"
  );
  if (!organizationId)
    return NextResponse.json(
      { error: "organizationId is required" },
      { status: 400 }
    );
  const membership = await getMembership(currentUser.id, organizationId);
  if (!membership)
    return NextResponse.json(
      { error: "Organization membership required" },
      { status: 403 }
    );
  const session = await getLatestSession(organizationId);
  const boardLockRequirements = await getBoardLockRequirements(organizationId);
  return NextResponse.json(
    session
      ? {
          ...(await stateFor(currentUser.id, session)),
          boardLock: boardLockRequirements,
        }
      : { session: null, motions: [], boardLock: boardLockRequirements }
  );
}

export async function POST(request: Request) {
  const currentUser = await getUser();
  if (!currentUser)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await request.json();
  const action = payload?.action;

  if (action === "create-session") {
    const parsed = sessionSchema.safeParse(payload);
    if (!parsed.success)
      return NextResponse.json(
        { error: "Invalid GMA schedule" },
        { status: 400 }
      );
    const membership = await getMembership(
      currentUser.id,
      parsed.data.organizationId
    );
    if (!(membership?.role === "owner" || membership?.role === "admin"))
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    const lock = await boardLock(
      parsed.data.organizationId,
      parsed.data.boardPasswords
    );
    if (!lock.unlocked) {
      return NextResponse.json(
        {
          error: `Enter ${lock.requirements.requiredPasswords} different board member passwords to create the GMA.`,
          boardLock: lock.requirements,
        },
        { status: 403 }
      );
    }
    const session = {
      id: crypto.randomUUID(),
      organizationId: parsed.data.organizationId,
      createdByUserId: currentUser.id,
      startDate: parsed.data.startDate,
      startTime: parsed.data.startTime,
      endTime: parsed.data.endTime,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.insert(gmaSession).values(session);
    return NextResponse.json({ session });
  }

  const session = await getLatestSession(
    (payload as { organizationId?: string }).organizationId ?? ""
  );
  if (!session)
    return NextResponse.json(
      { error: "No active GMA session" },
      { status: 404 }
    );
  const membership = await getMembership(
    currentUser.id,
    session.organizationId
  );
  if (!membership)
    return NextResponse.json(
      { error: "Organization membership required" },
      { status: 403 }
    );

  if (action === "suggest") {
    const parsed = motionSchema.safeParse({
      ...payload,
      organizationId: session.organizationId,
    });
    if (!parsed.success)
      return NextResponse.json({ error: "Invalid motion" }, { status: 400 });
    const motion = {
      id: crypto.randomUUID(),
      sessionId: session.id,
      organizationId: session.organizationId,
      authorId: currentUser.id,
      title: parsed.data.title,
      text: parsed.data.text,
      status: "suggested" as const,
      timerSeconds: 300,
      timerPaused: true,
      timerStartedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.insert(gmaMotion).values(motion);
    return NextResponse.json({
      success: true,
      state: await stateFor(currentUser.id, session),
    });
  }

  if (action === "vote") {
    const parsed = voteSchema.safeParse(payload);
    if (!parsed.success)
      return NextResponse.json({ error: "Invalid vote" }, { status: 400 });
    const motion = await db.query.gmaMotion.findFirst({
      where: and(
        eq(gmaMotion.id, parsed.data.motionId),
        eq(gmaMotion.sessionId, session.id)
      ),
    });
    if (
      !motion ||
      (motion.status !== "suggested" && motion.status !== "active")
    )
      return NextResponse.json(
        { error: "This motion is no longer accepting suggestions" },
        { status: 400 }
      );
    const existing = await db.query.gmaMotionVote.findFirst({
      where: and(
        eq(gmaMotionVote.motionId, motion.id),
        eq(gmaMotionVote.userId, currentUser.id)
      ),
    });
    if (existing)
      await db
        .update(gmaMotionVote)
        .set({ value: parsed.data.value, updatedAt: new Date() })
        .where(eq(gmaMotionVote.id, existing.id));
    else
      await db.insert(gmaMotionVote).values({
        id: crypto.randomUUID(),
        motionId: motion.id,
        sessionId: session.id,
        userId: currentUser.id,
        value: parsed.data.value,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    const [voteRows, presentRows] = await Promise.all([
      db.query.gmaMotionVote.findMany({
        where: eq(gmaMotionVote.motionId, motion.id),
      }),
      db.query.gmaPresence.findMany({
        where: and(
          eq(gmaPresence.sessionId, session.id),
          gte(gmaPresence.lastSeenAt, new Date(Date.now() - presenceWindowMs))
        ),
      }),
    ]);
    if (voteRows.length >= Math.max(1, Math.ceil(presentRows.length * 0.3)))
      await db
        .update(gmaMotion)
        .set({ status: "pending", updatedAt: new Date() })
        .where(eq(gmaMotion.id, motion.id));
    return NextResponse.json({
      success: true,
      state: await stateFor(currentUser.id, session),
    });
  }

  const parsed = manageSchema.safeParse(payload);
  if (
    !(
      parsed.success &&
      (membership.role === "owner" || membership.role === "admin")
    )
  )
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 }
    );
  const motion = parsed.data.motionId
    ? await db.query.gmaMotion.findFirst({
        where: and(
          eq(gmaMotion.id, parsed.data.motionId),
          eq(gmaMotion.sessionId, session.id)
        ),
      })
    : await db.query.gmaMotion.findFirst({
        where: and(
          eq(gmaMotion.sessionId, session.id),
          eq(gmaMotion.status, "active")
        ),
      });
  if (!motion)
    return NextResponse.json({ error: "Motion not found" }, { status: 404 });
  const now = new Date();
  if (parsed.data.action === "push-active") {
    await db
      .update(gmaMotion)
      .set({ status: "pending", updatedAt: now })
      .where(
        and(eq(gmaMotion.sessionId, session.id), eq(gmaMotion.status, "active"))
      );
    await db
      .update(gmaMotion)
      .set({
        status: "active",
        timerSeconds: 300,
        timerPaused: true,
        timerStartedAt: null,
        updatedAt: now,
      })
      .where(eq(gmaMotion.id, motion.id));
  } else if (parsed.data.action === "start")
    await db
      .update(gmaMotion)
      .set({ timerPaused: false, timerStartedAt: now, updatedAt: now })
      .where(eq(gmaMotion.id, motion.id));
  else if (parsed.data.action === "pause")
    await db
      .update(gmaMotion)
      .set({
        timerSeconds: remainingSeconds(motion),
        timerPaused: true,
        timerStartedAt: null,
        updatedAt: now,
      })
      .where(eq(gmaMotion.id, motion.id));
  else if (
    parsed.data.action === "add-time" ||
    parsed.data.action === "remove-time"
  )
    await db
      .update(gmaMotion)
      .set({
        timerSeconds: Math.max(
          0,
          remainingSeconds(motion) +
            (parsed.data.action === "add-time" ? 30 : -30)
        ),
        timerStartedAt: motion.timerPaused ? null : now,
        updatedAt: now,
      })
      .where(eq(gmaMotion.id, motion.id));
  else
    await db
      .update(gmaMotion)
      .set({
        status: "completed",
        timerPaused: true,
        timerStartedAt: null,
        updatedAt: now,
      })
      .where(eq(gmaMotion.id, motion.id));
  return NextResponse.json({
    success: true,
    state: await stateFor(currentUser.id, session),
  });
}
