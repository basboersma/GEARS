import { and, asc, eq, inArray } from "drizzle-orm";
import { AdminDashboard } from "@/components/admin-dashboard";
import { db } from "@/db/drizzle";
import {
  agendaEvent,
  member,
  orderRequest,
  organization,
  organizationBudget,
} from "@/db/schema";
import { getCurrentUser } from "@/server/users";

export default async function AdminDashboardPage() {
  const { currentUser } = await getCurrentUser();

  const adminMemberships = await db.query.member.findMany({
    where: and(eq(member.userId, currentUser.id), eq(member.role, "admin")),
  });

  if (adminMemberships.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
          You do not have admin access to any organization.
        </div>
      </div>
    );
  }

  const organizationIds = adminMemberships.map((entry) => entry.organizationId);

  const organizations = await db.query.organization.findMany({
    where: inArray(organization.id, organizationIds),
    with: {
      members: {
        with: {
          user: true,
        },
      },
    },
  });

  const [totalBudgetRow, organizationBudgetRows] = await Promise.all([
    db.query.budgetSetting.findFirst(),
    db.query.organizationBudget.findMany({
      where: inArray(organizationBudget.organizationId, organizationIds),
    }),
  ]);

  const totalBudget = Number(totalBudgetRow?.totalBudget ?? 0);
  const budgetMap = new Map(
    organizationBudgetRows.map((entry) => [
      entry.organizationId,
      Number(entry.allocatedBudget ?? 0),
    ])
  );

  const summaries = await Promise.all(
    organizations.map(async (org) => {
      const [agendaItems, orderRows] = await Promise.all([
        db.query.agendaEvent.findMany({
          where: eq(agendaEvent.organizationId, org.id),
          orderBy: (agendaEvent, { asc }) => [asc(agendaEvent.start)],
          limit: 10,
        }),
        db.query.orderRequest.findMany({
          where: eq(orderRequest.organizationId, org.id),
          orderBy: [asc(orderRequest.orderName), asc(orderRequest.orderedDate)],
        }),
      ]);

      const orderedTotal = orderRows
        .filter((row) => row.ordered && !row.canceled)
        .reduce((sum, row) => sum + Number(row.totalCosts || 0), 0);

      const pendingTotal = orderRows
        .filter(
          (row) => !(row.ordered || row.canceled) && row.status !== "accepted"
        )
        .reduce((sum, row) => sum + Number(row.totalCosts || 0), 0);

      const upcomingOrders = Object.values(
        orderRows
          .filter(
            (row) => !(row.canceled || row.ordered) && row.status !== "accepted"
          )
          .reduce<Record<string, (typeof orderRows)[number][]>>(
            (groups, row) => {
              const key = row.orderName || "Untitled order";
              groups[key] ??= [];
              groups[key].push(row);
              return groups;
            },
            {}
          )
      )
        .map((list) =>
          list.sort((a, b) => Number(a.orderedDate) - Number(b.orderedDate))
        )
        .map((rowsForList) => ({
          id: rowsForList[0]?.id ?? crypto.randomUUID(),
          orderName: rowsForList[0]?.orderName ?? "Untitled order",
          organizationId: org.id,
          organizationName: org.name,
          date: rowsForList[0]?.orderedDate ?? new Date(),
          items: rowsForList.map((row) => ({
            id: row.id,
            department: row.department,
            description: row.description,
            quantity: row.amount,
            urgency: row.urgency,
            typeOfOrder: row.typeOfOrder,
            totalCosts: Number(row.totalCosts || 0),
            photoAdded: row.photoAdded,
            delivered: row.delivered,
            ordered: row.ordered,
            finalized: row.finalized,
            accepted: row.accepted,
            photoNeeded: row.photoNeeded,
            photoUploaded: row.photoUploaded,
            status: row.status,
            comments: row.comments,
          })),
        }))
        .sort(
          (a, b) =>
            a.orderName.localeCompare(b.orderName) ||
            Number(a.date) - Number(b.date)
        );

      return {
        id: org.id,
        name: org.name,
        slug: org.slug ?? "",
        members: org.members,
        agendaItems: agendaItems.map((item) => ({
          id: item.id,
          title: item.title,
          start: item.start,
        })),
        orderedTotal,
        pendingTotal,
        upcomingOrders,
        allocatedBudget: budgetMap.get(org.id) ?? 0,
      };
    })
  );

  return <AdminDashboard organizations={summaries} totalBudget={totalBudget} />;
}
