import { and, eq } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { OrganizationAgenda } from "@/components/organization-agenda";
import OwnerDashboard from "@/components/owner-dashboard/app";
import { DashboardDataProvider } from "@/components/owner-dashboard/dashboard-data-context";
import { OwnerDashboardFrame } from "@/components/owner-dashboard/dashboard-frame";
import { Button } from "@/components/ui/button";
import { db } from "@/db/drizzle";
import { team } from "@/db/schema";
import {
  getOrganizationBySlug,
  getOrganizations,
} from "@/server/organizations";
import { getOwnerDashboardData } from "@/server/owner-dashboard";
import { getCurrentUser } from "@/server/users";

type Params = Promise<{ slug: string }>;

export default async function OrganizationPage({ params }: { params: Params }) {
  const { slug } = await params;
  const { user } = await getCurrentUser();

  const organization = await getOrganizationBySlug(slug);
  const membership = organization?.members.find((m) => m.userId === user.id);

  if (!(organization && membership)) {
    redirect("/dashboard");
  }

  const isOwner = membership?.role === "owner";
  const isAdmin = membership?.role === "admin";
  const hasSubleadAssignment = Boolean(
    await db.query.team.findFirst({
      where: and(
        eq(team.organizationId, organization.id),
        eq(team.memberId, membership.id),
        eq(team.isSubLead, true)
      ),
    })
  );

  if ((isOwner || isAdmin) && organization) {
    const dashboardData = await getOwnerDashboardData(organization.id, {
      userId: user.id,
      role: membership.role,
    });
    const organizations = await getOrganizations();
    const spent = dashboardData.monthlySpend.Total.reduce(
      (sum, month) => sum + month.spent,
      0
    );
    const budget = {
      total: Math.max(Number(organization.budget), spent),
      spent,
      departments: dashboardData.departments.map((name, index) => ({
        name,
        budget: dashboardData.departments.length
          ? Number(organization.budget) / dashboardData.departments.length
          : 0,
        spent:
          dashboardData.monthlySpend[name]?.reduce(
            (sum, month) => sum + month.spent,
            0
          ) ?? 0,
        color: [
          "#4f6ef7",
          "#10b981",
          "#8b5cf6",
          "#f59e0b",
          "#f43f5e",
          "#ec4899",
        ][index % 6],
        subs: [],
      })),
    };

    return (
      <div className="h-screen overflow-hidden">
        <OwnerDashboard
          budget={budget}
          dashboardData={dashboardData}
          isAdmin={isAdmin}
          organizationName={organization.name}
          organizationSlug={slug}
          organizations={organizations}
          userEmail={user.email}
          userName={user.name}
        />
      </div>
    );
  }

  return (
    <DashboardDataProvider
      value={
        await getOwnerDashboardData(organization.id, {
          userId: user.id,
          role: membership.role,
        })
      }
    >
      <OwnerDashboardFrame
        activePage="dashboard"
        organizationName={organization.name}
        organizationSlug={slug}
        organizations={await getOrganizations()}
        userEmail={user.email}
        userName={user.name}
        viewerRole={hasSubleadAssignment ? "sublead" : "member"}
      >
        <main className="flex min-h-0 flex-1 flex-col overflow-auto p-5">
          <h1 className="font-bold text-2xl text-[#FFEDD1]">
            {organization.name}
          </h1>

          {isOwner ? (
            <div className="flex flex-wrap gap-2">
              <Button asChild className="w-fit" variant="outline">
                <Link
                  href={`/dashboard/organization/${slug}/submit-order-lists`}
                >
                  Submit Order Lists
                </Link>
              </Button>
              <Button asChild className="w-fit" variant="outline">
                <Link href={`/dashboard/organization/${slug}/departments`}>
                  Manage Departments
                </Link>
              </Button>
              <Button asChild className="w-fit" variant="outline">
                <Link href={`/dashboard/organization/${slug}/order-review`}>
                  Review Sub-owner Orders
                </Link>
              </Button>
            </div>
          ) : null}

          {hasSubleadAssignment ? (
            <Button asChild className="w-fit" variant="outline">
              <Link href={`/dashboard/organization/${slug}/sub-owner-orders`}>
                Submit Order List
              </Link>
            </Button>
          ) : null}

          <Button asChild className="w-fit" variant="outline">
            <Link href={`/dashboard/organization/${slug}/reimburse`}>
              Submit Reimbursement
            </Link>
          </Button>

          {isAdmin ? (
            <OrganizationAgenda
              canEnableVoting
              canManageAgenda
              organizationId={organization.id}
            />
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href={`/dashboard/organization/${slug}/members`}>
                Organization Members
              </Link>
            </Button>

            <Button asChild variant="outline">
              <Link href={`/dashboard/organization/${slug}/invite-members`}>
                Invite Members
              </Link>
            </Button>
          </div>
        </main>
      </OwnerDashboardFrame>
    </DashboardDataProvider>
  );
}
