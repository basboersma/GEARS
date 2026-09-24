import { redirect } from "next/navigation";
import { DashboardDataProvider } from "@/components/owner-dashboard/dashboard-data-context";
import { OwnerDashboardFrame } from "@/components/owner-dashboard/dashboard-frame";
import { MembersPage } from "@/components/owner-dashboard/MembersPage";
import type { Member } from "@/components/owner-dashboard/types";
import {
  getOrganizationBySlug,
  getOrganizations,
} from "@/server/organizations";
import { getOwnerDashboardData } from "@/server/owner-dashboard";
import { getCurrentUser } from "@/server/users";

type Params = Promise<{ slug: string }>;

export default async function OrganizationMembersPage({
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

  const [dashboardData, organizations] = await Promise.all([
    getOwnerDashboardData(organization.id),
    getOrganizations(),
  ]);
  const profileById = new Map(
    dashboardData.members.map((entry) => [entry.id, entry])
  );
  const members: Member[] = organization.members.map((entry) => ({
    id: entry.id,
    name: entry.user.name,
    email: entry.user.email,
    team: entry.role === "owner" ? "Board" : "",
    department: "",
    role: entry.role,
    avatar: entry.user.name.slice(0, 1).toUpperCase(),
    status: "active",
    isSubLead: entry.role === "sub_owner",
    strikes: 0,
    gender: profileById.get(entry.id)?.gender,
    nationality: profileById.get(entry.id)?.nationality,
    study: profileById.get(entry.id)?.study,
  }));

  return (
    <DashboardDataProvider value={dashboardData}>
      <OwnerDashboardFrame
        activePage="members"
        organizationName={organization.name}
        organizationSlug={slug}
        organizations={organizations}
        userEmail={user.email}
        userName={user.name}
        viewerRole={membership.role === "admin" ? "admin" : "owner"}
      >
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden p-4">
          <MembersPage
            initialDepartmentIds={dashboardData.departmentIds}
            initialDepartments={dashboardData.departments}
            initialMembers={members}
            initialOrganizationId={dashboardData.organizationId}
            initialTeams={dashboardData.teams}
            leadMemberId={
              organization.members.find((entry) => entry.role === "owner")
                ?.id ?? null
            }
            organizationSlug={slug}
            teamHistory={dashboardData.teamHistory}
          />
        </main>
      </OwnerDashboardFrame>
    </DashboardDataProvider>
  );
}
