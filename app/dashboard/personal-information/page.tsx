import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { EditMemberProfileForm } from "@/components/forms/edit-member-profile-form";
import { db } from "@/db/drizzle";
import { member, studentProfile } from "@/db/schema";
import { getCurrentUser } from "@/server/users";

export default async function PersonalInformationPage() {
  const { user } = await getCurrentUser();

  const membership = await db.query.member.findFirst({
    where: eq(member.userId, user.id),
  });

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
      <div className="mb-6">
        <h1 className="font-semibold text-2xl">Personal Information</h1>
        <p className="text-muted-foreground text-sm">
          Review and edit your personal details.
        </p>
      </div>

      <EditMemberProfileForm
        defaults={{
          firstName: profile.firstName,
          surname: profile.surname,
          studentNumber: profile.studentNumber,
          educationalInstitution: profile.educationalInstitution,
          study: profile.study,
          ibanNumber: profile.ibanNumber,
          informationProcessingConsent: profile.inormationProcessingConsent,
        }}
      />
    </div>
  );
}
