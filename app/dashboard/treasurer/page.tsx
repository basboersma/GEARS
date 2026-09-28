import { and, eq, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";
import { DashboardDataProvider } from "@/components/owner-dashboard/dashboard-data-context";
import { OwnerDashboardFrame } from "@/components/owner-dashboard/dashboard-frame";
import { OrdersPanel } from "@/components/owner-dashboard/OrdersPanel";
import { db } from "@/db/drizzle";
import { member } from "@/db/schema";
import { getBoardLockRequirements } from "@/lib/board-lock";
import { getOrganizations } from "@/server/organizations";
import { getTreasurerDashboardData } from "@/server/treasurer";
import { getCurrentUser } from "@/server/users";

export default async function TreasurerPage({
  searchParams,
}: {
  searchParams: Promise<{
    organizationId?: string;
    permissionRequestId?: string;
  }>;
}) {
  const query = await searchParams;
  const { user } = await getCurrentUser();
  const memberships = await db.query.member.findMany({
    where: and(
      eq(member.userId, user.id),
      inArray(member.role, ["admin", "treasurer"])
    ),
    columns: { organizationId: true, role: true },
  });

  if (memberships.length === 0) {
    redirect("/dashboard");
  }

  const organizationIds = memberships.map(
    (membership) => membership.organizationId
  );
  const isAdmin = memberships.some((membership) => membership.role === "admin");

  const [dashboardData, allOrganizations] = await Promise.all([
    getTreasurerDashboardData(organizationIds),
    getOrganizations(),
  ]);
  const allowedOrganizationIds = new Set(organizationIds);
  const organizations = allOrganizations.filter((organization) =>
    allowedOrganizationIds.has(organization.id)
  );
  const teamOrganizations = await Promise.all(
    organizations.map(async (organization) => ({
      id: organization.id,
      name: organization.name,
      budget: Number(organization.budget ?? 0),
      boardLock: await getBoardLockRequirements(organization.id, user.id),
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
        viewerRole={isAdmin ? "admin" : "treasurer"}
      >
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden p-4">
          <OrdersPanel
            data={{ total: 0, spent: 0, departments: [] }}
            mode="treasurer"
            permissionOrganizationId={query.organizationId}
            permissionRequestId={query.permissionRequestId}
            teamOrganizations={teamOrganizations}
            userName={user.name}
          />
        </main>
      </OwnerDashboardFrame>
    </DashboardDataProvider>
  );
}
