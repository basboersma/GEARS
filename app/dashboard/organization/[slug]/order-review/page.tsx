import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { OwnerOrdersWorkspace } from "@/components/owner-orders-workspace";
import { db } from "@/db/drizzle";
import { member, orderRequest, organization } from "@/db/schema";
import { getCurrentUser } from "@/server/users";

type Params = Promise<{ slug: string }>;

export default async function OrderReviewPage({ params }: { params: Params }) {
  const { slug } = await params;
  const { user } = await getCurrentUser();

  const selectedOrganization = await db.query.organization.findFirst({
    where: eq(organization.slug, slug),
  });

  if (!selectedOrganization) {
    redirect("/dashboard");
  }

  const membership = await db.query.member.findFirst({
    where: and(
      eq(member.userId, user.id),
      eq(member.organizationId, selectedOrganization.id),
      eq(member.role, "owner")
    ),
  });

  if (!membership) {
    redirect(`/dashboard/organization/${slug}`);
  }

  const items = await db.query.orderRequest.findMany({
    where: and(eq(orderRequest.organizationId, selectedOrganization.id)),
    orderBy: (orderRequest, { asc }) => [asc(orderRequest.createdAt)],
    columns: {
      id: true,
      orderName: true,
      department: true,
      description: true,
      amount: true,
      pricePerPiece: true,
      totalCosts: true,
      typeOfOrder: true,
      urgency: true,
      comments: true,
      status: true,
      ordered: true,
      photoNeeded: true,
      photoUploaded: true,
      delivered: true,
      createdAt: true,
    },
  });

  return (
    <OwnerOrdersWorkspace
      items={items.map((item) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
      }))}
      slug={slug}
    />
  );
}
