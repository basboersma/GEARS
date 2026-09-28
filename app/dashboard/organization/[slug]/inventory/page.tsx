import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { DashboardDataProvider } from "@/components/owner-dashboard/dashboard-data-context";
import { OwnerDashboardFrame } from "@/components/owner-dashboard/dashboard-frame";
import { InventoryPage } from "@/components/owner-dashboard/InventoryPage";
import { db } from "@/db/drizzle";
import { organization } from "@/db/schema";
import {
  getOrganizationAccess,
  getOrganizations,
} from "@/server/organizations";
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

  const access = await getOrganizationAccess(selectedOrganization.id);

  if (
    !(
      access &&
      [
        "owner",
        "admin",
        "member",
        "sublead",
        "sub_owner",
        "treasurer",
        "advisor",
        "board",
        "kas",
      ].includes(access.role)
    )
  ) {
    redirect(`/dashboard/organization/${slug}`);
  }

  const isSublead = access.role === "sublead" || access.role === "sub_owner";
  let viewerRole:
    | "admin"
    | "owner"
    | "sublead"
    | "treasurer"
    | "advisor"
    | "board"
    | "kas"
    | "member" = "member";
  if (access.role === "admin" || access.role === "board") {
    viewerRole = "admin";
  } else if (access.role === "owner") {
    viewerRole = "owner";
  } else if (isSublead) {
    viewerRole = "sublead";
  } else if (access.role === "treasurer") {
    viewerRole = "treasurer";
  } else if (access.role === "advisor") {
    viewerRole = "advisor";
  } else if (access.role === "kas") {
    viewerRole = "kas";
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
              access.role !== "owner" &&
              access.role !== "admin" &&
              access.role !== "board"
            }
          />
        </main>
      </OwnerDashboardFrame>
    </DashboardDataProvider>
  );
}
