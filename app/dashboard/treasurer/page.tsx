import { redirect } from "next/navigation";
import { DashboardDataProvider } from "@/components/owner-dashboard/dashboard-data-context";
import { OwnerDashboardFrame } from "@/components/owner-dashboard/dashboard-frame";
import { OrdersPanel } from "@/components/owner-dashboard/OrdersPanel";
import { db } from "@/db/drizzle";
import { getBoardLockRequirements } from "@/lib/board-lock";
import { getOrganizations } from "@/server/organizations";
import { getTreasurerDashboardData } from "@/server/treasurer";
import { getCurrentUser } from "@/server/users";

export default async function TreasurerPage() {
  const { user } = await getCurrentUser();
  const adminMemberships = await db.query.member.findMany({
    where: (membership, { and, eq }) =>
      and(eq(membership.userId, user.id), eq(membership.role, "admin")),
    columns: { organizationId: true },
  });

  if (adminMemberships.length === 0) {
    redirect("/dashboard");
  }

  const [dashboardData, allOrganizations] = await Promise.all([
    getTreasurerDashboardData(),
    getOrganizations(),
  ]);
  const adminOrganizationIds = new Set(
    adminMemberships.map((membership) => membership.organizationId)
  );
  const organizations = allOrganizations.filter((organization) =>
    adminOrganizationIds.has(organization.id)
  );
  const teamOrganizations = await Promise.all(
    organizations.map(async (organization) => ({
      id: organization.id,
      name: organization.name,
      budget: Number(organization.budget ?? 0),
      boardLock: await getBoardLockRequirements(organization.id),
    }))
  );
  const organization = organizations[0];

  return (
    <DashboardDataProvider value={dashboardData}>
      <OwnerDashboardFrame
        activePage="treasurer"
        organizationName="Treasurer"
        organizationSlug={organization?.slug ?? ""}
        organizations={organizations}
        userEmail={user.email}
        userName={user.name}
        viewerRole="admin"
      >
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden p-4">
          <OrdersPanel
            data={{ total: 0, spent: 0, departments: [] }}
            mode="treasurer"
            teamOrganizations={teamOrganizations}
            userName={user.name}
          />
        </main>
      </OwnerDashboardFrame>
    </DashboardDataProvider>
  );
}
