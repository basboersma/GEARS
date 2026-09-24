import { asc, eq, inArray } from "drizzle-orm";
import type { DashboardData } from "@/components/owner-dashboard/dashboard-data-context";
import type { FileTreeNode } from "@/components/owner-dashboard/types";
import { db } from "@/db/drizzle";
import {
  agendaDiscussionPoint,
  agendaDiscussionPointVote,
  agendaEvent,
  dashboardFile,
  dashboardNotification,
  dashboardRoadmapItem,
  dashboardTodo,
  member,
  orderRequest,
  organization,
  organizationDepartment,
  reimbursementRequest,
  studentProfile,
  team,
  teamHistory,
  user,
} from "@/db/schema";
import { listGoogleDriveTree } from "@/lib/google-drive";

const FILE_TYPES = new Set(["pdf", "doc", "sheet", "slide", "other"]);

function parseArray(value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) &&
      parsed.every((item) => typeof item === "string")
      ? parsed
      : [];
  } catch {
    return [];
  }
}

function dateParts(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return { date: "", time: "" };
  }
  return {
    date: date.toISOString().slice(0, 10),
    time: date.toISOString().slice(11, 16),
  };
}

function buildFileTree(
  rows: (typeof dashboardFile.$inferSelect)[]
): FileTreeNode[] {
  const childrenByParent = new Map<string | null, typeof rows>();
  for (const row of rows) {
    const children = childrenByParent.get(row.parentId) ?? [];
    children.push(row);
    childrenByParent.set(row.parentId, children);
  }

  const mapRows = (parentId: string | null): FileTreeNode[] =>
    (childrenByParent.get(parentId) ?? []).map((row) => {
      if (row.kind === "folder") {
        return {
          kind: "folder",
          id: row.id,
          name: row.name,
          children: mapRows(row.id),
        };
      }
      return {
        kind: "file",
        id: row.id,
        name: row.name,
        type: FILE_TYPES.has(row.fileType ?? "")
          ? (row.fileType as "pdf" | "doc" | "sheet" | "slide" | "other")
          : "other",
        size: row.size ?? "",
        modified: row.modifiedAt.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        url: row.url ?? "#",
      };
    });
  return mapRows(null);
}

function driveFileType(
  mimeType?: string
): "pdf" | "doc" | "sheet" | "slide" | "other" {
  if (mimeType === "application/pdf") {
    return "pdf";
  }
  if (mimeType?.includes("document") || mimeType?.includes("word")) {
    return "doc";
  }
  if (mimeType?.includes("spreadsheet") || mimeType?.includes("excel")) {
    return "sheet";
  }
  if (mimeType?.includes("presentation") || mimeType?.includes("powerpoint")) {
    return "slide";
  }
  return "other";
}

