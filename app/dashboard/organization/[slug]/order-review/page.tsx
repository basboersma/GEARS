import { and, eq } from "drizzle-orm";
import { X } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { OwnerOrderReview } from "@/components/owner-order-review";
import { Button } from "@/components/ui/button";
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
    where: and(
      eq(orderRequest.organizationId, selectedOrganization.id),
      eq(orderRequest.status, "owner_review")
    ),
    orderBy: (orderRequest, { asc }) => [asc(orderRequest.createdAt)],
    columns: {
      id: true,
      orderName: true,
      department: true,
      description: true,
      amount: true,
      pricePerPiece: true,
      totalCosts: true,
      comments: true,
    },
  });

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 py-10">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-bold text-2xl">Review Sub-owner Orders</h1>
        <Button asChild size="icon" type="button" variant="outline">
          <Link
            aria-label="Back to organization menu"
            href={`/dashboard/organization/${slug}`}
          >
            <X className="size-4" />
          </Link>
        </Button>
      </div>
      <OwnerOrderReview items={items} />
    </div>
  );
}
