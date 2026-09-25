import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/drizzle";
import {
  member,
  organization,
  reimbursementRequest,
  studentProfile,
} from "@/db/schema";
import { auth } from "@/lib/auth";
import { uploadReimbursementAttachment } from "@/lib/google-drive";

const payloadSchema = z.object({
  id: z.string().uuid().optional(),
  organizationId: z.string().min(1),
  name: z.string().trim().min(1).max(200),
  department: z.string().trim().min(1),
  link: z.string().trim().min(1),
  pricePerPiece: z.coerce.number().nonnegative(),
  quantity: z.coerce.number().int().positive(),
  orderType: z.string().trim().min(1),
  urgency: z.string().trim().min(1),
  comments: z.string().trim().min(1).max(200),
});

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await request.formData();
  const parsed = payloadSchema.safeParse({
    id: form.get("id") || undefined,
    organizationId: form.get("organizationId"),
    name: form.get("name"),
    department: form.get("department"),
    link: form.get("link"),
    pricePerPiece: form.get("pricePerPiece"),
    quantity: form.get("quantity"),
    orderType: form.get("orderType"),
    urgency: form.get("urgency"),
    comments: form.get("comments"),
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid reimbursement payload" },
      { status: 400 }
    );
  }

  const membership = await db.query.member.findFirst({
    where: and(
      eq(member.organizationId, parsed.data.organizationId),
      eq(member.userId, session.user.id)
    ),
  });
  if (!membership) {
    return NextResponse.json(
      { error: "Organization membership required" },
      { status: 403 }
    );
  }

  const profile = await db.query.studentProfile.findFirst({
    where: eq(studentProfile.userId, session.user.id),
  });
  if (!profile?.ibanNumber.trim()) {
    return NextResponse.json(
      {
        error: "Add an IBAN to your account before submitting a reimbursement",
      },
      { status: 400 }
    );
  }

  if (parsed.data.id) {
    const existing = await db.query.reimbursementRequest.findFirst({
      where: and(
        eq(reimbursementRequest.id, parsed.data.id),
        eq(reimbursementRequest.userId, session.user.id)
      ),
    });
    if (existing) {
      return NextResponse.json({ success: true, reimbursement: existing });
    }
  }

  const organizationRow = await db.query.organization.findFirst({
    where: eq(organization.id, parsed.data.organizationId),
  });
  if (!organizationRow?.driveFolderId) {
    return NextResponse.json(
      { error: "This organization has no configured Google Drive folder." },
      { status: 400 }
    );
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "A reimbursement image is required" },
      { status: 400 }
    );
  }
  const upload = await uploadReimbursementAttachment({
    organizationFolderId: organizationRow.driveFolderId,
    orderName: parsed.data.name,
    file,
  });
  if (!upload.success) {
    return NextResponse.json({ error: upload.error }, { status: 502 });
  }

  const [created] = await db
    .insert(reimbursementRequest)
    .values({
      id: parsed.data.id ?? crypto.randomUUID(),
      organizationId: parsed.data.organizationId,
      userId: session.user.id,
      name: parsed.data.name,
      department: parsed.data.department,
      submittedBy: session.user.name,
      link: parsed.data.link,
      pricePerPiece: parsed.data.pricePerPiece.toFixed(2),
      quantity: parsed.data.quantity,
      orderType: parsed.data.orderType,
      urgency: parsed.data.urgency,
      comments: parsed.data.comments,
      status:
        membership.role === "owner" || membership.role === "admin"
          ? "accepted"
          : "pending",
    })
    .returning();

  return NextResponse.json({ success: true, reimbursement: created });
}
