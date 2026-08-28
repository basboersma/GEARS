import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/drizzle";
import { member, orderRequest } from "@/db/schema";
import { auth } from "@/lib/auth";

const orderTypeEnum = ["Hardware", "Electronic", "Software", "Social"] as const;
const urgencyEnum = ["1 day", "2 days", "3 days", "7 days"] as const;
const departmentEnum = ["1", "2", "3", "4", "5"] as const;

const rowSchema = z.object({
  description: z.string().trim().min(1, "Description is required"),
  pricePerPiece: z.coerce.number().positive("Price must be greater than 0"),
  quantity: z.coerce.number().int().positive("Quantity must be greater than 0"),
  orderType: z.enum(orderTypeEnum),
  urgency: z.enum(urgencyEnum),
  comments: z
    .string()
    .max(200, "Comments can be max 200 characters")
    .default(""),
});

const bodySchema = z.object({
  organizationId: z.string().min(1),
  department: z.enum(departmentEnum),
  orderName: z.string().trim().min(1, "Order name is required").max(100),
  rows: z.array(rowSchema).min(1, "At least one row is required"),
});

const patchSchema = z
  .object({
    orderRequestId: z.string().min(1),
    status: z.enum(["pending", "accepted", "declined"]).optional(),
    ordered: z.boolean().optional(),
    photoNeeded: z.boolean().optional(),
  })
  .refine(
    (payload) =>
      payload.status !== undefined ||
      payload.ordered !== undefined ||
      payload.photoNeeded !== undefined,
    {
      message: "Provide at least one field to update",
      path: ["orderRequestId"],
    }
  );

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json();
  const parsed = bodySchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid order payload",
        details: parsed.error.flatten(),
      },
      { status: 400 }
    );
  }

  const ownerMembership = await db.query.member.findFirst({
    where: and(
      eq(member.organizationId, parsed.data.organizationId),
      eq(member.userId, session.user.id),
      eq(member.role, "owner")
    ),
  });

  if (!ownerMembership) {
    return NextResponse.json(
      { error: "Only organization owners can submit order sheets" },
      { status: 403 }
    );
  }

  const now = new Date();

  const rowsToInsert = parsed.data.rows.map((row) => {
    const total = row.pricePerPiece * row.quantity;

    return {
      id: crypto.randomUUID(),
      organizationId: parsed.data.organizationId,
      userId: session.user.id,
      department: parsed.data.department,
      orderName: parsed.data.orderName,
      description: row.description,
      pricePerPiece: row.pricePerPiece.toFixed(2),
      amount: row.quantity,
      typeOfOrder: row.orderType,
      urgency: row.urgency,
      comments: row.comments,
      additionalCosts: "0.00",
      totalCosts: total.toFixed(2),
      orderedDate: now,
      photoAdded: false,
      delivered: false,
      ordered: false,
      finalized: false,
      status: "pending" as const,
      photoNeeded: false,
      photoUploaded: false,
      canceled: false,
      accepted: false,
      createdAt: now,
      updatedAt: now,
    };
  });

  await db.insert(orderRequest).values(rowsToInsert);

  return NextResponse.json({
    success: true,
    inserted: rowsToInsert.length,
  });
}

export async function PATCH(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json();
  const parsed = patchSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid order update payload",
        details: parsed.error.flatten(),
      },
      { status: 400 }
    );
  }

  const existing = await db.query.orderRequest.findFirst({
    where: eq(orderRequest.id, parsed.data.orderRequestId),
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Order request not found" },
      { status: 404 }
    );
  }

  const adminMembership = await db.query.member.findFirst({
    where: and(
      eq(member.organizationId, existing.organizationId),
      eq(member.userId, session.user.id),
      eq(member.role, "admin")
    ),
  });

  if (!adminMembership) {
    return NextResponse.json(
      { error: "Only organization admins can update order requests" },
      { status: 403 }
    );
  }

  const nextStatus = parsed.data.status;
  let accepted = existing.accepted;

  if (nextStatus === "accepted") {
    accepted = true;
  } else if (nextStatus === "declined") {
    accepted = false;
  }

  await db
    .update(orderRequest)
    .set({
      ...(nextStatus ? { status: nextStatus } : {}),
      ...(parsed.data.ordered !== undefined
        ? { ordered: parsed.data.ordered }
        : {}),
      ...(parsed.data.photoNeeded !== undefined
        ? { photoNeeded: parsed.data.photoNeeded }
        : {}),
      accepted,
      updatedAt: new Date(),
    })
    .where(eq(orderRequest.id, parsed.data.orderRequestId));

  return NextResponse.json({ success: true });
}
