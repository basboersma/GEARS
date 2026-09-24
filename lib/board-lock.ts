import { eq } from "drizzle-orm";
import { db } from "@/db/drizzle";
import { board, member } from "@/db/schema";

export interface BoardLockRequirements {
  boardMemberCount: number;
  requiredPasswords: number;
  configuredBoardMemberCount: number;
}

export async function getBoardLockRequirements(
  organizationId: string
): Promise<BoardLockRequirements> {
  const assignments = await db
    .select({ memberId: member.id, password: member.password })
    .from(board)
    .innerJoin(member, eq(board.memberId, member.id))
    .where(eq(board.organizationId, organizationId));

  return {
    boardMemberCount: assignments.length,
    requiredPasswords: Math.floor(assignments.length / 2) + 1,
    configuredBoardMemberCount: assignments.filter((assignment) =>
      Boolean(assignment.password)
    ).length,
  };
}

export async function boardLock(
  organizationId: string,
  passwords: string[]
): Promise<{
  unlocked: boolean;
  validPasswords: number;
  requirements: BoardLockRequirements;
}> {
  const assignments = await db
    .select({ memberId: member.id, password: member.password })
    .from(board)
    .innerJoin(member, eq(board.memberId, member.id))
    .where(eq(board.organizationId, organizationId));
  const requirements: BoardLockRequirements = {
    boardMemberCount: assignments.length,
    requiredPasswords: Math.floor(assignments.length / 2) + 1,
    configuredBoardMemberCount: assignments.filter((assignment) =>
      Boolean(assignment.password)
    ).length,
  };

  const usedMemberIds = new Set<string>();
  for (const password of passwords) {
    const assignment = assignments.find(
      (candidate) =>
        !usedMemberIds.has(candidate.memberId) &&
        Boolean(password) &&
        candidate.password === password
    );
    if (assignment) {
      usedMemberIds.add(assignment.memberId);
    }
  }
  const validPasswords = usedMemberIds.size;

  return {
    unlocked:
      assignments.length > 0 &&
      validPasswords >= requirements.requiredPasswords,
    validPasswords,
    requirements,
  };
}
