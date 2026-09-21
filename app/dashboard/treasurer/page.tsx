import { redirect } from "next/navigation";
import { DashboardDataProvider } from "@/components/owner-dashboard/dashboard-data-context";
import { OwnerDashboardFrame } from "@/components/owner-dashboard/dashboard-frame";
import { OrdersPanel } from "@/components/owner-dashboard/OrdersPanel";
import { db } from "@/db/drizzle";
import { getOrganizations } from "@/server/organizations";
import { getTreasurerDashboardData } from "@/server/treasurer";
import { getCurrentUser } from "@/server/users";

export default async function TreasurerPage() {
  const { user } = await getCurrentUser();
  const adminMembership = await db.query.member.findFirst({
    where: (membership, { and, eq }) =>
      and(eq(membership.userId, user.id), eq(membership.role, "admin")),
  });

  if (!adminMembership) {
    redirect("/dashboard");
  }

  const [dashboardData, organizations] = await Promise.all([
    getTreasurerDashboardData(),
    getOrganizations(),
  ]);
  const organization = organizations[0];

  return (
    <DashboardDataProvider value={dashboardData}>
      <OwnerDashboardFrame
        activePage="treasurer"
        organizationName="Treasurer"
        organizationSlug={organization?.slug ?? ""}
        organizations={organizations}
        showTreasurer
        userEmail={user.email}
        userName={user.name}
      >
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden p-4">
          <OrdersPanel
            data={{ total: 0, spent: 0, departments: [] }}
            mode="treasurer"
            userName={user.name}
          />
        </main>
      </OwnerDashboardFrame>
    </DashboardDataProvider>
  );
}
