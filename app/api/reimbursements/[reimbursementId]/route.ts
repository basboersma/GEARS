import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/drizzle";
import { member, reimbursementRequest } from "@/db/schema";
import { auth } from "@/lib/auth";

const schema = z.object({
  status: z.enum(["accepted", "declined", "successful"]),
});

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
  if (!(membership?.role === "owner" || membership?.role === "admin")) {
    return NextResponse.json(
      { error: "Owner access is required" },
      { status: 403 }
    );
  }
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid reimbursement status" },
      { status: 400 }
    );
  }
  await db
    .update(reimbursementRequest)
    .set({ status: parsed.data.status, updatedAt: new Date() })
    .where(eq(reimbursementRequest.id, reimbursementId));
  return NextResponse.json({ success: true });
}
