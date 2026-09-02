import { and, eq } from "drizzle-orm";
import { X } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { OrderSheet } from "@/components/forms/order-sheet";
import { Button } from "@/components/ui/button";
import { db } from "@/db/drizzle";
import { member, organization, organizationDepartment } from "@/db/schema";
import { getCurrentUser } from "@/server/users";

type Params = Promise<{ slug: string }>;

export default async function SubOwnerOrdersPage({
  params,
}: {
  params: Params;
}) {
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
      eq(member.role, "sub_owner")
    ),
  });

  if (!membership) {
    redirect(`/dashboard/organization/${slug}`);
  }

  const departments = await db.query.organizationDepartment.findMany({
    where: eq(organizationDepartment.organizationId, selectedOrganization.id),
    orderBy: (organizationDepartment, { asc }) => [
      asc(organizationDepartment.name),
    ],
  });

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-10">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-bold text-2xl">Submit Order List</h1>
        <Button asChild size="icon" type="button" variant="outline">
          <Link
            aria-label="Back to organization menu"
            href={`/dashboard/organization/${slug}`}
          >
            <X className="size-4" />
          </Link>
        </Button>
      </div>
      <OrderSheet
        departments={departments}
        organizationId={selectedOrganization.id}
      />
    </div>
  );
}
