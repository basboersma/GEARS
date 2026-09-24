import { redirect } from "next/navigation";
import { ReimbursementForm } from "@/components/forms/reimbursement-form";
import { db } from "@/db/drizzle";
import { getCurrentUser } from "@/server/users";

export default async function ReimbursePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { user } = await getCurrentUser();
  const organizationRow = await db.query.organization.findFirst({
    where: (row, { eq }) => eq(row.slug, slug),
  });
  if (!organizationRow) {
    redirect("/dashboard");
  }
  const membership = await db.query.member.findFirst({
    where: (row, { and, eq }) =>
      and(eq(row.organizationId, organizationRow.id), eq(row.userId, user.id)),
  });
  if (!membership) {
    redirect(`/dashboard/organization/${slug}`);
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10">
      <ReimbursementForm organizationId={organizationRow.id} />
    </main>
  );
}
