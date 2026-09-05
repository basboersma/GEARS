import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/owner-dashboard/app";
import { OrdersPanel } from "@/components/owner-dashboard/OrdersPanel";
import { DashboardTopBar } from "@/components/owner-dashboard/top-bar";
import type { BudgetData } from "@/components/owner-dashboard/types";
import { db } from "@/db/drizzle";
import { member, orderRequest, organization } from "@/db/schema";
import { getOrganizations } from "@/server/organizations";
import { getCurrentUser } from "@/server/users";

type Params = Promise<{ slug: string }>;

const DEPARTMENT_COLORS = [
  "#4f6ef7",
  "#10b981",
  "#8b5cf6",
  "#f59e0b",
  "#f43f5e",
  "#ec4899",
];

export default async function OrganizationOrdersPage({
  params,
}: {
  params: Params;
}) {
  const { slug } = await params;
  const { user } = await getCurrentUser();
  const org = await db.query.organization.findFirst({
    where: eq(organization.slug, slug),
  });

  if (!org) {
    redirect("/dashboard");
  }

  const membership = await db.query.member.findFirst({
    where: and(eq(member.organizationId, org.id), eq(member.userId, user.id)),
  });

  if (membership?.role !== "owner") {
    redirect(`/dashboard/organization/${slug}`);
  }

  const organizations = await getOrganizations();

  const rows = await db.query.orderRequest.findMany({
    where: eq(orderRequest.organizationId, org.id),
  });
  const departmentSpent = new Map<string, number>();

  for (const row of rows) {
    if (row.ordered && !row.canceled) {
      departmentSpent.set(
        row.department,
        (departmentSpent.get(row.department) ?? 0) + Number(row.totalCosts || 0)
      );
    }
  }

  const spent = Array.from(departmentSpent.values()).reduce(
    (sum, value) => sum + value,
    0
  );
  const total = Math.max(Number(org.budget || 0), spent);
  const departmentBudget =
    departmentSpent.size > 0 ? total / departmentSpent.size : 0;
  const budget: BudgetData = {
    total,
    spent,
    departments: Array.from(departmentSpent.entries()).map(
      ([name, departmentSpentValue], index) => ({
        name,
        budget: Math.max(departmentSpentValue, departmentBudget),
        spent: departmentSpentValue,
        color: DEPARTMENT_COLORS[index % DEPARTMENT_COLORS.length],
        subs: [],
      })
    ),
  };

  return (
    <div className="flex h-screen min-h-0 overflow-hidden bg-[#1A1919]">
      <Sidebar
        onManageMembers={() => undefined}
        organizationSlug={org.slug ?? slug}
        organizations={organizations}
        userEmail={user.email}
        userName={user.name}
      />
      <div className="flex h-full min-w-0 flex-1 flex-col">
        <DashboardTopBar title="Manage Orders" />
        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-4 pt-4">
          <OrdersPanel data={budget} />
        </main>
      </div>
    </div>
  );
}
