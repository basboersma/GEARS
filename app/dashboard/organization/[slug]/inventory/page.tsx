import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { DashboardDataProvider } from "@/components/owner-dashboard/dashboard-data-context";
import { OwnerDashboardFrame } from "@/components/owner-dashboard/dashboard-frame";
import { InventoryPage } from "@/components/owner-dashboard/InventoryPage";
import { db } from "@/db/drizzle";
import { member, organization } from "@/db/schema";
import { getOrganizations } from "@/server/organizations";
import { getOwnerDashboardData } from "@/server/owner-dashboard";
import { getCurrentUser } from "@/server/users";

type Params = Promise<{ slug: string }>;

export default async function InventoryRoute({ params }: { params: Params }) {
  const { slug } = await params;
  const { user } = await getCurrentUser();
  const selectedOrganization = await db.query.organization.findFirst({
    where: eq(organization.slug, slug),
  });

  if (!selectedOrganization) {
    redirect("/dashboard");
  }

  const membership = await db.query.member.findFirst({
    where: and(
      eq(member.userId, user.id),
      eq(member.organizationId, selectedOrganization.id),
      eq(member.role, "owner")
    ),
  });

  if (!membership) {
    redirect(`/dashboard/organization/${slug}`);
  }

  const [dashboardData, organizations] = await Promise.all([
    getOwnerDashboardData(selectedOrganization.id),
    getOrganizations(),
  ]);

  return (
    <DashboardDataProvider value={dashboardData}>
      <OwnerDashboardFrame
        activePage="inventory"
        organizationName={selectedOrganization.name}
        organizationSlug={slug}
        organizations={organizations}
        userEmail={user.email}
        userName={user.name}
      >
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden p-4">
          <InventoryPage onBack={() => undefined} />
        </main>
      </OwnerDashboardFrame>
    </DashboardDataProvider>
  );
}
