import { and, asc, eq, inArray, or, sql } from "drizzle-orm";
import { Search } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { db } from "@/db/drizzle";
import { member, orderRequest, organization } from "@/db/schema";
import { getCurrentUser } from "@/server/users";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
  }).format(value);

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const { user } = await getCurrentUser();
  const params = (await searchParams) ?? {};
  const query = (params.q ?? "").trim();

  const adminMemberships = await db.query.member.findMany({
    where: and(eq(member.userId, user.id), eq(member.role, "admin")),
  });

  if (adminMemberships.length === 0) {
    redirect("/dashboard");
  }

  const organizationIds = adminMemberships.map((entry) => entry.organizationId);

  const organizations = await db.query.organization.findMany({
    where: inArray(organization.id, organizationIds),
    columns: {
      id: true,
      name: true,
    },
  });

  const orderRows = await db.query.orderRequest.findMany({
    where: and(
      inArray(orderRequest.organizationId, organizationIds),
      query
        ? or(
            sql`LOWER(${orderRequest.description}) LIKE ${`%${query.toLowerCase()}%`}`,
            sql`LOWER(${orderRequest.orderName}) LIKE ${`%${query.toLowerCase()}%`}`,
            sql`LOWER(${orderRequest.typeOfOrder}) LIKE ${`%${query.toLowerCase()}%`}`,
            sql`LOWER(${orderRequest.orderedDate}) LIKE ${`%${query.toLowerCase()}%`}`
          )
        : undefined
    ),
    orderBy: [asc(orderRequest.orderedDate), asc(orderRequest.orderName)],
  });

  const rows = orderRows
    .filter(
      (row) =>
        !(row.canceled || row.ordered) &&
        row.status !== "accepted" &&
        row.status !== "owner_review"
    )
    .map((row) => ({
      ...row,
      organizationName:
        organizations.find((org) => org.id === row.organizationId)?.name ??
        "Unknown organization",
    }))
    .sort(
      (a, b) =>
        Number(a.orderedDate) - Number(b.orderedDate) ||
        a.orderName.localeCompare(b.orderName)
    );

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-muted-foreground text-sm">Admin overview</p>
          <h1 className="font-bold text-3xl">Upcoming orders</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/admin">Back to admin</Link>
          </Button>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-3 rounded-lg border bg-muted/20 px-3 py-2">
          <Search className="size-4 text-muted-foreground" />
          <form action="/dashboard/admin/orders" className="w-full">
            <input
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              defaultValue={query}
              name="q"
              placeholder="Search by date, description or category"
              type="search"
            />
          </form>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-lg">All upcoming orders</h2>
          <span className="rounded-full bg-primary/10 px-2 py-1 font-medium text-primary text-xs">
            {rows.length}
          </span>
        </div>

        {rows.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground text-sm">
            No upcoming orders match your search.
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((row) => (
              <div className="rounded-lg border bg-muted/20 p-3" key={row.id}>
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium text-sm">{row.orderName}</p>
                    <p className="text-muted-foreground text-xs">
                      {row.organizationName} • {row.typeOfOrder}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="rounded-full bg-amber-500/10 px-2 py-0.5 font-medium text-[10px] text-amber-700 uppercase tracking-[0.12em]">
                      {row.urgency}
                    </span>
                    <span className="font-medium">
                      {formatCurrency(Number(row.totalCosts || 0))}
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.12em]">
                  <span className="rounded-full bg-background px-2 py-1 text-muted-foreground">
                    {new Date(row.orderedDate).toLocaleDateString()}
                  </span>
                  <span className="rounded-full bg-background px-2 py-1 text-muted-foreground">
                    Qty {row.amount}
                  </span>
                  <span className="rounded-full bg-background px-2 py-1 text-muted-foreground">
                    {row.department}
                  </span>
                </div>

                <p className="mt-3 text-muted-foreground text-sm">
                  {row.description}
                </p>

                <div className="mt-3 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.12em]">
                  {[
                    { label: "Photo", checked: row.photoAdded },
                    { label: "Needed", checked: row.photoNeeded },
                    { label: "Uploaded", checked: row.photoUploaded },
                    { label: "Ordered", checked: row.ordered },
                    { label: "Delivered", checked: row.delivered },
                    { label: "Finalized", checked: row.finalized },
                    { label: "Accepted", checked: row.accepted },
                  ].map(({ label, checked }) => (
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 ${
                        checked
                          ? "bg-emerald-500/10 text-emerald-700"
                          : "bg-muted text-muted-foreground"
                      }`}
                      key={label}
                    >
                      {checked ? "✓" : "○"}
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
