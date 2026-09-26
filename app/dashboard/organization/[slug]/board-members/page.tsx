import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { BoardMembersPage } from "@/components/owner-dashboard/board-members-page";
import { DashboardDataProvider } from "@/components/owner-dashboard/dashboard-data-context";
import { OwnerDashboardFrame } from "@/components/owner-dashboard/dashboard-frame";
import type { BoardMember } from "@/components/owner-dashboard/types";
import { db } from "@/db/drizzle";
import { board, boardHistory as boardHistoryTable } from "@/db/schema";
import {
  getOrganizationBySlug,
  getOrganizations,
} from "@/server/organizations";
import { getOwnerDashboardData } from "@/server/owner-dashboard";
import { getCurrentUser } from "@/server/users";

type Params = Promise<{ slug: string }>;

export default async function OrganizationBoardMembersPage({
  params,
}: {
  params: Params;
}) {
  const { slug } = await params;
  const { user } = await getCurrentUser();
  const organization = await getOrganizationBySlug(slug);

  if (!organization) {
    redirect("/dashboard");
  }

  const membership = organization.members.find(
    (entry) => entry.userId === user.id
  );
  if (
    !membership ||
    (membership.role !== "owner" && membership.role !== "admin")
  ) {
    redirect(`/dashboard/organization/${slug}`);
  }

  const [dashboardData, organizations, boardRows, boardHistoryRows] =
    await Promise.all([
      getOwnerDashboardData(organization.id),
      getOrganizations(),
      db.query.board.findMany({
        where: eq(board.organizationId, organization.id),
      }),
      db.query.boardHistory.findMany({
        where: eq(boardHistoryTable.organizationId, organization.id),
      }),
    ]);
  const boardMembers: BoardMember[] = boardRows.map((row) => ({
    id: row.id,
    memberId: row.memberId,
    position: row.position,
    createdAt: row.createdAt.toISOString(),
  }));
  const boardHistory = boardHistoryRows.length
    ? boardHistoryRows
    : boardRows.map((row) => ({
        id: row.id,
        organizationId: row.organizationId,
        snapshotAt: row.createdAt,
        memberId: row.memberId,
        position: row.position,
        removed: false,
      }));

  return (
    <DashboardDataProvider value={dashboardData}>
      <OwnerDashboardFrame
        activePage="board"
        organizationName={organization.name}
        organizationSlug={slug}
        organizations={organizations}
        userEmail={user.email}
        userName={user.name}
        viewerRole={membership.role === "admin" ? "admin" : "owner"}
      >
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden p-4">
          <BoardMembersPage
            boardHistory={boardHistory.map((row) => ({
              ...row,
              snapshotAt: row.snapshotAt.toISOString(),
            }))}
            initialBoardMembers={boardMembers}
            initialDepartmentIds={dashboardData.departmentIds}
            initialDepartments={dashboardData.departments}
            initialMembers={dashboardData.members}
            initialOrganizationId={dashboardData.organizationId}
            teamHistory={dashboardData.teamHistory}
          />
        </main>
      </OwnerDashboardFrame>
    </DashboardDataProvider>
  );
}
