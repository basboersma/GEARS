import { and, eq, inArray } from "drizzle-orm";
import { AdminDashboard } from "@/components/admin-dashboard";
import { db } from "@/db/drizzle";
import { agendaEvent, member, orderRequest, organization } from "@/db/schema";
import { getCurrentUser } from "@/server/users";

export default async function AdminDashboardPage() {
  const { currentUser } = await getCurrentUser();

  const adminMemberships = await db.query.member.findMany({
    where: and(eq(member.userId, currentUser.id), eq(member.role, "admin")),
  });

  if (adminMemberships.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
          You do not have admin access to any organization.
        </div>
      </div>
    );
  }

  const organizationIds = adminMemberships.map((entry) => entry.organizationId);

  const organizations = await db.query.organization.findMany({
    where: inArray(organization.id, organizationIds),
    with: {
      members: {
        with: {
          user: true,
        },
      },
    },
  });

  const summaries = await Promise.all(
    organizations.map(async (org) => {
      const [agendaItems, orderRows] = await Promise.all([
        db.query.agendaEvent.findMany({
          where: eq(agendaEvent.organizationId, org.id),
          orderBy: (agendaEvent, { asc }) => [asc(agendaEvent.start)],
          limit: 10,
        }),
        db.query.orderRequest.findMany({
          where: eq(orderRequest.organizationId, org.id),
        }),
      ]);

      const orderedTotal = orderRows
        .filter((row) => row.ordered && !row.canceled)
        .reduce((sum, row) => sum + Number(row.totalCosts || 0), 0);

      const pendingTotal = orderRows
        .filter(
          (row) => !(row.ordered || row.canceled) && row.status !== "accepted"
        )
        .reduce((sum, row) => sum + Number(row.totalCosts || 0), 0);

      return {
        id: org.id,
        name: org.name,
        slug: org.slug ?? "",
        members: org.members,
        agendaItems: agendaItems.map((item) => ({
          id: item.id,
          title: item.title,
          start: item.start,
        })),
        orderedTotal,
        pendingTotal,
      };
    })
  );

  return <AdminDashboard organizations={summaries} />;
}
