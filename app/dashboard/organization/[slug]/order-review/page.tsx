import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { DashboardDataProvider } from "@/components/owner-dashboard/dashboard-data-context";
import { OwnerDashboardFrame } from "@/components/owner-dashboard/dashboard-frame";
import { OrdersPanel } from "@/components/owner-dashboard/OrdersPanel";
import { db } from "@/db/drizzle";
import { member, orderRequest, organization } from "@/db/schema";
import { getOrganizations } from "@/server/organizations";
import { getOwnerDashboardData } from "@/server/owner-dashboard";
import { getCurrentUser } from "@/server/users";

type Params = Promise<{ slug: string }>;

export default async function OrderReviewPage({ params }: { params: Params }) {
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

  const items = await db.query.orderRequest.findMany({
    where: and(eq(orderRequest.organizationId, selectedOrganization.id)),
    orderBy: (orderRequest, { asc }) => [asc(orderRequest.createdAt)],
    columns: {
      id: true,
      orderName: true,
      department: true,
      description: true,
      amount: true,
      pricePerPiece: true,
      totalCosts: true,
      typeOfOrder: true,
      urgency: true,
      comments: true,
      status: true,
      ordered: true,
      photoNeeded: true,
      photoUploaded: true,
      delivered: true,
      createdAt: true,
    },
  });

  const spent = items
    .filter((item) => item.ordered && item.status !== "declined")
    .reduce((sum, item) => sum + Number(item.totalCosts), 0);
  const departmentNames = Array.from(
    new Set(items.map((item) => item.department))
  );
  const budget = {
    total: Math.max(Number(selectedOrganization.budget), spent),
    spent,
    departments: departmentNames.map((name, index) => ({
      name,
      budget: departmentNames.length
        ? Number(selectedOrganization.budget) / departmentNames.length
        : 0,
      spent: items
        .filter(
          (item) =>
            item.department === name &&
            item.ordered &&
            item.status !== "declined"
        )
        .reduce((sum, item) => sum + Number(item.totalCosts), 0),
      color: ["#4f6ef7", "#10b981", "#8b5cf6", "#f59e0b", "#f43f5e", "#ec4899"][
        index % 6
      ],
      subs: [],
    })),
  };

  return (
    <DashboardDataProvider value={dashboardData}>
      <OwnerDashboardFrame
        activePage="orders"
        organizationName={selectedOrganization.name}
        organizationSlug={slug}
        organizations={organizations}
        userEmail={user.email}
        userName={user.name}
      >
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden p-4">
          <OrdersPanel data={budget} />
        </main>
      </OwnerDashboardFrame>
    </DashboardDataProvider>
  );
}
