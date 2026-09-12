import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { MobileVotePage } from "@/components/owner-dashboard/MobileVotePage";
import { db } from "@/db/drizzle";
import { member, organization } from "@/db/schema";
import { getCurrentUser } from "@/server/users";

type Params = Promise<{ slug: string }>;

export default async function GMAVoteRoute({ params }: { params: Params }) {
  const { slug } = await params;
  const { user } = await getCurrentUser();
  const selectedOrganization = await db.query.organization.findFirst({
    where: eq(organization.slug, slug),
  });

  if (!selectedOrganization) {
    redirect("/dashboard");
  }

  const membership = await db.query.member.findFirst({
    where: and(
      eq(member.userId, user.id),
      eq(member.organizationId, selectedOrganization.id)
    ),
  });

  if (!membership) {
    redirect("/dashboard");
  }

  return <MobileVotePage organizationSlug={slug} />;
}
