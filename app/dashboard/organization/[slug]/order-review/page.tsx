import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { DashboardDataProvider } from "@/components/owner-dashboard/dashboard-data-context";
import { OwnerDashboardFrame } from "@/components/owner-dashboard/dashboard-frame";
import { OrdersPanel } from "@/components/owner-dashboard/OrdersPanel";
import { db } from "@/db/drizzle";
import { orderRequest, organization } from "@/db/schema";
import {
  getOrganizationAccess,
  getOrganizations,
} from "@/server/organizations";
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
  const isOrganizationTreasurer =
    access.role === "treasurer" || access.role === "advisor";
  let viewerRole:
    | "admin"
    | "owner"
    | "sublead"
    | "treasurer"
    | "advisor"
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
  }

  const [dashboardData, organizations] = await Promise.all([
    getOwnerDashboardData(selectedOrganization.id, {
      userId: user.id,
      role: viewerRole,
    }),
    getOrganizations(),
  ]);
  let orderMode: "owner" | "member" | "sublead" | "organization-treasurer" =
    "owner";
  if (access.role === "member" || access.role === "kas") {
    orderMode = "member";
  } else if (isSublead) {
    orderMode = "sublead";
  } else if (isOrganizationTreasurer) {
    orderMode = "organization-treasurer";
  }

  const items = await db.query.orderRequest.findMany({
    where: and(eq(orderRequest.organizationId, selectedOrganization.id)),
    orderBy: (orderRequest, { asc }) => [asc(orderRequest.createdAt)],
    columns: {
      id: true,
      orderName: true,
      department: true,
      description: true,
      link: true,
      amount: true,
      pricePerPiece: true,
      additionalCosts: true,
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
    .reduce(
      (sum, item) =>
        sum + Number(item.totalCosts) + Number(item.additionalCosts),
      0
    );
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
        .reduce(
          (sum, item) =>
            sum + Number(item.totalCosts) + Number(item.additionalCosts),
          0
        ),
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
        viewerRole={viewerRole}
      >
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden p-4">
          <OrdersPanel data={budget} mode={orderMode} userName={user.name} />
        </main>
      </OwnerDashboardFrame>
    </DashboardDataProvider>
  );
}
