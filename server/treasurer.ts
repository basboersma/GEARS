import { and, asc, eq } from "drizzle-orm";
import type { DashboardData } from "@/components/owner-dashboard/dashboard-data-context";
import { db } from "@/db/drizzle";
import { member, orderRequest, organization, user } from "@/db/schema";

export async function getTreasurerDashboardData(): Promise<DashboardData> {
  const rows = await db
    .select({
      order: orderRequest,
      organizationName: organization.name,
      submittedByRole: member.role,
    })
    .from(orderRequest)
    .innerJoin(organization, eq(orderRequest.organizationId, organization.id))
    .innerJoin(
      member,
      and(
        eq(orderRequest.userId, member.userId),
        eq(orderRequest.organizationId, member.organizationId)
      )
    )
    .innerJoin(user, eq(orderRequest.userId, user.id))
    .orderBy(asc(orderRequest.orderedDate));

  const monthlySpend = Object.fromEntries(
    Array.from({ length: 12 }, (_, monthIndex) => [
      new Intl.DateTimeFormat("en-US", { month: "short" }).format(
        new Date(2026, monthIndex, 1)
      ),
      rows
        .filter(
          ({ order }) =>
            order.status === "accepted" &&
            !order.canceled &&
            order.orderedDate.getMonth() === monthIndex
        )
        .reduce((sum, { order }) => sum + Number(order.totalCosts), 0),
    ])
  );

  return {
    organizationId: "treasurer",
    driveFolderId: null,
    departments: [],
    departmentIds: {},
    subteams: {},
    members: [],
    teams: [],
    teamHistory: [],
    files: [],
    fileTree: [],
    events: [],
    todos: [],
    roadmap: [],
    orders: rows.map(({ order, organizationName, submittedByRole }) => ({
      id: order.id,
      organizationName,
      submittedByRole,
      date: order.orderedDate.toISOString().slice(0, 10),
      startTime: order.orderedDate.toISOString().slice(11, 16),
      endTime: order.orderedDate.toISOString().slice(11, 16),
      title: order.orderName,
      department: order.department,
      submittedBy: order.submittedBy,
      approvedBy: order.approvedBy,
      status: order.status,
      ordered: order.ordered,
      delivered: order.delivered,
      finalized: order.finalized,
      canceled: order.canceled,
      accepted: order.accepted,
      link: order.link,
      recurring: order.recurring,
      recurringQuantity: order.recurringQuantity,
      recurringUnit: order.recurringUnit,
      recurringEndAt: order.recurringEndAt?.toISOString() ?? null,
      items: [
        {
          id: order.id,
          name: order.description,
          qty: order.amount,
          price: Number(order.pricePerPiece),
          link: order.link,
          orderType: order.typeOfOrder,
          urgency: order.urgency,
          comments: order.comments,
          status: order.status,
          photoNeeded: order.photoNeeded,
          photoUploaded: order.photoUploaded,
        },
      ],
    })),
    notifications: [],
    monthlySpend: {
      Total: Object.entries(monthlySpend).map(([month, spent]) => ({
        month,
        budget: 0,
        spent,
      })),
    },
  };
}
