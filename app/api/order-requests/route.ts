import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/drizzle";
import {
  member,
  orderRequest,
  organizationDepartment,
  team,
} from "@/db/schema";
import { auth } from "@/lib/auth";
import { getRecurringOccurrenceDates } from "@/lib/order-recurrence";

const orderTypeEnum = ["Hardware", "Electronic", "Software", "Social"] as const;
const urgencyEnum = ["1 day", "2 days", "3 days", "7 days"] as const;

const rowSchema = z.object({
  description: z.string().trim().min(1, "Description is required").max(500),
  link: z
    .string()
    .trim()
    .url("Link must be a valid URL")
    .min(1, "Link is required"),
  pricePerPiece: z.coerce.number().positive("Price must be greater than 0"),
  quantity: z.coerce.number().int().positive("Quantity must be greater than 0"),
  orderType: z.enum(orderTypeEnum),
  urgency: z.enum(urgencyEnum),
  comments: z
    .string()
    .max(200, "Comments can be max 200 characters")
    .default(""),
  recurringQuantity: z.coerce.number().int().positive().optional(),
  recurringUnit: z.enum(["Days", "Weeks", "Months"]).optional(),
  recurringEndAt: z.string().datetime().optional(),
});

const draftRowSchema = z.object({
  description: z.string().trim().max(500).default(""),
  link: z.string().trim().default(""),
  pricePerPiece: z.coerce.number().nonnegative().default(0),
  quantity: z.coerce.number().int().nonnegative().default(0),
  orderType: z.enum(orderTypeEnum).default("Hardware"),
  urgency: z.enum(urgencyEnum).default("7 days"),
  comments: z.string().max(200).default(""),
  recurringQuantity: z.coerce.number().int().positive().optional(),
  recurringUnit: z.enum(["Days", "Weeks", "Months"]).optional(),
  recurringEndAt: z.string().datetime().optional(),
});

const bodySchema = z.object({
  organizationId: z.string().min(1),
  department: z.string().trim().min(1, "Department is required"),
  orderName: z.string().trim().min(1, "Order name is required").max(100),
  rows: z.array(rowSchema).min(1, "At least one row is required"),
  mode: z.literal("submit").default("submit"),
  recurring: z.boolean().default(false),
});

