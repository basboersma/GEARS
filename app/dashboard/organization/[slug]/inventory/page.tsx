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
      eq(member.organizationId, selectedOrganization.id)
    ),
  });

  if (
    !membership ||
    (membership.role !== "owner" &&
      membership.role !== "admin" &&
      membership.role !== "member" &&
      membership.role !== "sublead" &&
      membership.role !== "sub_owner" &&
      membership.role !== "treasurer" &&
      membership.role !== "advisor" &&
      membership.role !== "board" &&
      membership.role !== "kas")
  ) {
    redirect(`/dashboard/organization/${slug}`);
  }

  const isSublead =
    membership.role === "sublead" || membership.role === "sub_owner";
  let viewerRole:
    | "admin"
    | "owner"
    | "sublead"
    | "treasurer"
    | "advisor"
    | "board"
    | "kas"
    | "member" = "member";
  if (membership.role === "admin") {
    viewerRole = "admin";
  } else if (membership.role === "owner") {
    viewerRole = "owner";
  } else if (isSublead) {
    viewerRole = "sublead";
  } else if (
    membership.role === "treasurer" ||
    membership.role === "advisor" ||
    membership.role === "board" ||
    membership.role === "kas"
  ) {
    viewerRole = membership.role;
  }

  const [dashboardData, organizations] = await Promise.all([
    getOwnerDashboardData(selectedOrganization.id, {
      userId: user.id,
      role: viewerRole,
    }),
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
        viewerRole={viewerRole}
      >
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden p-4">
          <InventoryPage
            readOnly={
              membership.role !== "owner" && membership.role !== "admin"
            }
          />
        </main>
      </OwnerDashboardFrame>
    </DashboardDataProvider>
  );
}
