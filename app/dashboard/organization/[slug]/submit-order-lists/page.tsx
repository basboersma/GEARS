import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import {
  type AgendaItem,
  ChronologicalAgenda,
} from "@/components/forms/chronological-agenda";
import { OrderSheet } from "@/components/forms/order-sheet";
import { db } from "@/db/drizzle";
import { agendaEvent, member, orderRequest, organization } from "@/db/schema";
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
    orderBy: (fields, { asc }) => [asc(fields.orderedDate)],
    limit: 50,
  });

  const agendaEvents = await db.query.agendaEvent.findMany({
    where: eq(agendaEvent.organizationId, org.id),
    orderBy: (fields, { asc }) => [asc(fields.eventDate)],
    limit: 100,
  });

  const getOrderColor = (order: (typeof orders)[number]) => {
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

  const getOrderLabel = (order: (typeof orders)[number]) => {
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

  const initialAgendaItems: AgendaItem[] = [
    ...orders.map((order) => ({
      id: order.id,
      date: order.orderedDate.toISOString(),
      kind: "order" as const,
      title: order.orderName,
      details: order.description,
      color: getOrderColor(order),
      label: getOrderLabel(order),
    })),
    ...agendaEvents.map((event) => ({
      id: event.id,
      date: event.eventDate.toISOString(),
      kind: event.eventType,
      title: event.title,
      details: event.details || "",
      color: "#FFFFFF",
      label: event.eventType === "meeting" ? "Meeting" : "Minutes",
    })),
  ];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-10">
      <h1 className="font-bold text-2xl">Submit Order Lists</h1>
      <OrderSheet organizationId={org.id} />
      <ChronologicalAgenda
        initialItems={initialAgendaItems}
        organizationId={org.id}
      />
    </div>
  );
}
