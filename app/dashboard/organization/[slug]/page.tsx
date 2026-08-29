import { and, eq } from "drizzle-orm";
import Link from "next/link";
import AdminDashboardPage from "@/app/dashboard/admin/page";
import { OrganizationAgenda } from "@/components/organization-agenda";
import { Button } from "@/components/ui/button";
import { db } from "@/db/drizzle";
import { member } from "@/db/schema";
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

  if (organization?.adminPage) {
    const adminMemberships = await db.query.member.findMany({
      where: and(eq(member.userId, user.id), eq(member.role, "admin")),
    });

    if (adminMemberships.length === 0) {
      return (
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
            You do not have admin access to the admin page.
          </div>
        </div>
      );
    }

    return <AdminDashboardPage />;
  }

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
