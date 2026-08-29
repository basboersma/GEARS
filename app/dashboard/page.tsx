import { eq, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db/drizzle";
import { member, organization } from "@/db/schema";
import { getActiveOrganization } from "@/server/organizations";
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

  const activeOrganization = await getActiveOrganization(currentUser.id);
  const selectedOrganization =
    organizations.find((item) => item.id === activeOrganization?.id) ??
    organizations[0];

  if (selectedOrganization?.slug) {
    redirect(`/dashboard/organization/${selectedOrganization.slug}`);
  }

  redirect("/dashboard/admin");
}
