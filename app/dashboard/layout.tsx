import { eq } from "drizzle-orm";
import { MemberProfileGate } from "@/components/forms/member-profile-gate";
import { Header } from "@/components/header";
import { db } from "@/db/drizzle";
import { member, studentProfile } from "@/db/schema";
import { getCurrentUser } from "@/server/users";

const isOlderThanOneYear = (finalisationTime: Date) => {
  const renewalDate = new Date(finalisationTime);
  renewalDate.setFullYear(renewalDate.getFullYear() + 1);
  return new Date() >= renewalDate;
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await getCurrentUser();

  const membership = await db.query.member.findFirst({
    where: eq(member.userId, user.id),
  });

  const profile = await db.query.studentProfile.findFirst({
    where: eq(studentProfile.userId, user.id),
  });

  const mustRenewConsent =
    Boolean(profile?.fieldsFilled) &&
    (!profile?.finalisationTime ||
      isOlderThanOneYear(profile.finalisationTime));

  const shouldCompleteProfile =
    Boolean(membership) && (!profile?.fieldsFilled || mustRenewConsent);

  return (
    <div>
      <Header />

      {shouldCompleteProfile ? (
        <MemberProfileGate
          defaults={
            profile
              ? {
                  firstName: profile.firstName,
                  surname: profile.surname,
                  studentNumber: profile.studentNumber,
                  educationalInstitution: profile.educationalInstitution,
                  study: profile.study,
                  ibanNumber: profile.ibanNumber,
                  informationProcessingConsent:
                    profile.inormationProcessingConsent,
                }
              : undefined
          }
        />
      ) : null}

      <div
        className={shouldCompleteProfile ? "pointer-events-none blur-xs" : ""}
      >
        {children}
      </div>
    </div>
  );
}
