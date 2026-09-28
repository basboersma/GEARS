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

  const [dashboardData, organizations] = await Promise.all([
    getOwnerDashboardData(organization.id, {
      userId: user.id,
      role: isSublead ? "sublead" : membership.role,
    }),
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
    isSubLead: entry.role === "sublead" || entry.role === "sub_owner",
    strikes: 0,
    gender: profileById.get(entry.id)?.gender,
    nationality: profileById.get(entry.id)?.nationality,
    study: profileById.get(entry.id)?.study,
  }));
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

  return (
    <DashboardDataProvider value={dashboardData}>
      <OwnerDashboardFrame
        activePage="members"
        organizationName={organization.name}
        organizationSlug={slug}
        organizations={organizations}
        userEmail={user.email}
        userName={user.name}
        viewerRole={viewerRole}
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
            readOnly={viewerRole !== "owner" && viewerRole !== "admin"}
            teamHistory={dashboardData.teamHistory}
          />
        </main>
      </OwnerDashboardFrame>
    </DashboardDataProvider>
  );
}