const draftBodySchema = z.object({
  organizationId: z.string().min(1),
  department: z.string().trim().default(""),
  orderName: z.string().trim().max(100).default("Untitled order"),
  rows: z.array(draftRowSchema).min(1, "At least one row is required"),
  mode: z.literal("draft"),
  recurring: z.boolean().default(false),
});

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Combines role, department, and recurring-order validation.
export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json();
  const parsed =
    payload?.mode === "draft"
      ? draftBodySchema.safeParse(payload)
      : bodySchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid order payload",
        details: parsed.error.flatten(),
      },
      { status: 400 }
    );
  }

  const submittingMembership = await db.query.member.findFirst({
    where: and(
      eq(member.organizationId, parsed.data.organizationId),
      eq(member.userId, session.user.id)
    ),
  });
  const isSublead =
    submittingMembership?.role === "sublead" ||
    submittingMembership?.role === "sub_owner";
  const isTreasurer = submittingMembership?.role === "treasurer";
  const isAdvisor = submittingMembership?.role === "advisor";
  const subleadAssignments = isSublead
    ? await db.query.team.findMany({
        where: and(
          eq(team.organizationId, parsed.data.organizationId),
          eq(team.memberId, submittingMembership?.id ?? "")
        ),
      })
    : [];

  if (
    !(
      submittingMembership &&
      (submittingMembership.role === "owner" ||
        submittingMembership.role === "admin" ||
        isSublead ||
        isTreasurer ||
        isAdvisor)
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Only organization owners, admins, and department subleads can submit order sheets",
      },
      { status: 403 }
    );
  }

  const allowedDepartments = await db.query.organizationDepartment.findMany({
    where: eq(
      organizationDepartment.organizationId,
      parsed.data.organizationId
    ),
  });
  const isDraft = parsed.data.mode === "draft";

  if (allowedDepartments.length > 0 && !isDraft) {
    const isValidDepartment = allowedDepartments.some(
      (entry) => entry.name === parsed.data.department
    );

    if (!isValidDepartment) {
      return NextResponse.json(
        { error: "Department is not configured for this organization." },
        { status: 400 }
      );
    }
  }

  if (isSublead) {
    const subleadDepartmentIds = new Set(
      subleadAssignments
        .map((assignment) => assignment.departmentId)
        .filter((departmentId): departmentId is string => Boolean(departmentId))
    );
    if (subleadDepartmentIds.size === 0) {
      return NextResponse.json(
        { error: "No sublead department is assigned to this member." },
        { status: 403 }
      );
    }
    const subleadDepartment = allowedDepartments.find(
      (department) =>
        department.name === parsed.data.department &&
        subleadDepartmentIds.has(department.id)
    );
    if (!subleadDepartment) {
      return NextResponse.json(
        { error: "You can only submit orders for your sublead departments." },
        { status: 403 }
      );
    }
  }

  if (
    parsed.data.recurring &&
    !isDraft &&
    parsed.data.rows.some(
      (row) =>
        !(row.recurringQuantity && row.recurringUnit && row.recurringEndAt)
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Recurring orders require an interval and an end date for every row.",
      },
      { status: 400 }
    );
  }

  const now = new Date();
  let initialStatus: "draft" | "owner_review" | "pending" = "pending";
  if (isDraft) {
    initialStatus = "draft";
  } else if (isSublead) {
    initialStatus = "owner_review";
  }

  const rowsToInsert = parsed.data.rows.flatMap((row) => {
    const total = row.pricePerPiece * row.quantity;
    const recurringQuantity =
      "recurringQuantity" in row ? row.recurringQuantity : undefined;
    const recurringUnit =
      "recurringUnit" in row ? row.recurringUnit : undefined;
    const recurringEndAtValue =
      "recurringEndAt" in row ? row.recurringEndAt : undefined;
    const recurringEndAt = recurringEndAtValue
      ? new Date(recurringEndAtValue)
      : null;

    const occurrenceDates =
      parsed.data.recurring && !isDraft
        ? getRecurringOccurrenceDates({
            startDate: now,
            endDate: recurringEndAt,
            quantity: recurringQuantity,
            unit: recurringUnit,
          })
        : [now];

    return occurrenceDates.map((orderedDate) => ({
      id: crypto.randomUUID(),
      organizationId: parsed.data.organizationId,
      userId: session.user.id,
      submittedBy: session.user.name,
      approvedBy:
        isDraft || isSublead || isTreasurer || isAdvisor
          ? ""
          : session.user.name,
      department: parsed.data.department,
      orderName: parsed.data.orderName,
      description: row.description,
      link: row.link,
      pricePerPiece: row.pricePerPiece.toFixed(2),
      amount: row.quantity,
      typeOfOrder: row.orderType,
      urgency: row.urgency,
      comments: row.comments,
      additionalCosts: "0.00",
      totalCosts: total.toFixed(2),
      orderedDate,
      photoAdded: false,
      invoiceAdded: false,
      delivered: false,
      ordered: false,
      finalized: false,
      status: initialStatus,
      photoNeeded: false,
      photoUploaded: false,
      canceled: false,
      accepted: "neutral" as const,
      recurring: parsed.data.recurring,
      recurringQuantity: recurringQuantity ?? null,
      recurringUnit: recurringUnit ?? null,
      recurringEndAt,
      createdAt: now,
      updatedAt: now,
    }));
  });

  await db.insert(orderRequest).values(rowsToInsert);

  return NextResponse.json({
    success: true,
    inserted: rowsToInsert.length,
  });
}
