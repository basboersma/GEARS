import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db/drizzle";
import { orderRequest } from "@/db/schema";
import { PhotoUpload } from "./photo-upload";

export default async function OrderPhotoPage({
  params,
}: {
  params: Promise<{ orderRequestId: string }>;
}) {
  const { orderRequestId } = await params;
  const item = await db.query.orderRequest.findFirst({
    where: eq(orderRequest.id, orderRequestId),
  });
  if (!item) {
    notFound();
  }
  return (
    <PhotoUpload
      itemLink={item.link || item.description}
      orderRequestId={item.id}
    />
  );
}
