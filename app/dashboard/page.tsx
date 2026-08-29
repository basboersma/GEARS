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

  if (memberships.some((membership) => membership.role === "admin")) {
    redirect("/dashboard/admin");
  }

  const organizationIds = memberships.map(
    (membership) => membership.organizationId
  );

  if (organizationIds.length === 0) {
    redirect("/dashboard/admin");
  }

  const organizations = await db.query.organization.findMany({
    where: inArray(organization.id, organizationIds),
    orderBy: (organization, { asc }) => [asc(organization.name)],
  });

  const firstOrganization = organizations[0];

  if (firstOrganization?.slug) {
    redirect(`/dashboard/organization/${firstOrganization.slug}`);
  }

  redirect("/dashboard/admin");
}
