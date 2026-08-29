import { and, asc, eq, inArray, or } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/admin-dashboard";
import { OrganizationAgenda } from "@/components/organization-agenda";
import { Button } from "@/components/ui/button";
import { db } from "@/db/drizzle";
import {
  agendaEvent,
  member,
  orderRequest,
  organization as organizationTable,
} from "@/db/schema";
import { getOrganizationDepartments } from "@/server/departments";
import { getOrganizationBySlug } from "@/server/organizations";
import { getCurrentUser } from "@/server/users";

type Params = Promise<{ slug: string }>;

export default async function OrganizationPage({ params }: { params: Params }) {
  const { slug } = await params;
  const { user } = await getCurrentUser();

  const organization = await getOrganizationBySlug(slug);

  if (organization?.adminPage) {
    const adminMembership = await db.query.member.findFirst({
      where: and(
        eq(member.userId, user.id),
        or(eq(member.role, "admin"), eq(member.role, "owner"))
      ),
    });

    if (!adminMembership) {
      redirect("/dashboard");
    }

    const adminMemberships = await db.query.member.findMany({
      where: and(
        eq(member.userId, user.id),
        or(eq(member.role, "admin"), eq(member.role, "owner"))
      ),
    });

    const organizationIds = adminMemberships.map(
      (entry) => entry.organizationId
    );

    const organizations = await db.query.organization.findMany({
      where: inArray(organizationTable.id, organizationIds),
      with: {
        members: {
          with: {
            user: true,
          },
        },
      },
    });

    const allOrderRows = await db.query.orderRequest.findMany({
      where: inArray(orderRequest.organizationId, organizationIds),
    });

    const totalBudget = organizations.reduce(
      (sum, org) => sum + Number(org.budget ?? 0),
      0
    );

    const budgetBreakdown = {
      name: "Total Budget",
      value: totalBudget,
      color: "#FFD142",
      children: organizations.map((org) => {
        const orgRows = allOrderRows.filter(
          (row) => row.organizationId === org.id
        );
        const orgBudget = Number(org.budget ?? 0);

        const departmentMap = orgRows.reduce<Record<string, typeof orgRows>>(
          (groups, row) => {
            const key = row.department || "Unknown";
            groups[key] ??= [];
            groups[key].push(row);
            return groups;
          },
          {}
        );

        const departmentChildren = Object.entries(departmentMap).map(
          ([department, rows]) => ({
            name: `Department ${department}`,
            value: rows.reduce(
              (sum, row) => sum + Number(row.totalCosts || 0),
              0
            ),
            color: "#c084fc",
          })
        );

        return {
          name: org.name,
          value: orgBudget,
          color: "#8b5cf6",
          children:
            departmentChildren.length > 0 ? departmentChildren : undefined,
        };
      }),
    };

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
            orderBy: [
              asc(orderRequest.orderName),
              asc(orderRequest.orderedDate),
            ],
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

        const upcomingOrders = Object.values(
          orderRows
            .filter(
              (row) =>
                !(row.canceled || row.ordered) && row.status !== "accepted"
            )
            .reduce<Record<string, (typeof orderRows)[number][]>>(
              (groups, row) => {
                const key = row.orderName || "Untitled order";
                groups[key] ??= [];
                groups[key].push(row);
                return groups;
              },
              {}
            )
        )
          .map((list) =>
            list.sort((a, b) => Number(a.orderedDate) - Number(b.orderedDate))
          )
          .map((rowsForList) => ({
            id: rowsForList[0]?.id ?? crypto.randomUUID(),
            orderName: rowsForList[0]?.orderName ?? "Untitled order",
            organizationId: org.id,
            organizationName: org.name,
            date: rowsForList[0]?.orderedDate ?? new Date(),
            items: rowsForList.map((row) => ({
              id: row.id,
              department: row.department,
              description: row.description,
              quantity: row.amount,
              urgency: row.urgency,
              typeOfOrder: row.typeOfOrder,
              totalCosts: Number(row.totalCosts || 0),
              photoAdded: row.photoAdded,
              delivered: row.delivered,
              ordered: row.ordered,
              finalized: row.finalized,
              accepted: row.accepted,
              photoNeeded: row.photoNeeded,
              photoUploaded: row.photoUploaded,
              status: row.status,
              comments: row.comments,
            })),
          }))
          .sort(
            (a, b) =>
              a.orderName.localeCompare(b.orderName) ||
              Number(a.date) - Number(b.date)
          );

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
          upcomingOrders,
          allocatedBudget: Number(org.budget ?? 0),
        };
      })
    );

    return (
      <AdminDashboard
        budgetBreakdown={budgetBreakdown}
        organizations={summaries}
      />
    );
  }

  const membership = organization?.members.find((m) => m.userId === user.id);
  const isOwner = membership?.role === "owner";
  const isAdmin = membership?.role === "admin";
  const isMember = Boolean(membership);
  const isOwnerOrAdmin =
    membership?.role === "owner" || membership?.role === "admin";
  const departments = organization?.id
    ? await getOrganizationDepartments(organization.id)
    : [];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 py-10">
      <h1 className="font-bold text-2xl">{organization?.name}</h1>

      {isOwner ? (
        <div className="flex flex-wrap gap-2">
          <Button asChild className="w-fit" variant="outline">
            <Link href={`/dashboard/organization/${slug}/submit-order-lists`}>
              Submit Order Lists
            </Link>
          </Button>
          <Button asChild className="w-fit" variant="outline">
            <Link href={`/dashboard/organization/${slug}/departments`}>
              Manage Departments
            </Link>
          </Button>
        </div>
      ) : null}

      {departments.length > 0 ? (
        <div className="rounded-xl border p-3">
          <h2 className="mb-2 font-semibold text-base">Departments</h2>
          <div className="flex flex-wrap gap-2">
            {departments.map((department) => (
              <span
                className="rounded-full border bg-muted/30 px-2.5 py-1 text-xs"
                key={department.id}
              >
                {department.name}
              </span>
            ))}
          </div>
        </div>
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
