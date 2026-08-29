import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/drizzle";
import { member, orderRequest } from "@/db/schema";
import { auth } from "@/lib/auth";

const patchSchema = z.object({
  status: z.enum(["accepted", "declined"]).optional(),
  ordered: z.boolean().optional(),
  photoNeeded: z.boolean().optional(),
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

  const membership = await db.query.member.findFirst({
    where: and(
      eq(member.userId, user.id),
      eq(member.organizationId, item.organizationId),
      eq(member.role, "admin")
    ),
  });

  const ownerMembership = await db.query.member.findFirst({
    where: and(
      eq(member.userId, user.id),
      eq(member.organizationId, item.organizationId),
      eq(member.role, "owner")
    ),
  });

  if (!(membership || ownerMembership)) {
    return NextResponse.json(
      { error: "Only organization admins can update order items" },
      { status: 403 }
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
    parsed.data.photoNeeded === undefined
  ) {
    return NextResponse.json(
      { error: "No order item fields were provided" },
      { status: 400 }
    );
  }

  const nextStatus = parsed.data.status ?? item.status;
  const nextOrdered = parsed.data.ordered ?? item.ordered;
  const nextPhotoNeeded = parsed.data.photoNeeded ?? item.photoNeeded;

  await db
    .update(orderRequest)
    .set({
      status: nextStatus,
      accepted: nextStatus === "accepted",
      ordered: nextOrdered,
      photoNeeded: nextPhotoNeeded,
      updatedAt: new Date(),
    })
    .where(eq(orderRequest.id, orderRequestId));

  return NextResponse.json({ success: true });
}
