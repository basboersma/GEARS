import Link from "next/link";
import AllUsers from "@/components/all-users";
import MembersTable from "@/components/members-table";
import { Button } from "@/components/ui/button";
import { getOrganizationBySlug } from "@/server/organizations";
import { getCurrentUser, getUsers } from "@/server/users";

type Params = Promise<{ slug: string }>;

export default async function OrganizationPage({ params }: { params: Params }) {
  const { slug } = await params;
  const { user } = await getCurrentUser();

  const organization = await getOrganizationBySlug(slug);
  const users = await getUsers(organization?.id || "");
  const membership = organization?.members.find((m) => m.userId === user.id);
  const isOwner = membership?.role === "owner";

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 py-10">
      <h1 className="font-bold text-2xl">{organization?.name}</h1>

      {isOwner ? (
        <Button asChild className="w-fit" variant="outline">
          <Link href={`/dashboard/organization/${slug}/submit-order-lists`}>
            Submit Order Lists
          </Link>
        </Button>
      ) : null}

      <MembersTable members={organization?.members || []} />
      <AllUsers organizationId={organization?.id || ""} users={users} />
    </div>
  );
}
