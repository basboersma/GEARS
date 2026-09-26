import { and, eq } from "drizzle-orm";
import { db } from "@/db/drizzle";
import { board, boardDecision, member } from "@/db/schema";
import { getMemberPasswords } from "@/lib/organization-password";

export interface BoardLockRequirements {
  boardMemberCount: number;
  requiredPasswords: number;
  configuredBoardMemberCount: number;
  approvedCount: number;
  decisions: Array<{
    memberId: string;
    position: string;
    approval: boolean;
    canRevoke?: boolean;
  }>;
}

export async function getBoardLockRequirements(
  organizationId: string,
  currentUserId?: string
): Promise<BoardLockRequirements> {
  const assignments = await db
    .select({
      memberId: member.id,
      userId: member.userId,
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

  const configuredBoardMemberIds = new Set(
    (
      await Promise.all(
        assignments.map(async (assignment) =>
          (await getMemberPasswords(assignment.userId)).length > 0
            ? assignment.memberId
            : null
        )
      )
    ).filter((memberId): memberId is string => memberId !== null)
  );

  return {
    boardMemberCount: assignments.length,
    requiredPasswords: Math.floor(assignments.length / 2) + 1,
    configuredBoardMemberCount: assignments.filter((assignment) =>
      configuredBoardMemberIds.has(assignment.memberId)
    ).length,
    approvedCount: assignments.filter((assignment) => assignment.approval)
      .length,
    decisions: assignments.map((assignment) => ({
      memberId: assignment.memberId,
      position: assignment.position,
      approval: assignment.approval ?? false,
      canRevoke:
        currentUserId !== undefined && assignment.userId === currentUserId,
    })),
  };
}

export async function boardLock(
  organizationId: string,
  currentUserId?: string
): Promise<{
  unlocked: boolean;
  requirements: BoardLockRequirements;
}> {
  const requirements = await getBoardLockRequirements(
    organizationId,
    currentUserId
  );

  return {
    unlocked:
      requirements.boardMemberCount > 0 &&
      requirements.approvedCount >= requirements.requiredPasswords,
    requirements,
  };
}
