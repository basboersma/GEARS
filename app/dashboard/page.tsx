import { and, desc, eq, inArray } from "drizzle-orm";
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
import { member, orderRequest } from "@/db/schema";
import { getOrganizations } from "@/server/organizations";
import { getCurrentUser } from "@/server/users";

export default async function Dashboard() {
  const organizations = await getOrganizations();
  const { user } = await getCurrentUser();

  const adminMemberships = await db.query.member.findMany({
    where: and(
      eq(member.userId, user.id),
      inArray(member.role, ["admin", "owner"])
    ),
    with: {
      organization: true,
    },
  });

  const adminOrganizationIds = adminMemberships.map(
    (entry) => entry.organizationId
  );

  const organizationNamesById = new Map(
    organizations.map((organization) => [organization.id, organization.name])
  );

  const adminOrderItems =
    adminOrganizationIds.length === 0
      ? []
      : await db.query.orderRequest.findMany({
          where: inArray(orderRequest.organizationId, adminOrganizationIds),
          orderBy: [
            desc(orderRequest.orderedDate),
            desc(orderRequest.createdAt),
          ],
        });

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-10">
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

      {adminOrganizationIds.length > 0 ? (
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-lg">Admin agenda</p>
              <p className="text-muted-foreground text-sm">
                All ordered items across your organizations
              </p>
            </div>
          </div>

          {adminOrderItems.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No ordered items have been submitted in your managed organizations
              yet.
            </p>
          ) : (
            <div className="grid gap-3">
              {adminOrderItems.map((item) => (
                <div
                  className="rounded-lg border bg-muted/30 p-3"
                  key={item.id}
                >
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">{item.orderName}</p>
                      <p className="text-muted-foreground text-xs">
                        {organizationNamesById.get(item.organizationId) ??
                          "Organization"}{" "}
                        · Department {item.department}
                      </p>
                    </div>
                    <span className="rounded-full bg-secondary px-2 py-1 text-[10px] uppercase tracking-[0.08em]">
                      {item.status}
                    </span>
                  </div>

                  <div className="grid gap-1 text-sm sm:grid-cols-3">
                    <p>
                      <span className="text-muted-foreground">Item:</span>{" "}
                      {item.description}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Qty:</span>{" "}
                      {item.amount}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Urgency:</span>{" "}
                      {item.urgency}
                    </p>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                    <span>Ordered: {item.ordered ? "Yes" : "No"}</span>
                    <span>Delivered: {item.delivered ? "Yes" : "No"}</span>
                    <span>Finalized: {item.finalized ? "Yes" : "No"}</span>
                    <span>Photo needed: {item.photoNeeded ? "Yes" : "No"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
