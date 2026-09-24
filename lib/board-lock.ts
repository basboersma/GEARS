import { and, eq } from "drizzle-orm";
import { db } from "@/db/drizzle";
import { board, boardDecision, member } from "@/db/schema";

export interface BoardLockRequirements {
  boardMemberCount: number;
  requiredPasswords: number;
  configuredBoardMemberCount: number;
  approvedCount: number;
  decisions: Array<{
    memberId: string;
    position: string;
    approval: boolean;
  }>;
}

export async function getBoardLockRequirements(
  organizationId: string
): Promise<BoardLockRequirements> {
  const assignments = await db
    .select({
      memberId: member.id,
      password: member.password,
      position: board.position,
      approval: boardDecision.approval,
    })
    .from(board)
    .innerJoin(member, eq(board.memberId, member.id))
    .leftJoin(
      boardDecision,
      and(
        eq(boardDecision.organizationId, board.organizationId),
        eq(boardDecision.memberId, board.memberId)
      )
    )
    .where(eq(board.organizationId, organizationId));

  return {
    boardMemberCount: assignments.length,
    requiredPasswords: Math.floor(assignments.length / 2) + 1,
    configuredBoardMemberCount: assignments.filter((assignment) =>
      Boolean(assignment.password)
    ).length,
    approvedCount: assignments.filter((assignment) => assignment.approval)
      .length,
    decisions: assignments.map((assignment) => ({
      memberId: assignment.memberId,
      position: assignment.position,
      approval: assignment.approval ?? false,
    })),
  };
}

export async function boardLock(organizationId: string): Promise<{
  unlocked: boolean;
  requirements: BoardLockRequirements;
}> {
  const requirements = await getBoardLockRequirements(organizationId);

  return {
    unlocked:
      requirements.boardMemberCount > 0 &&
      requirements.approvedCount >= requirements.requiredPasswords,
    requirements,
  };
}
