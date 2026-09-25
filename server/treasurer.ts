import { and, asc, eq, or } from "drizzle-orm";
import type { DashboardData } from "@/components/owner-dashboard/dashboard-data-context";
import { db } from "@/db/drizzle";
import {
  member,
  orderRequest,
  organization,
  reimbursementRequest,
  studentProfile,
  user,
} from "@/db/schema";
import { listGoogleDriveTree } from "@/lib/google-drive";

function findReimbursementImageUrl(
  tree: Awaited<ReturnType<typeof listGoogleDriveTree>> | undefined,
  reimbursementName: string
) {
  if (!tree?.success) {
    return undefined;
  }
  const reimbursementsFolder = tree.files.find(
    (node) => node.kind === "folder" && node.name === "Reimbursements"
  );
  if (!reimbursementsFolder || reimbursementsFolder.kind !== "folder") {
    return undefined;
  }
  const orderFolder = reimbursementsFolder.children?.find(
    (node) => node.kind === "folder" && node.name === reimbursementName
  );
  if (!orderFolder || orderFolder.kind !== "folder") {
    return undefined;
  }
  const file = orderFolder.children?.find((node) => node.kind === "file");
  return file?.kind === "file"
    ? (file.thumbnailLink ?? file.webViewLink)
    : undefined;
}

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
  const reimbursements = await db
    .select({
      reimbursement: reimbursementRequest,
      ibanNumber: studentProfile.ibanNumber,
    })
    .from(reimbursementRequest)
    .innerJoin(
      member,
      and(
        eq(reimbursementRequest.organizationId, member.organizationId),
        eq(reimbursementRequest.userId, member.userId)
      )
    )
    .leftJoin(
      studentProfile,
      eq(reimbursementRequest.userId, studentProfile.userId)
    )
    .where(
      or(
        eq(reimbursementRequest.status, "accepted"),
        and(
          eq(reimbursementRequest.status, "pending"),
          or(eq(member.role, "owner"), eq(member.role, "admin"))
        )
      )
    )
    .orderBy(asc(reimbursementRequest.createdAt));
  const reimbursementTrees = new Map<
    string,
    Awaited<ReturnType<typeof listGoogleDriveTree>>
  >();
  await Promise.all(
    reimbursements.map(async ({ reimbursement }) => {
      if (reimbursementTrees.has(reimbursement.organizationId)) {
        return;
      }
      const organizationRow = await db.query.organization.findFirst({
        where: eq(organization.id, reimbursement.organizationId),
      });
      if (organizationRow?.driveFolderId) {
        reimbursementTrees.set(
          reimbursement.organizationId,
          await listGoogleDriveTree(organizationRow.driveFolderId)
        );
      }
    })
  );
  const gmaCreated = Boolean(await db.query.gmaSession.findFirst());

  const uniqueRows = Array.from(
    new Map(rows.map((row) => [row.order.id, row])).values()
  );
  const groupedRows = Array.from(
    uniqueRows
      .reduce((groups, row) => {
        const key = [
          row.order.organizationId,
          row.order.userId,
          row.order.orderName,
          row.order.orderedDate.getTime(),
        ].join("\u0000");
        const group = groups.get(key) ?? [];
        group.push(row);
        groups.set(key, group);
        return groups;
      }, new Map<string, typeof uniqueRows>())
      .values()
  );
  const monthlySpend = Object.fromEntries(
    Array.from({ length: 12 }, (_, monthIndex) => [
      new Intl.DateTimeFormat("en-US", { month: "short" }).format(
        new Date(2026, monthIndex, 1)
      ),
      uniqueRows
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
    gmaCreated,
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
    orders: groupedRows.map((group) => {
      const first = group[0];
      const order = first.order;
      return {
        id: order.id,
        organizationId: order.organizationId,
        organizationName: first.organizationName,
        submittedByRole: first.submittedByRole,
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
        items: group.map(({ order: item }) => ({
          id: item.id,
          name: item.description,
          description: item.description,
          qty: item.amount,
          price: Number(item.pricePerPiece),
          link: item.link,
          orderType: item.typeOfOrder,
          urgency: item.urgency,
          comments: item.comments,
          status: item.status,
          photoNeeded: item.photoNeeded,
          photoUploaded: item.photoUploaded,
        })),
      };
    }),
    notifications: uniqueRows
      .filter(({ order }) => order.ordered)
      .map(({ order }) => ({
        id: `order-ordered:${order.id}`,
        type: "order" as const,
        title: "Order placed",
        body: `${order.orderName}: ${order.description}`,
        time: order.orderedDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        read: false,
      })),
    reimbursements: reimbursements.map(
      ({ reimbursement: row, ibanNumber }) => ({
        id: row.id,
        organizationId: row.organizationId,
        name: row.name,
        department: row.department,
        submittedBy: row.submittedBy,
        link: row.link,
        pricePerPiece: Number(row.pricePerPiece),
        quantity: row.quantity,
        orderType: row.orderType,
        urgency: row.urgency,
        comments: row.comments,
        status: row.status,
        submittedAt: row.createdAt.toISOString(),
        imageUrl: findReimbursementImageUrl(
          reimbursementTrees.get(row.organizationId),
          row.name
        ),
        ibanNumber: ibanNumber ?? "",
      })
    ),
    monthlySpend: {
      Total: Object.entries(monthlySpend).map(([month, spent]) => ({
        month,
        budget: 0,
        spent,
      })),
    },
  };
}
