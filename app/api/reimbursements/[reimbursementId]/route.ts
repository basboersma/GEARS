import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/drizzle";
import {
  dashboardNotification,
  member,
  orderRequest,
  reimbursementRequest,
} from "@/db/schema";
import { auth } from "@/lib/auth";

const statusSchema = z.object({
  status: z.enum(["accepted", "declined", "successful"]),
  denyComment: z.string().trim().max(500).optional(),
});

const inventorySchema = z.object({
  addToInventory: z.boolean(),
});

const paymentResponseSchema = z
  .object({
    paymentReceived: z.boolean(),
    paymentComment: z.string().trim().max(500).optional(),
  })
  .superRefine((data, context) => {
    if (!(data.paymentReceived || data.paymentComment)) {
      context.addIssue({
        code: "custom",
        message: "A description is required when payment was not received",
        path: ["paymentComment"],
      });
    }
  });

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Combines manager status changes with submitter payment confirmation.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ reimbursementId: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { reimbursementId } = await params;
  const item = await db.query.reimbursementRequest.findFirst({
    where: eq(reimbursementRequest.id, reimbursementId),
  });
  if (!item) {
    return NextResponse.json(
      { error: "Reimbursement not found" },
      { status: 404 }
    );
  }
  const membership = await db.query.member.findFirst({
    where: and(
      eq(member.userId, session.user.id),
      eq(member.organizationId, item.organizationId)
    ),
  });
  if (!membership) {
    return NextResponse.json(
      { error: "Organization membership is required" },
      { status: 403 }
    );
  }

  const payload = await request.json();
  const isManager =
    membership.role === "owner" ||
    membership.role === "admin" ||
    membership.role === "treasurer";
  const isSubmitter = item.userId === session.user.id;
  const isPaymentResponse =
    isSubmitter &&
    typeof payload === "object" &&
    payload !== null &&
    "paymentReceived" in payload;

  if (
    isManager &&
    typeof payload === "object" &&
    payload !== null &&
    "addToInventory" in payload
  ) {
    const parsed = inventorySchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid inventory update" },
        { status: 400 }
      );
    }
    if (item.status !== "accepted") {
      return NextResponse.json(
        { error: "Only accepted reimbursements can be added to inventory" },
        { status: 409 }
      );
    }
    const existingInventoryItem = await db.query.orderRequest.findFirst({
      where: eq(orderRequest.id, item.id),
    });
    if (parsed.data.addToInventory && !existingInventoryItem) {
      const now = new Date();
      await db.insert(orderRequest).values({
        id: item.id,
        organizationId: item.organizationId,
        userId: item.userId,
        submittedBy: item.submittedBy,
        approvedBy: session.user.name,
        department: item.department,
        orderName: item.orderName || item.name,
        description: item.name,
        link: item.link,
        pricePerPiece: item.pricePerPiece,
        amount: item.quantity,
        typeOfOrder: item.orderType as
          | "Hardware"
          | "Electronic"
          | "Software"
          | "Social",
        urgency: item.urgency as "1 day" | "2 days" | "3 days" | "7 days",
        comments: item.comments,
        additionalCosts: "0",
        totalCosts: (Number(item.pricePerPiece) * item.quantity).toFixed(2),
        orderedDate: item.createdAt,
        ordered: true,
        finalized: true,
        status: "accepted",
        accepted: "accepted",
        createdAt: item.createdAt,
        updatedAt: now,
      });
    } else if (!parsed.data.addToInventory && existingInventoryItem) {
      await db.delete(orderRequest).where(eq(orderRequest.id, item.id));
    }
    return NextResponse.json({
      success: true,
      addedToInventory: parsed.data.addToInventory,
    });
  }

  if (!(isManager || isSubmitter)) {
    return NextResponse.json(
      { error: "You are not allowed to update this reimbursement" },
      { status: 403 }
    );
  }

  if (isManager && !isPaymentResponse) {
    const parsed = statusSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid reimbursement status" },
        { status: 400 }
      );
    }
    if (parsed.data.status === "declined" && !parsed.data.denyComment) {
      return NextResponse.json(
        { error: "A reason is required when denying a reimbursement" },
        { status: 400 }
      );
    }
    if (parsed.data.status === "successful" && item.status !== "accepted") {
      return NextResponse.json(
        { error: "Only accepted reimbursements can be marked paid" },
        { status: 409 }
      );
    }

    const now = new Date();
    await db
      .update(reimbursementRequest)
      .set({
        status: parsed.data.status,
        denyComment:
          parsed.data.status === "declined"
            ? parsed.data.denyComment
            : item.denyComment,
        updatedAt: now,
      })
      .where(eq(reimbursementRequest.id, reimbursementId));

    if (parsed.data.status === "declined") {
      await db.insert(dashboardNotification).values({
        id: crypto.randomUUID(),
        organizationId: item.organizationId,
        userId: item.userId,
        type: "reimbursement",
        title: "Reimbursement denied",
        body: `${item.name}: ${parsed.data.denyComment}`,
        requestId: item.id,
        read: false,
        createdAt: now,
      });
    }

    if (parsed.data.status === "successful") {
      await db.insert(dashboardNotification).values({
        id: crypto.randomUUID(),
        organizationId: item.organizationId,
        userId: item.userId,
        type: "reimbursement_payment",
        title: "Reimbursement payment confirmation",
        body: `Money properly received for ${item.name}? Click to confirm.`,
        requestId: item.id,
        read: false,
        createdAt: now,
      });
    }
    return NextResponse.json({ success: true });
  }

  if (!isSubmitter) {
    return NextResponse.json(
      { error: "Only the reimbursement submitter can confirm payment" },
      { status: 403 }
    );
  }

  const parsed = paymentResponseSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "A description is required when payment was not received",
      },
      { status: 400 }
    );
  }
  if (item.status !== "successful") {
    return NextResponse.json(
      { error: "This reimbursement is not awaiting payment confirmation" },
      { status: 409 }
    );
  }

  await db
    .update(reimbursementRequest)
    .set({
      status: parsed.data.paymentReceived ? "successful" : "accepted",
      paymentComment: parsed.data.paymentReceived
        ? null
        : parsed.data.paymentComment,
      updatedAt: new Date(),
    })
    .where(eq(reimbursementRequest.id, reimbursementId));
  return NextResponse.json({ success: true });
}