function formatFileSize(value?: string): string {
  const bytes = Number(value);
  if (!Number.isFinite(bytes)) {
    return "";
  }
  return bytes >= 1_048_576
    ? `${(bytes / 1_048_576).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export async function getOwnerDashboardData(
  organizationId: string,
  viewer?: { userId: string; role: string }
): Promise<DashboardData> {
  const [
    departmentRows,
    memberRows,
    teamRows,
    teamHistoryRows,
    todoRows,
    roadmapRows,
    fileRows,
    notificationRows,
    eventRows,
    orderRows,
    reimbursementRows,
  ] = await Promise.all([
    db.query.organizationDepartment.findMany({
      where: eq(organizationDepartment.organizationId, organizationId),
      orderBy: [asc(organizationDepartment.name)],
    }),
    db
      .select({
        id: member.id,
        role: member.role,
        userId: user.id,
        name: user.name,
        email: user.email,
        gender: studentProfile.gender,
        nationality: studentProfile.nationality,
        study: studentProfile.study,
      })
      .from(member)
      .innerJoin(user, eq(member.userId, user.id))
      .leftJoin(studentProfile, eq(studentProfile.userId, user.id))
      .where(eq(member.organizationId, organizationId)),
    db.select().from(team).where(eq(team.organizationId, organizationId)),
    db
      .select()
      .from(teamHistory)
      .where(eq(teamHistory.organizationId, organizationId)),
    db.query.dashboardTodo.findMany({
      where: eq(dashboardTodo.organizationId, organizationId),
      orderBy: [asc(dashboardTodo.createdAt)],
    }),
    db.query.dashboardRoadmapItem.findMany({
      where: eq(dashboardRoadmapItem.organizationId, organizationId),
      orderBy: [asc(dashboardRoadmapItem.startDate)],
    }),
    db.query.dashboardFile.findMany({
      where: eq(dashboardFile.organizationId, organizationId),
      orderBy: [asc(dashboardFile.name)],
    }),
    db.query.dashboardNotification.findMany({
      where: eq(dashboardNotification.organizationId, organizationId),
      orderBy: [asc(dashboardNotification.createdAt)],
    }),
    db.query.agendaEvent.findMany({
      where: eq(agendaEvent.organizationId, organizationId),
      orderBy: [asc(agendaEvent.start)],
    }),
    db.query.orderRequest.findMany({
      where: eq(orderRequest.organizationId, organizationId),
      orderBy: [asc(orderRequest.orderedDate)],
    }),
    db.query.reimbursementRequest.findMany({
      where: eq(reimbursementRequest.organizationId, organizationId),
      orderBy: [asc(reimbursementRequest.createdAt)],
    }),
  ]);
  const organizationRow = await db.query.organization.findFirst({
    where: eq(organization.id, organizationId),
  });
  const driveTree = organizationRow?.driveFolderId
    ? await listGoogleDriveTree(organizationRow.driveFolderId)
    : null;

  const eventIds = eventRows.map((event) => event.id);
  const discussionPoints = eventIds.length
    ? await db.query.agendaDiscussionPoint.findMany({
        where: inArray(agendaDiscussionPoint.eventId, eventIds),
        orderBy: [asc(agendaDiscussionPoint.position)],
      })
    : [];
  const pointIds = discussionPoints.map((point) => point.id);
  const votes = pointIds.length
    ? await db.query.agendaDiscussionPointVote.findMany({
        where: inArray(agendaDiscussionPointVote.discussionPointId, pointIds),
      })
    : [];

  const departments = Array.from(
    new Set([
      ...departmentRows.map((row) => row.name),
      ...orderRows.map((row) => row.department),
      ...roadmapRows.map((row) => row.department),
    ])
  ).sort();
  const pointsByEvent = new Map<string, typeof discussionPoints>();
  for (const point of discussionPoints) {
    pointsByEvent.set(point.eventId, [
      ...(pointsByEvent.get(point.eventId) ?? []),
      point,
    ]);
  }

  const googleDriveTree = driveTree?.success
    ? driveTree.files.map(function mapNode(node): FileTreeNode {
        if (node.kind === "folder") {
          return {
            kind: "folder",
            id: node.id,
            name: node.name,
            children: (node.children ?? []).map(mapNode),
          };
        }
        return {
          kind: "file",
          id: node.id,
          name: node.name,
          type: driveFileType(node.mimeType),
          size: formatFileSize(node.size),
          modified: node.modifiedTime
            ? new Date(node.modifiedTime).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "",
          url:
            node.webViewLink ??
            `https://drive.google.com/file/d/${node.id}/view`,
          thumbnailUrl: node.thumbnailLink,
        };
      })
    : buildFileTree(fileRows);
  const files = googleDriveTree.flatMap(
    function flatten(node): DashboardData["files"] {
      if (node.kind === "folder") {
        return node.children.flatMap(flatten);
      }
      return [{ ...node }];
    }
  );

  return {
    organizationId,
    driveFolderId: organizationRow?.driveFolderId ?? null,
    departments,
    departmentIds: Object.fromEntries(
      departmentRows.map((row) => [row.name, row.id])
    ),
    subteams: Object.fromEntries(departments.map((name) => [name, []])),
    members: memberRows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      team: "",
      department: "",
      role: row.role,
      avatar: row.name.slice(0, 1).toUpperCase(),
      status: "active",
      isSubLead: row.role === "sub_owner",
      strikes: 0,
      gender: row.gender,
      nationality: row.nationality,
      study: row.study,
    })),
    teams: teamRows.map((row) => ({
      id: row.id,
      departmentId: row.departmentId,
      memberId: row.memberId,
      isSubLead: row.isSubLead,
      isAdvisor: row.isAdvisor,
      isTreasurer: row.isTreasurer,
    })),
    teamHistory: teamHistoryRows.map((row) => ({
      id: row.id,
      snapshotAt: row.snapshotAt.toISOString(),
      departmentId: row.departmentId,
      memberId: row.memberId,
      isSubLead: row.isSubLead,
      isAdvisor: row.isAdvisor,
      isTreasurer: row.isTreasurer,
      removed: row.removed,
    })),
    files,
    fileTree: googleDriveTree,
    events: eventRows.map((event) => {
      const start = dateParts(event.start);
      const end = dateParts(event.end);
      return {
        id: event.id,
        title: event.title,
        type: event.itemType === "meeting" ? "meeting" : "event",
        date: start.date,
        startTime: start.time,
        endDate: end.date,
        endTime: end.time,
        color: event.itemType === "meeting" ? "#4f6ef7" : "#10b981",
        description: event.description,
        location: event.location || "",
        invitees: parseArray(event.attendees ?? "[]").map((memberId) => ({
          memberId,
          status: "pending" as const,
        })),
        sendMail: false,
        linkedFiles: [],
        localFiles: [],
        repeat: null,
        discussionPoints: (pointsByEvent.get(event.id) ?? []).map((point) => ({
          id: point.id,
          title: point.topic,
          notes: point.notes ?? "",
          votingEnabled: point.votingEnabled,
          votes: {
            for: votes
              .filter(
                (vote) =>
                  vote.discussionPointId === point.id && vote.value === "for"
              )
              .map((vote) => vote.userId),
            against: votes
              .filter(
                (vote) =>
                  vote.discussionPointId === point.id &&
                  vote.value === "against"
              )
              .map((vote) => vote.userId),
            abstain: votes
              .filter(
                (vote) =>
                  vote.discussionPointId === point.id &&
                  vote.value === "abstain"
              )
              .map((vote) => vote.userId),
          },
        })),
      };
    }),
    todos: todoRows.map((row) => ({
      id: row.id,
      text: row.text,
      description: row.description,
      done: row.done,
      color: row.color,
      assignedMembers: parseArray(row.assignedMemberIds),
      linkedFiles: parseArray(row.linkedFileIds),
      addToCalendar: row.addToCalendar,
      calendarDate: row.calendarDate,
      dueDate: row.dueDate ?? undefined,
      subtasks: JSON.parse(row.subtasks),
    })),
    roadmap: roadmapRows.map((row) => ({
      id: row.id,
      title: row.title,
      department: row.department,
      startDate: row.startDate,
      endDate: row.endDate,
      color: row.color,
      progress: row.progress,
    })),
    orders: orderRows.map((row) => ({
      id: row.id,
      date: row.orderedDate.toISOString().slice(0, 10),
      startTime: row.orderedDate.toISOString().slice(11, 16),
      endTime: row.orderedDate.toISOString().slice(11, 16),
      title: row.orderName,
      department: row.department,
      submittedBy: row.submittedBy,
      approvedBy: row.approvedBy,
      status: row.status,
      ordered: row.ordered,
      delivered: row.delivered,
      finalized: row.finalized,
      state: row.state as "Functional" | "Broken" | "Discarded",
      canceled: row.canceled,
      accepted: row.accepted,
      link: row.link,
      recurring: row.recurring,
      recurringQuantity: row.recurringQuantity,
      recurringUnit: row.recurringUnit,
      recurringEndAt: row.recurringEndAt?.toISOString() ?? null,
      items: [
        {
          id: row.id,
          name: row.description,
          description: row.description,
          qty: row.amount,
          price: Number(row.pricePerPiece),
          link: row.link,
          orderType: row.typeOfOrder,
          urgency: row.urgency,
          comments: row.comments,
          status: row.status,
          photoNeeded: row.photoNeeded,
          photoUploaded: row.photoUploaded,
          invoiceAdded: row.invoiceAdded,
        },
      ],
    })),
    notifications: [
      ...notificationRows.map((row) => ({
        id: row.id,
        type: row.type as DashboardData["notifications"][number]["type"],
        title: row.title,
        body: row.body,
        time: row.createdAt.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        read: row.read,
      })),
      ...orderRows
        .filter((row) => row.photoNeeded && !row.photoUploaded)
        .map((row) => ({
          id: `photo-needed:${row.id}`,
          type: "order" as const,
          title: "Photo needed",
          body: `${row.orderName}: ${row.link || row.description}`,
          time: row.orderedDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          read: false,
          orderRequestId: row.id,
        })),
      ...orderRows
        .filter(
          (row) =>
            row.ordered &&
            (viewer?.role === "owner" || row.userId === viewer?.userId)
        )
        .map((row) => ({
          id: `order-ordered:${row.id}`,
          type: "order" as const,
          title: "Order placed",
          body: `${row.orderName}: ${row.description}`,
          time: row.orderedDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          read: false,
          orderRequestId: row.id,
        })),
    ],
    reimbursements: reimbursementRows.map((row) => ({
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
    })),
    monthlySpend: Object.fromEntries(
      ["Total", ...departments].map((name) => [
        name,
        Array.from({ length: 12 }, (_, monthIndex) => ({
          month: new Intl.DateTimeFormat("en-US", { month: "short" }).format(
            new Date(2026, monthIndex, 1)
          ),
          budget: 0,
          spent: orderRows
            .filter(
              (row) =>
                (name === "Total" || row.department === name) &&
                row.ordered &&
                !row.canceled &&
                row.orderedDate.getMonth() === monthIndex
            )
            .reduce((sum, row) => sum + Number(row.totalCosts), 0),
        })),
      ])
    ),
  };
}
