import { and, eq, inArray } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/drizzle";
import {
  board,
  boardDecision,
  boardPermissionRequest,
  boardPermissionVote,
  dashboardNotification,
  gmaSession,
  member,
  organization,
} from "@/db/schema";
import { auth } from "@/lib/auth";
import { getMemberPasswords } from "@/lib/organization-password";

const payloadSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("verify"),
    organizationId: z.string().min(1),
    password: z.string().min(1),
    permissionRequestId: z.string().optional(),
  }),
  z.object({
    action: z.literal("toggle"),
    organizationId: z.string().min(1),
    memberId: z.string().min(1),
  }),
]);

async function getCurrentUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

function getAdminMembership(userId: string, organizationId: string) {
  return db.query.member.findFirst({
    where: and(
      eq(member.userId, userId),
      eq(member.organizationId, organizationId),
      inArray(member.role, ["owner", "admin"])
    ),
  });
}

async function recordPermissionVote(
  request: typeof boardPermissionRequest.$inferSelect,
  memberId: string
) {
  await db
    .insert(boardPermissionVote)
    .values({
      id: crypto.randomUUID(),
      requestId: request.id,
      memberId,
      createdAt: new Date(),
    })
    .onConflictDoNothing();
  const [votes, assignments] = await Promise.all([
    db.query.boardPermissionVote.findMany({
      where: eq(boardPermissionVote.requestId, request.id),
    }),
    db.query.board.findMany({
      where: eq(board.organizationId, request.organizationId),
    }),
  ]);
  if (votes.length < Math.floor(assignments.length / 2) + 1) {
    return;
  }

  const target = JSON.parse(request.target) as {
    budget?: number;
    startDate?: string;
    startTime?: string;
    endTime?: string;
  };
  if (request.action === "budget" && target.budget !== undefined) {
    await db
      .update(organization)
      .set({ budget: target.budget.toFixed(2) })
      .where(eq(organization.id, request.organizationId));
  }
  if (
    request.action === "gma" &&
    target.startDate &&
    target.startTime &&
    target.endTime
  ) {
    await db.insert(gmaSession).values({
      id: crypto.randomUUID(),
      organizationId: request.organizationId,
      createdByUserId: request.requestedByUserId,
      startDate: target.startDate,
      startTime: target.startTime,
      endTime: target.endTime,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  await db
    .update(boardPermissionRequest)
    .set({ status: "approved", updatedAt: new Date() })
    .where(eq(boardPermissionRequest.id, request.id));
  await db
    .update(dashboardNotification)
    .set({ read: true })
    .where(eq(dashboardNotification.requestId, request.id));
}

async function getDecisions(organizationId: string, currentUserId: string) {
  const rows = await db
    .select({
      memberId: board.memberId,
      position: board.position,
      approval: boardDecision.approval,
      userId: member.userId,
    })
    .from(board)
    .leftJoin(
      boardDecision,
      and(
        eq(boardDecision.organizationId, board.organizationId),
        eq(boardDecision.memberId, board.memberId)
      )
    )
    .where(eq(board.organizationId, organizationId));

  return rows.map((row) => ({
    memberId: row.memberId,
    position: row.position,
    approval: row.approval ?? false,
    canRevoke: row.userId === currentUserId,
  }));
}

export async function GET(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const organizationId = new URL(request.url).searchParams.get(
    "organizationId"
  );
  if (!organizationId) {
    return NextResponse.json(
      { error: "organizationId is required" },
      { status: 400 }
    );
  }
  if (!(await getAdminMembership(currentUser.id, organizationId))) {
    return NextResponse.json(
      { error: "Owner access required" },
      { status: 403 }
    );
  }

  return NextResponse.json({
    decisions: await getDecisions(organizationId, currentUser.id),
  });
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Handles two authenticated board-lock actions.
export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = payloadSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid board decision" },
      { status: 400 }
    );
  }
  const organizationMembership = await db.query.member.findFirst({
    where: and(
      eq(member.userId, currentUser.id),
      eq(member.organizationId, parsed.data.organizationId)
    ),
  });
  if (!organizationMembership) {
    return NextResponse.json(
      { error: "Organization membership required" },
      { status: 403 }
    );
  }

  if (parsed.data.action === "verify") {
    const boardMembers = await db
      .select({
        memberId: board.memberId,
        position: board.position,
        userId: member.userId,
      })
      .from(board)
      .innerJoin(member, eq(board.memberId, member.id))
      .where(eq(board.organizationId, parsed.data.organizationId));
    let matchingBoardMember: (typeof boardMembers)[number] | undefined;
    for (const boardMember of boardMembers) {
      if (
        (await getMemberPasswords(boardMember.userId)).includes(
          parsed.data.password
        )
      ) {
        matchingBoardMember = boardMember;
        break;
      }
    }

    if (!matchingBoardMember) {
      return NextResponse.json(
        { valid: false, error: "That password does not match a board member." },
        { status: 400 }
      );
    }

    const permissionRequest = parsed.data.permissionRequestId
      ? await db.query.boardPermissionRequest.findFirst({
          where: and(
            eq(boardPermissionRequest.id, parsed.data.permissionRequestId),
            eq(
              boardPermissionRequest.organizationId,
              parsed.data.organizationId
            ),
            eq(boardPermissionRequest.status, "pending")
          ),
        })
      : null;
    if (parsed.data.permissionRequestId && !permissionRequest) {
      return NextResponse.json(
        {
          valid: false,
          error: "This board permission request is no longer active.",
        },
        { status: 410 }
      );
    }
    if (permissionRequest && permissionRequest.expiresAt <= new Date()) {
      await db
        .update(boardPermissionRequest)
        .set({ status: "expired", updatedAt: new Date() })
        .where(eq(boardPermissionRequest.id, permissionRequest.id));
      return NextResponse.json(
        { valid: false, error: "This board permission request has expired." },
        { status: 410 }
      );
    }

    const existingDecision = await db.query.boardDecision.findFirst({
      where: and(
        eq(boardDecision.organizationId, parsed.data.organizationId),
        eq(boardDecision.memberId, matchingBoardMember.memberId)
      ),
    });
    if (existingDecision?.approval && !permissionRequest) {
      return NextResponse.json(
        { valid: false, error: "This board member has already approved." },
        { status: 400 }
      );
    }

    await db
      .insert(boardDecision)
      .values({
        id: crypto.randomUUID(),
        organizationId: parsed.data.organizationId,
        memberId: matchingBoardMember.memberId,
        approval: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [boardDecision.organizationId, boardDecision.memberId],
        set: { approval: true, updatedAt: new Date() },
      });

    if (permissionRequest) {
      await recordPermissionVote(
        permissionRequest,
        matchingBoardMember.memberId
      );
    }

    return NextResponse.json({
      valid: true,
      memberId: matchingBoardMember.memberId,
      position: matchingBoardMember.position,
      decisions: await getDecisions(parsed.data.organizationId, currentUser.id),
    });
  }

  const assignedBoardMember = await db.query.board.findFirst({
    where: and(
      eq(board.organizationId, parsed.data.organizationId),
      eq(board.memberId, parsed.data.memberId)
    ),
  });
  if (!assignedBoardMember) {
    return NextResponse.json(
      { error: "Board member not found" },
      { status: 404 }
    );
  }

  const assignedMember = await db.query.member.findFirst({
    where: eq(member.id, assignedBoardMember.memberId),
  });
  if (!assignedMember || assignedMember.userId !== currentUser.id) {
    return NextResponse.json(
      { error: "Only the approving board member can revoke this vote." },
      { status: 403 }
    );
  }

  const existingDecision = await db.query.boardDecision.findFirst({
    where: and(
      eq(boardDecision.organizationId, parsed.data.organizationId),
      eq(boardDecision.memberId, parsed.data.memberId)
    ),
  });
  await db
    .insert(boardDecision)
    .values({
      id: crypto.randomUUID(),
      organizationId: parsed.data.organizationId,
      memberId: parsed.data.memberId,
      approval: !(existingDecision?.approval ?? true),
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [boardDecision.organizationId, boardDecision.memberId],
      set: {
        approval: !(existingDecision?.approval ?? true),
        updatedAt: new Date(),
      },
    });

  return NextResponse.json({
    valid: true,
    memberId: parsed.data.memberId,
    position: assignedBoardMember.position,
    decisions: await getDecisions(parsed.data.organizationId, currentUser.id),
  });
}
