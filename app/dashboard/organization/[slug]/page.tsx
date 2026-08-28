import { asc, eq } from "drizzle-orm";
import Link from "next/link";
import { OrganizationAgenda } from "@/components/organization-agenda";
import { TreasurerOverview } from "@/components/treasurer-overview";
import { Button } from "@/components/ui/button";
import { db } from "@/db/drizzle";
import { orderRequest } from "@/db/schema";
import { getOrganizationBySlug } from "@/server/organizations";
import { getCurrentUser } from "@/server/users";

type Params = Promise<{ slug: string }>;

export default async function OrganizationPage({ params }: { params: Params }) {
  const { slug } = await params;
  const { user } = await getCurrentUser();

  const organization = await getOrganizationBySlug(slug);
  const membership = organization?.members.find((m) => m.userId === user.id);
  const isOwner = membership?.role === "owner";
  const isAdmin = membership?.role === "admin";
  const isMember = Boolean(membership);
  const isOwnerOrAdmin =
    membership?.role === "owner" || membership?.role === "admin";
  const isTreasurerOrganization = organization?.slug === "treasurer";

  const treasurerItems =
    isTreasurerOrganization && organization?.id
      ? await db.query.orderRequest.findMany({
          where: eq(orderRequest.organizationId, organization.id),
          orderBy: [asc(orderRequest.orderedDate), asc(orderRequest.createdAt)],
        })
      : [];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 py-10">
      <h1 className="font-bold text-2xl">{organization?.name}</h1>

      {isOwner || (isAdmin && isTreasurerOrganization) ? (
        <Button asChild className="w-fit" variant="outline">
          <Link href={`/dashboard/organization/${slug}/submit-order-lists`}>
            Submit Order Lists
          </Link>
        </Button>
      ) : null}

      {isTreasurerOrganization ? (
        <TreasurerOverview items={treasurerItems} showTodo={isAdmin} />
      ) : null}

      {isMember && organization?.id ? (
        <OrganizationAgenda
          canEnableVoting={isAdmin}
          canManageAgenda={isOwnerOrAdmin}
          organizationId={organization.id}
        />
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline">
          <Link href={`/dashboard/organization/${slug}/members`}>
            Organization Members
          </Link>
        </Button>

        <Button asChild variant="outline">
          <Link href={`/dashboard/organization/${slug}/invite-members`}>
            Invite Members
          </Link>
        </Button>
      </div>
    </div>
  );
}
