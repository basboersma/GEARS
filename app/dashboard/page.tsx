import { eq, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db/drizzle";
import { member, organization } from "@/db/schema";
import { getCurrentUser } from "@/server/users";

export default async function Dashboard() {
  const { currentUser } = await getCurrentUser();

  const memberships = await db.query.member.findMany({
    where: eq(member.userId, currentUser.id),
  });

  const organizationIds = memberships.map(
    (membership) => membership.organizationId
  );

  if (organizationIds.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#1A1919] px-4 text-[#FFEDD1]">
        <section className="max-w-md rounded-2xl border border-[#3D3330] bg-[#232120] p-6 text-center">
          <h1 className="font-semibold text-lg">No organization membership</h1>
          <p className="mt-2 text-[#9C8272] text-sm">
            Your account is signed in, but it is not connected to an
            organization yet. Ask an administrator to invite this email address.
          </p>
        </section>
      </main>
    );
  }

  const organizations = await db.query.organization.findMany({
    where: inArray(organization.id, organizationIds),
    orderBy: (organization, { asc }) => [asc(organization.name)],
  });

  const adminOrganizationId = memberships.find(
    (membership) => membership.role === "admin"
  )?.organizationId;
  const adminOrganization = organizations.find(
    (entry) => entry.id === adminOrganizationId
  );
  if (adminOrganization?.slug) {
    redirect(`/dashboard/organization/${adminOrganization.slug}`);
  }

  const firstOrganization = organizations[0];

  if (firstOrganization?.slug) {
    redirect(`/dashboard/organization/${firstOrganization.slug}`);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#1A1919] px-4 text-[#FFEDD1]">
      <section className="max-w-md rounded-2xl border border-[#3D3330] bg-[#232120] p-6 text-center">
        <h1 className="font-semibold text-lg">Organization setup incomplete</h1>
        <p className="mt-2 text-[#9C8272] text-sm">
          Your organization does not have a public slug yet. Ask an
          administrator to complete the organization setup.
        </p>
      </section>
    </main>
  );
}
