import { and, eq, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";
import { TeamManagementPage } from "@/components/team-management-page";
import { db } from "@/db/drizzle";
import { member, organization } from "@/db/schema";
import { getBoardLockRequirements } from "@/lib/board-lock";
import { getCurrentUser } from "@/server/users";

export default async function TeamManagementRoute() {
  const { currentUser } = await getCurrentUser();
  const adminMemberships = await db.query.member.findMany({
    where: and(eq(member.userId, currentUser.id), eq(member.role, "admin")),
    columns: { organizationId: true },
  });

  if (adminMemberships.length === 0) {
    redirect("/dashboard");
  }

  const organizationIds = adminMemberships.map((entry) => entry.organizationId);
  const organizations = await db.query.organization.findMany({
    where: inArray(organization.id, organizationIds),
    columns: { id: true, name: true, budget: true },
    orderBy: (table, { asc }) => [asc(table.name)],
  });

  return (
    <TeamManagementPage
      organizations={
        await Promise.all(
          organizations.map(async (entry) => ({
            id: entry.id,
            name: entry.name,
            budget: Number(entry.budget ?? 0),
            boardLock: await getBoardLockRequirements(entry.id),
          }))
        )
      }
    />
  );
}
