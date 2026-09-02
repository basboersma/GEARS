import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/drizzle";
import { member, orderRequest, organizationDepartment } from "@/db/schema";
import { auth } from "@/lib/auth";

const orderTypeEnum = ["Hardware", "Electronic", "Software", "Social"] as const;
const urgencyEnum = ["1 day", "2 days", "3 days", "7 days"] as const;

const rowSchema = z.object({
  description: z
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
});

const bodySchema = z.object({
  organizationId: z.string().min(1),
  department: z.string().trim().min(1, "Department is required"),
  orderName: z.string().trim().min(1, "Order name is required").max(100),
  rows: z.array(rowSchema).min(1, "At least one row is required"),
});

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

  const submittingMembership = await db.query.member.findFirst({
    where: and(
      eq(member.organizationId, parsed.data.organizationId),
      eq(member.userId, session.user.id)
    ),
  });

  if (
    !(
      submittingMembership &&
      ["owner", "sub_owner"].includes(submittingMembership.role)
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Only organization owners and sub-owners can submit order sheets",
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

  if (allowedDepartments.length > 0) {
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

  const now = new Date();
  const initialStatus =
    submittingMembership.role === "sub_owner" ? "owner_review" : "pending";

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
      status: initialStatus,
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
