import { and, eq, ne } from "drizzle-orm";
import { db } from "@/db/drizzle";
import { member, team, teamHistory } from "@/db/schema";

type Membership = typeof member.$inferSelect;

export async function recordCurrentTeamSnapshot(
  organizationId: string,
  snapshotAt = new Date()
) {
  const assignments = await db.query.team.findMany({
    where: eq(team.organizationId, organizationId),
  });
  if (assignments.length === 0) {
    await db.insert(teamHistory).values({
      id: `snapshot:${crypto.randomUUID()}`,
      organizationId,
      snapshotAt,
      departmentId: null,
      memberId: `organization:${organizationId}`,
      isSubLead: false,
      isAdvisor: false,
      isTreasurer: false,
      removed: false,
    });
    return;
  }

  await db.insert(teamHistory).values(
    assignments.map((assignment) => ({
      id: crypto.randomUUID(),
      organizationId,
      snapshotAt,
      departmentId: assignment.departmentId,
      memberId: assignment.memberId,
      isSubLead: assignment.isSubLead,
      isAdvisor: assignment.isAdvisor,
      isTreasurer: assignment.isTreasurer,
      removed: false,
    }))
  );
}

export async function recordMembershipJoin(
  membership: Pick<Membership, "id" | "organizationId" | "createdAt">
) {
  await db
    .insert(teamHistory)
    .values({
      id: `membership:${membership.id}:joined`,
      organizationId: membership.organizationId,
      snapshotAt: membership.createdAt,
      departmentId: null,
      memberId: membership.id,
      isSubLead: false,
      isAdvisor: false,
      isTreasurer: false,
      removed: false,
    })
    .onConflictDoNothing();
}

export async function removeOrganizationMembership(
  organizationId: string,
  memberId: string
) {
  const target = await db.query.member.findFirst({
    where: and(
      eq(member.id, memberId),
      eq(member.organizationId, organizationId)
    ),
  });
  if (!target) {
    return { success: false as const, error: "Member not found." };
  }

  const removedAt = new Date();
  const remainingAssignments = await db.query.team.findMany({
    where: and(
      eq(team.organizationId, organizationId),
      ne(team.memberId, memberId)
    ),
  });

  await recordMembershipJoin(target);
  await db
    .insert(teamHistory)
    .values({
      id: `membership:${memberId}:removed`,
      organizationId,
      snapshotAt: removedAt,
      departmentId: null,
      memberId,
      isSubLead: false,
      isAdvisor: false,
      isTreasurer: false,
      removed: true,
    })
    .onConflictDoNothing();

  if (remainingAssignments.length > 0) {
    await db.insert(teamHistory).values(
      remainingAssignments.map((assignment) => ({
        id: crypto.randomUUID(),
        organizationId,
        snapshotAt: removedAt,
        departmentId: assignment.departmentId,
        memberId: assignment.memberId,
        isSubLead: assignment.isSubLead,
        isAdvisor: assignment.isAdvisor,
        isTreasurer: assignment.isTreasurer,
        removed: false,
      }))
    );
  }

  await db
    .delete(member)
    .where(
      and(eq(member.id, memberId), eq(member.organizationId, organizationId))
    );

  return { success: true as const, error: null };
}
