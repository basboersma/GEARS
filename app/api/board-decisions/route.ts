import { and, eq, inArray } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/drizzle";
import { board, boardDecision, member } from "@/db/schema";
import { auth } from "@/lib/auth";

const payloadSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("verify"),
    organizationId: z.string().min(1),
    password: z.string().min(1),
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

async function getDecisions(organizationId: string) {
  const rows = await db
    .select({
      memberId: board.memberId,
      position: board.position,
      approval: boardDecision.approval,
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

  return NextResponse.json({ decisions: await getDecisions(organizationId) });
}

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
  if (!(await getAdminMembership(currentUser.id, parsed.data.organizationId))) {
    return NextResponse.json(
      { error: "Owner access required" },
      { status: 403 }
    );
  }

  if (parsed.data.action === "verify") {
    const matchingBoardMember = await db
      .select({ memberId: board.memberId, position: board.position })
      .from(board)
      .innerJoin(member, eq(board.memberId, member.id))
      .where(
        and(
          eq(board.organizationId, parsed.data.organizationId),
          eq(member.password, parsed.data.password)
        )
      )
      .then((rows) => rows[0]);

    if (!matchingBoardMember) {
      return NextResponse.json(
        { valid: false, error: "That password does not match a board member." },
        { status: 400 }
      );
    }

    const existingDecision = await db.query.boardDecision.findFirst({
      where: and(
        eq(boardDecision.organizationId, parsed.data.organizationId),
        eq(boardDecision.memberId, matchingBoardMember.memberId)
      ),
    });
    if (existingDecision?.approval) {
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

    return NextResponse.json({
      valid: true,
      memberId: matchingBoardMember.memberId,
      position: matchingBoardMember.position,
      decisions: await getDecisions(parsed.data.organizationId),
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
    decisions: await getDecisions(parsed.data.organizationId),
  });
}
