import { and, desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { OrderSheet } from "@/components/forms/order-sheet";
import { db } from "@/db/drizzle";
import { member, orderRequest, organization } from "@/db/schema";
import { getCurrentUser } from "@/server/users";

type Params = Promise<{ slug: string }>;

export default async function SubmitOrderListsPage({
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

  if (
    !currentMembership ||
    currentMembership.organizationId !== org.id ||
    currentMembership.role !== "owner"
  ) {
    redirect(`/dashboard/organization/${slug}`);
  }

  const orders = await db.query.orderRequest.findMany({
    where: eq(orderRequest.organizationId, org.id),
    orderBy: [desc(orderRequest.createdAt)],
    limit: 50,
  });

  const placementCount = orders.filter(
    (order) => !(order.accepted || order.delivered || order.canceled)
  ).length;
  const orderedCount = orders.filter(
    (order) => order.accepted && !order.delivered && !order.canceled
  ).length;
  const deliveredCount = orders.filter(
    (order) => order.delivered && !order.canceled
  ).length;
  const deniedCount = orders.filter((order) => order.canceled).length;

  const getAgendaColor = (order: (typeof orders)[number]) => {
    if (order.canceled) {
      return "#F0684D";
    }

    if (order.delivered) {
      return "#FFD141";
    }

    if (order.accepted) {
      return "#FFED11";
    }

    return "#FFFFFF";
  };

  const getAgendaLabel = (order: (typeof orders)[number]) => {
    if (order.canceled) {
      return "Denied";
    }

    if (order.delivered) {
      return "Delivered";
    }

    if (order.accepted) {
      return "Ordered";
    }

    return "Placed";
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-10">
      <h1 className="font-bold text-2xl">Submit Order Lists</h1>
      <OrderSheet organizationId={org.id} />

      <section className="mt-6 rounded-xl border border-border bg-card p-6">
        <h2 className="font-semibold text-xl">Order Agenda</h2>
        <p className="mt-1 text-muted-foreground text-sm">
          Track order placement and status by color.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
          <div
            className="rounded-md border border-border p-3"
            style={{ backgroundColor: "#FFFFFF", color: "#1A1919" }}
          >
            <p className="font-medium">Placement</p>
            <p className="text-sm">{placementCount} items</p>
          </div>
          <div
            className="rounded-md border border-border p-3"
            style={{ backgroundColor: "#FFED11", color: "#1A1919" }}
          >
            <p className="font-medium">Ordered</p>
            <p className="text-sm">{orderedCount} items</p>
          </div>
          <div
            className="rounded-md border border-border p-3"
            style={{ backgroundColor: "#FFD141", color: "#1A1919" }}
          >
            <p className="font-medium">Delivered</p>
            <p className="text-sm">{deliveredCount} items</p>
          </div>
          <div
            className="rounded-md border border-border p-3"
            style={{ backgroundColor: "#F0684D", color: "#1A1919" }}
          >
            <p className="font-medium">Denied</p>
            <p className="text-sm">{deniedCount} items</p>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[44rem] border-collapse">
            <thead>
              <tr className="border-border border-b text-left text-sm">
                <th className="px-3 py-2">Order Name</th>
                <th className="px-3 py-2">Description</th>
                <th className="px-3 py-2">Department</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Ordered Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td
                    className="px-3 py-3 text-muted-foreground text-sm"
                    colSpan={5}
                  >
                    No orders submitted yet.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr className="border-border border-b" key={order.id}>
                    <td className="px-3 py-2 text-sm">{order.orderName}</td>
                    <td className="px-3 py-2 text-sm">{order.description}</td>
                    <td className="px-3 py-2 text-sm">{order.department}</td>
                    <td className="px-3 py-2 text-sm">
                      <span
                        className="inline-flex rounded px-2 py-0.5 font-medium"
                        style={{
                          backgroundColor: getAgendaColor(order),
                          color: "#1A1919",
                        }}
                      >
                        {getAgendaLabel(order)}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-sm">
                      {order.orderedDate.toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
