import { eq } from "drizzle-orm";
import { XIcon } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EditMemberProfileForm } from "@/components/forms/edit-member-profile-form";
import { Button } from "@/components/ui/button";
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
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-semibold text-2xl">Account</h1>
          <p className="text-muted-foreground text-sm">
            Review and edit your personal details.
          </p>
        </div>
        <Button asChild size="icon" variant="outline">
          <Link aria-label="Close account page" href="/dashboard">
            <XIcon className="size-4" />
          </Link>
        </Button>
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
