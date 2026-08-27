import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { OrderSheet } from "@/components/forms/order-sheet";
import { db } from "@/db/drizzle";
import { member, organization } from "@/db/schema";
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

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-10">
      <h1 className="font-bold text-2xl">Submit Order Lists</h1>
      <OrderSheet organizationId={org.id} />
    </div>
  );
}
