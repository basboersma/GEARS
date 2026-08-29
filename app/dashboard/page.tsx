import { eq } from "drizzle-orm";
import Link from "next/link";
import { CreateOrganizationForm } from "@/components/forms/create-organization-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { db } from "@/db/drizzle";
import { member } from "@/db/schema";
import { getOrganizations } from "@/server/organizations";
import { getCurrentUser } from "@/server/users";

export default async function Dashboard() {
  const organizations = await getOrganizations();
  const { currentUser } = await getCurrentUser();

  const memberships = await db.query.member.findMany({
    where: eq(member.userId, currentUser.id),
  });

  const isAdmin = memberships.some((membership) => membership.role === "admin");
  const isOwner = memberships.some((membership) => membership.role === "owner");
  const showAdminButton = isAdmin && !isOwner;

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-2">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">Create Organization</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Organization</DialogTitle>
            <DialogDescription>
              Create a new organization to get started.
            </DialogDescription>
          </DialogHeader>
          <CreateOrganizationForm />
        </DialogContent>
      </Dialog>

      {showAdminButton ? (
        <Button asChild variant="default">
          <Link href="/dashboard/admin">Admin Dashboard</Link>
        </Button>
      ) : null}

      <div className="flex flex-col gap-2">
        <h2 className="font-bold text-2xl">Organizations</h2>
        {organizations.map((organization) => (
          <Button asChild key={organization.id} variant="outline">
            <Link href={`/dashboard/organization/${organization.slug}`}>
              {organization.name}
            </Link>
          </Button>
        ))}
      </div>
    </div>
  );
}
