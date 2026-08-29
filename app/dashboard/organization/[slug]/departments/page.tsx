import { and, eq } from "drizzle-orm";
import { Plus, Trash2, X } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { db } from "@/db/drizzle";
import { member, organization } from "@/db/schema";
import {
  addOrganizationDepartment,
  deleteOrganizationDepartment,
  getOrganizationDepartments,
} from "@/server/departments";
import { getCurrentUser } from "@/server/users";

async function handleAddDepartment(formData: FormData) {
  "use server";

  const organizationId = formData.get("organizationId")?.toString();
  const name = formData.get("name")?.toString() ?? "";

  if (!organizationId) {
    return;
  }

  await addOrganizationDepartment(organizationId, name);
}

async function handleDeleteDepartment(formData: FormData) {
  "use server";

  const departmentId = formData.get("departmentId")?.toString();

  if (!departmentId) {
    return;
  }

  await deleteOrganizationDepartment(departmentId);
}

type Params = Promise<{ slug: string }>;

export default async function OrganizationDepartmentsPage({
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

  if (!currentMembership || currentMembership.role !== "owner") {
    redirect(`/dashboard/organization/${slug}`);
  }

  const departments = await getOrganizationDepartments(org.id);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-10">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-bold text-2xl">Departments</h1>
        <Button asChild size="icon" type="button" variant="outline">
          <Link
            aria-label="Back to organization menu"
            href={`/dashboard/organization/${slug}`}
          >
            <X className="size-4" />
          </Link>
        </Button>
      </div>

      <form action={handleAddDepartment} className="rounded-xl border p-4">
        <input name="organizationId" type="hidden" value={org.id} />
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            className="h-10 flex-1 rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            name="name"
            placeholder="Department name"
          />
          <Button type="submit" variant="default">
            <Plus className="mr-2 size-4" />
            Add department
          </Button>
        </div>
      </form>

      <div className="rounded-xl border p-4">
        {departments.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No departments configured yet.
          </p>
        ) : (
          <div className="space-y-2">
            {departments.map((department) => (
              <div
                className="flex items-center justify-between gap-3 rounded-lg border p-3"
                key={department.id}
              >
                <span className="font-medium text-sm">{department.name}</span>
                <form action={handleDeleteDepartment}>
                  <input
                    name="departmentId"
                    type="hidden"
                    value={department.id}
                  />
                  <Button size="sm" type="submit" variant="destructive">
                    <Trash2 className="mr-2 size-4" />
                    Delete
                  </Button>
                </form>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
