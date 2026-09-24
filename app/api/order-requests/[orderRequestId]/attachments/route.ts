import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { member, orderRequest, organization } from "@/db/schema";
import { auth } from "@/lib/auth";
import { uploadOrderRequestAttachment } from "@/lib/google-drive";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderRequestId: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
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
      eq(member.userId, session.user.id),
      eq(member.organizationId, item.organizationId)
    ),
  });
  if (!(membership?.role === "owner" || membership?.role === "admin")) {
    return NextResponse.json(
      { error: "Admin or owner access is required" },
      { status: 403 }
    );
  }
  const file = (await request.formData()).get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "A file is required" }, { status: 400 });
  }
  const organizationRow = await db.query.organization.findFirst({
    where: eq(organization.id, item.organizationId),
  });
  if (!organizationRow?.driveFolderId) {
    return NextResponse.json(
      { error: "This organization has no configured Google Drive folder." },
      { status: 400 }
    );
  }
  const result = await uploadOrderRequestAttachment({
    organizationFolderId: organizationRow.driveFolderId,
    orderTitle: item.orderName,
    orderedDate: item.orderedDate,
    itemLink: item.link || item.description,
    file,
  });
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }
  const finalized = item.ordered && (!item.photoNeeded || item.photoUploaded);
  await db
    .update(orderRequest)
    .set({ invoiceAdded: true, finalized, updatedAt: new Date() })
    .where(eq(orderRequest.id, item.id));
  return NextResponse.json({ success: true });
}
