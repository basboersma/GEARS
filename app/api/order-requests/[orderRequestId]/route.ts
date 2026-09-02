import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/drizzle";
import { member, orderRequest } from "@/db/schema";
import { auth } from "@/lib/auth";

const patchSchema = z.object({
  status: z.enum(["pending", "accepted", "declined"]).optional(),
  ordered: z.boolean().optional(),
  photoNeeded: z.boolean().optional(),
  orderName: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().url().optional(),
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
    parsed.data.ordered === undefined &&
    parsed.data.photoNeeded === undefined &&
    parsed.data.orderName === undefined &&
    parsed.data.description === undefined &&
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

  const ownerCanReview =
    membership?.role === "owner" &&
    item.status === "owner_review" &&
    (parsed.data.status === "pending" ||
      parsed.data.status === "declined" ||
      parsed.data.orderName !== undefined ||
      parsed.data.description !== undefined ||
      parsed.data.pricePerPiece !== undefined ||
      parsed.data.amount !== undefined ||
      parsed.data.comments !== undefined);
  const adminCanProcess =
    membership?.role === "admin" &&
    item.status !== "owner_review" &&
    (parsed.data.status === "accepted" ||
      parsed.data.status === "declined" ||
      parsed.data.ordered !== undefined ||
      parsed.data.photoNeeded !== undefined);

  if (!(ownerCanReview || adminCanProcess)) {
    return NextResponse.json(
      { error: "You are not authorized to update this order item" },
      { status: 403 }
    );
  }

  const nextStatus = parsed.data.status ?? item.status;
  const nextOrdered = parsed.data.ordered ?? item.ordered;
  const nextPhotoNeeded = parsed.data.photoNeeded ?? item.photoNeeded;
  const nextPricePerPiece =
    parsed.data.pricePerPiece ?? Number(item.pricePerPiece);
  const nextAmount = parsed.data.amount ?? item.amount;

  await db
    .update(orderRequest)
    .set({
      status: nextStatus,
      accepted: nextStatus === "accepted",
      ordered: nextOrdered,
      photoNeeded: nextPhotoNeeded,
      orderName: parsed.data.orderName ?? item.orderName,
      description: parsed.data.description ?? item.description,
      pricePerPiece: nextPricePerPiece.toFixed(2),
      amount: nextAmount,
      totalCosts: (nextPricePerPiece * nextAmount).toFixed(2),
      comments: parsed.data.comments ?? item.comments,
      updatedAt: new Date(),
    })
    .where(eq(orderRequest.id, orderRequestId));

  return NextResponse.json({ success: true });
}
