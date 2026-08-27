import { X } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import AllUsers from "@/components/all-users";
import { Button } from "@/components/ui/button";
import { getOrganizationBySlug } from "@/server/organizations";
import { getCurrentUser, getUsers } from "@/server/users";

type Params = Promise<{ slug: string }>;

export default async function InviteMembersPage({
  params,
}: {
  params: Params;
}) {
  const { slug } = await params;
  const { user } = await getCurrentUser();
  const organization = await getOrganizationBySlug(slug);

  if (!organization) {
    redirect("/dashboard");
  }

  const membership = organization.members.find(
    (entry) => entry.userId === user.id
  );

  if (!membership) {
    redirect(`/dashboard/organization/${slug}`);
  }

  const users = await getUsers(organization.id);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4 py-10">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-bold text-2xl">Invite Members</h1>
        <Button asChild size="icon" type="button" variant="outline">
          <Link
            aria-label="Back to organization menu"
            href={`/dashboard/organization/${slug}`}
          >
            <X className="size-4" />
          </Link>
        </Button>
      </div>

      <AllUsers organizationId={organization.id} users={users} />
    </div>
  );
}
