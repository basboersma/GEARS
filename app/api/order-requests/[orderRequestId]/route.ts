import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/drizzle";
import { member, orderRequest, organization } from "@/db/schema";
import { auth } from "@/lib/auth";
import { createOrderRequestFolder } from "@/lib/google-drive";

const patchSchema = z.object({
  status: z.enum(["pending", "accepted", "declined"]).optional(),
  accepted: z.enum(["neutral", "accepted", "denied"]).optional(),
  reimbursementStatus: z
    .enum(["not_requested", "pending", "successful", "failed"])
    .optional(),
  ordered: z.boolean().optional(),
  invoiceAdded: z.boolean().optional(),
  photoNeeded: z.boolean().optional(),
  state: z.enum(["Functional", "Broken", "Discarded"]).optional(),
  orderName: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().min(1).max(500).optional(),
  link: z.string().trim().url().optional(),
  pricePerPiece: z.coerce.number().positive().optional(),
  amount: z.coerce.number().int().positive().optional(),
  comments: z.string().max(200).optional(),
});

async function getSessionUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return null;
  }

  return session.user;
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Combines item validation with role-specific order processing permissions.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orderRequestId: string }> }
) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderRequestId } = await params;

  const item = await db.query.orderRequest.findFirst({
    where: eq(orderRequest.id, orderRequestId),
  });

  if (!item) {
    return NextResponse.json(
      { error: "Order item not found" },
      { status: 404 }
    );
  }

  const payload = await request.json();
  const parsed = patchSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid order item update payload",
        details: parsed.error.flatten(),
      },
      { status: 400 }
    );
  }

  if (
    parsed.data.status === undefined &&
    parsed.data.accepted === undefined &&
    parsed.data.reimbursementStatus === undefined &&
    parsed.data.ordered === undefined &&
    parsed.data.invoiceAdded === undefined &&
    parsed.data.photoNeeded === undefined &&
    parsed.data.state === undefined &&
    parsed.data.orderName === undefined &&
    parsed.data.description === undefined &&
    parsed.data.link === undefined &&
    parsed.data.pricePerPiece === undefined &&
    parsed.data.amount === undefined &&
    parsed.data.comments === undefined
  ) {
    return NextResponse.json(
      { error: "No order item fields were provided" },
      { status: 400 }
    );
  }

  const membership = await db.query.member.findFirst({
    where: and(
      eq(member.userId, user.id),
      eq(member.organizationId, item.organizationId)
    ),
  });

  const isOwnerOrAdmin =
    membership?.role === "owner" || membership?.role === "admin";
  const isApprovalStatus =
    parsed.data.status === "accepted" || parsed.data.status === "declined";
  const isAcceptanceUpdate = parsed.data.accepted !== undefined;
  const hasReviewFields = [
    parsed.data.orderName,
    parsed.data.description,
    parsed.data.link,
    parsed.data.pricePerPiece,
    parsed.data.amount,
    parsed.data.comments,
  ].some((value) => value !== undefined);
  const ownerCanReview =
    isOwnerOrAdmin &&
    item.status === "owner_review" &&
    (isApprovalStatus || hasReviewFields);
  const adminCanProcess =
    membership?.role === "admin" &&
    item.status !== "owner_review" &&
    (isApprovalStatus ||
      isAcceptanceUpdate ||
      parsed.data.ordered !== undefined ||
      parsed.data.invoiceAdded !== undefined ||
      parsed.data.photoNeeded !== undefined ||
      parsed.data.state !== undefined ||
      parsed.data.reimbursementStatus !== undefined);

  const canUpdateState = isOwnerOrAdmin && parsed.data.state !== undefined;
  if (!(ownerCanReview || adminCanProcess || canUpdateState)) {
    return NextResponse.json(
      { error: "You are not authorized to update this order item" },
      { status: 403 }
    );
  }

  const nextStatus = parsed.data.status ?? item.status;
  let nextAccepted = parsed.data.accepted ?? item.accepted;
  if (parsed.data.status === "accepted") {
    nextAccepted = "accepted";
  } else if (parsed.data.status === "declined") {
    nextAccepted = "denied";
  }
  const nextOrdered = parsed.data.ordered ?? item.ordered;
  const nextInvoiceAdded = parsed.data.invoiceAdded ?? item.invoiceAdded;
  const nextPhotoNeeded = parsed.data.photoNeeded ?? item.photoNeeded;
  const nextPhotoUploaded = item.photoUploaded;
  const nextFinalized =
    nextOrdered && nextInvoiceAdded && (!nextPhotoNeeded || nextPhotoUploaded);
  const nextPricePerPiece =
    parsed.data.pricePerPiece ?? Number(item.pricePerPiece);
  const nextAmount = parsed.data.amount ?? item.amount;

  if (parsed.data.status === "accepted" && item.status !== "accepted") {
    const organizationRow = await db.query.organization.findFirst({
      where: eq(organization.id, item.organizationId),
    });
    if (!organizationRow?.driveFolderId) {
      return NextResponse.json(
        { error: "This organization has no configured Google Drive folder." },
        { status: 400 }
      );
    }
    const folderResult = await createOrderRequestFolder({
      organizationFolderId: organizationRow.driveFolderId,
      orderTitle: item.orderName,
      orderedDate: item.orderedDate,
      itemLink: item.link || item.description,
    });
    if (!folderResult.success) {
      return NextResponse.json({ error: folderResult.error }, { status: 502 });
    }
  }

  await db
    .update(orderRequest)
    .set({
      status: nextStatus,
      accepted: nextAccepted,
      approvedBy: nextStatus === "accepted" ? user.name : item.approvedBy,
      reimbursementStatus:
        parsed.data.reimbursementStatus ?? item.reimbursementStatus,
      ordered: nextOrdered,
      invoiceAdded: nextInvoiceAdded,
      finalized: nextFinalized,
      photoNeeded: nextPhotoNeeded,
      state: parsed.data.state ?? item.state,
      orderName: parsed.data.orderName ?? item.orderName,
      description: parsed.data.description ?? item.description,
      link: parsed.data.link ?? item.link,
      pricePerPiece: nextPricePerPiece.toFixed(2),
      amount: nextAmount,
      totalCosts: (nextPricePerPiece * nextAmount).toFixed(2),
      comments: parsed.data.comments ?? item.comments,
      updatedAt: new Date(),
    })
    .where(eq(orderRequest.id, orderRequestId));

  return NextResponse.json({ success: true });
}
