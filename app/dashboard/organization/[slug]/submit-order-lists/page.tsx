import { and, eq } from "drizzle-orm";
import { X } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { OrderSheet } from "@/components/forms/order-sheet";
import { Button } from "@/components/ui/button";
import { db } from "@/db/drizzle";
import { member, organization } from "@/db/schema";
import { getOrganizationDepartments } from "@/server/departments";
import { getCurrentUser } from "@/server/users";

type Params = Promise<{ slug: string }>;

export default async function SubmitOrderListsPage({
  params,
}: {
  params: Params;
}) {
  const { slug } = await params;
  const { user } = await getCurrentUser();

  const org = await db.query.organization.findFirst({
    where: eq(organization.slug, slug),
  });

  if (!org) {
    redirect("/dashboard");
  }

  const currentMembership = await db.query.member.findFirst({
    where: and(eq(member.userId, user.id), eq(member.organizationId, org.id)),
  });

  if (
    !currentMembership ||
    currentMembership.organizationId !== org.id ||
    currentMembership.role !== "owner"
  ) {
    redirect(`/dashboard/organization/${slug}`);
  }

  const departments = await getOrganizationDepartments(org.id);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-10">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-bold text-2xl">Submit Order Lists</h1>
        <Button asChild size="icon" type="button" variant="outline">
          <Link
            aria-label="Back to organization menu"
            href={`/dashboard/organization/${slug}`}
          >
            <X className="size-4" />
          </Link>
        </Button>
      </div>

      {departments.length === 0 ? (
        <div className="rounded-xl border border-dashed p-4 text-muted-foreground text-sm">
          No departments have been set up for this organisation yet. Owners can
          add departments from the organisation page.
        </div>
      ) : null}

      <OrderSheet
        departmentOptions={departments.map((entry) => entry.name)}
        organizationId={org.id}
      />
    </div>
  );
}
