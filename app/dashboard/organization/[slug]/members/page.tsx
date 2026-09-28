import { redirect } from "next/navigation";
import { DashboardDataProvider } from "@/components/owner-dashboard/dashboard-data-context";
import { OwnerDashboardFrame } from "@/components/owner-dashboard/dashboard-frame";
import { MembersPage } from "@/components/owner-dashboard/MembersPage";
import type { Member } from "@/components/owner-dashboard/types";
import {
  getOrganizationAccess,
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

  const access = await getOrganizationAccess(organization.id);

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

  const [dashboardData, organizations] = await Promise.all([
    getOwnerDashboardData(organization.id, {
      userId: user.id,
      role: isSublead ? "sublead" : access.role,
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
