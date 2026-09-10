import Link from "next/link";
import { redirect } from "next/navigation";
import { OrganizationAgenda } from "@/components/organization-agenda";
import OwnerDashboard from "@/components/owner-dashboard/app";
import { Button } from "@/components/ui/button";
import { getCalendarFeedUrl } from "@/server/calendar-feed";
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

  if (isOwner && organization) {
    const dashboardData = await getOwnerDashboardData(organization.id);
    const organizations = await getOrganizations();
    dashboardData.calendarFeedUrl = await getCalendarFeedUrl(organization.id);
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
          organizationName={organization.name}
          organizations={organizations}
          userEmail={user.email}
          userName={user.name}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 py-10">
      <h1 className="font-bold text-2xl">{organization?.name}</h1>

      {isOwner ? (
        <div className="flex flex-wrap gap-2">
          <Button asChild className="w-fit" variant="outline">
            <Link href={`/dashboard/organization/${slug}/submit-order-lists`}>
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

      {membership?.role === "sub_owner" ? (
        <Button asChild className="w-fit" variant="outline">
          <Link href={`/dashboard/organization/${slug}/sub-owner-orders`}>
            Submit Order List
          </Link>
        </Button>
      ) : null}

      {isAdmin && organization?.id ? (
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
    </div>
  );
}
