import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { orderRequest, organization } from "@/db/schema";
import { uploadOrderRequestAttachment } from "@/lib/google-drive";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderRequestId: string }> }
) {
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
  return NextResponse.json({ photoUploaded: item.photoUploaded });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderRequestId: string }> }
) {
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
  const file = (await request.formData()).get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "A photo is required" }, { status: 400 });
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
  await db
    .update(orderRequest)
    .set({ photoAdded: true, photoUploaded: true, updatedAt: new Date() })
    .where(eq(orderRequest.id, item.id));
  return NextResponse.json({ success: true });
}
