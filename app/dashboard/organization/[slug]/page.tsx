import Link from "next/link";
import { redirect } from "next/navigation";
import { OrganizationAgenda } from "@/components/organization-agenda";
import { Button } from "@/components/ui/button";
import { getOrganizationBySlug } from "@/server/organizations";
import { getCurrentUser } from "@/server/users";

type Params = Promise<{ slug: string }>;

export default async function OrganizationPage({ params }: { params: Params }) {
  const { slug } = await params;
  const { user } = await getCurrentUser();

  const organization = await getOrganizationBySlug(slug);
  const membership = organization?.members.find((m) => m.userId === user.id);

  if (!(organization && membership)) {
    redirect("/dashboard");
  }

  const isOwner = membership?.role === "owner";
  const isAdmin = membership?.role === "admin";
  const isMember = Boolean(membership);
  const isOwnerOrAdmin =
    membership?.role === "owner" || membership?.role === "admin";

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 py-10">
      <h1 className="font-bold text-2xl">{organization?.name}</h1>

      {isOwner ? (
        <div className="flex flex-wrap gap-2">
          <Button asChild className="w-fit" variant="outline">
            <Link href={`/dashboard/organization/${slug}/submit-order-lists`}>
              Submit Order Lists
            </Link>
          </Button>
          <Button asChild className="w-fit" variant="outline">
            <Link href={`/dashboard/organization/${slug}/departments`}>
              Manage Departments
            </Link>
          </Button>
          <Button asChild className="w-fit" variant="outline">
            <Link href={`/dashboard/organization/${slug}/order-review`}>
              Review Sub-owner Orders
            </Link>
          </Button>
        </div>
      ) : null}

      {membership?.role === "sub_owner" ? (
        <Button asChild className="w-fit" variant="outline">
          <Link href={`/dashboard/organization/${slug}/sub-owner-orders`}>
            Submit Order List
          </Link>
        </Button>
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
