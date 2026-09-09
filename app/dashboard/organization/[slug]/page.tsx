import { eq } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { OrganizationAgenda } from "@/components/organization-agenda";
import OwnerDashboard from "@/components/owner-dashboard/app";
import type { BudgetData } from "@/components/owner-dashboard/types";
import { Button } from "@/components/ui/button";
import { db } from "@/db/drizzle";
import { orderRequest } from "@/db/schema";
import { getOrganizationBySlug } from "@/server/organizations";
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
    const orderRows = await db.query.orderRequest.findMany({
      where: eq(orderRequest.organizationId, organization.id),
    });
    const departments = new Map<string, { budget: number; spent: number }>();

    for (const row of orderRows) {
      const current = departments.get(row.department) ?? {
        budget: 0,
        spent: 0,
      };
      if (row.ordered && !row.canceled) {
        current.spent += Number(row.totalCosts || 0);
      }
      departments.set(row.department, current);
    }

    const spentTotal = Array.from(departments.values()).reduce(
      (sum, values) => sum + values.spent,
      0
    );
    const budgetTotal = Math.max(Number(organization.budget || 0), spentTotal);
    const departmentBudget =
      departments.size > 0 ? budgetTotal / departments.size : 0;

    const budget: BudgetData = {
      total: budgetTotal,
      spent: spentTotal,
      departments: Array.from(departments.entries()).map(
        ([name, values], index) => ({
          name,
          budget: Math.max(values.budget, departmentBudget),
          spent: values.spent,
          color: [
            "#4f6ef7",
            "#10b981",
            "#8b5cf6",
            "#f59e0b",
            "#f43f5e",
            "#ec4899",
          ][index % 6],
          subs: [],
        })
      ),
    };

    return (
      <div className="h-screen overflow-hidden">
        <OwnerDashboard
          budget={budget}
          organizationName={organization.name}
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
