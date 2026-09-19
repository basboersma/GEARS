import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { BackButton } from "@/components/back-button";
import { EditMemberProfileForm } from "@/components/forms/edit-member-profile-form";
import { db } from "@/db/drizzle";
import { member, studentProfile } from "@/db/schema";
import { getCurrentUser } from "@/server/users";

export default async function PersonalInformationPage() {
  const { user, session } = await getCurrentUser();

  const activeMembership = session.activeOrganizationId
    ? await db.query.member.findFirst({
        where: and(
          eq(member.userId, user.id),
          eq(member.organizationId, session.activeOrganizationId)
        ),
      })
    : null;
  const membership =
    activeMembership ??
    (await db.query.member.findFirst({ where: eq(member.userId, user.id) }));

  if (!membership) {
    redirect("/dashboard");
  }

  const profile = await db.query.studentProfile.findFirst({
    where: eq(studentProfile.userId, user.id),
  });

  if (!profile) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto mt-24 w-full max-w-4xl px-4 pb-10">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-semibold text-2xl">Account</h1>
          <p className="text-muted-foreground text-sm">
            Review and edit your personal details.
          </p>
        </div>
        <BackButton />
      </div>

      <EditMemberProfileForm
        defaults={{
          firstName: profile.firstName,
          surname: profile.surname,
          studentNumber: profile.studentNumber,
          educationalInstitution: profile.educationalInstitution,
          study: profile.study,
          ibanNumber: profile.ibanNumber,
          gender: profile.gender,
          nationality: profile.nationality,
          informationProcessingConsent: profile.inormationProcessingConsent,
        }}
        organizationId={
          membership.role === "owner" || membership.role === "admin"
            ? membership.organizationId
            : undefined
        }
        organizationRole={
          membership.role === "owner" || membership.role === "admin"
            ? membership.role
            : undefined
        }
      />
    </div>
  );
}
