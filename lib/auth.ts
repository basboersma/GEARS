import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import {
  lastLoginMethod,
  organization as organizationPlugin,
} from "better-auth/plugins";
import { eq } from "drizzle-orm";
import type { ReactNode } from "react";
import { Resend } from "resend";
import OrganizationInvitationEmail from "@/components/emails/organization-invitation";
import ForgotPasswordEmail from "@/components/emails/reset-password";
import VerifyEmail from "@/components/emails/verify-email";
import WelcomeEmail from "@/components/emails/welcome-email";
import { db } from "@/db/drizzle";
import {
  member as memberTable,
  organization as organizationTable,
  schema,
} from "@/db/schema";
import { createOrganizationDriveFolders } from "@/lib/google-drive";
import { admin, owner, member as permissionMember } from "./auth/permissions";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const senderAddress = process.env.EMAIL_SENDER_ADDRESS?.trim();
const senderName = process.env.EMAIL_SENDER_NAME?.trim() || "GEARS";
const emailAddressPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isValidEmailAddress = (value: string) => emailAddressPattern.test(value);
const senderEmail =
  senderAddress && isValidEmailAddress(senderAddress)
    ? `${senderName} <${senderAddress}>`
    : null;
const appUrl = (
  process.env.NEXT_PUBLIC_APP_URL?.trim() ||
  process.env.BETTER_AUTH_URL?.trim() ||
  "https://gearsnl.org"
).replace(/\/$/, "");

async function resolveActiveOrganizationForUser(userId: string) {
  const membership = await db.query.member.findFirst({
    where: eq(memberTable.userId, userId),
  });

  if (!membership) {
    return null;
  }

  return db.query.organization.findFirst({
    where: eq(organizationTable.id, membership.organizationId),
  });
}

async function sendEmailSafely({
  to,
  subject,
  react,
}: {
  to: string;
  subject: string;
  react: ReactNode;
}) {
  if (!resend) {
    console.warn("Skipping email send due to missing/invalid email config", {
      hasResendApiKey: Boolean(process.env.RESEND_API_KEY),
      hasValidSenderEmail: Boolean(senderEmail),
      to,
      subject,
    });
    return;
  }

  if (!senderEmail) {
    console.warn("Skipping email send due to missing/invalid email config", {
      hasResendApiKey: Boolean(process.env.RESEND_API_KEY),
      hasValidSenderEmail: false,
      to,
      subject,
    });
    return;
  }

  try {
    const { error } = await resend.emails.send({
      from: senderEmail,
      to,
      subject,
      react,
    });

    if (error) {
      console.error("Resend reported an email delivery error", {
        to,
        subject,
        error,
      });
    }
  } catch (error) {
    console.error("Unexpected email send failure", {
      to,
      subject,
      error,
    });
  }
}

export const auth = betterAuth({
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmailSafely({
        to: user.email,
        subject: "Verify your email",
        react: VerifyEmail({ username: user.name, verifyUrl: url }),
      });
    },
    sendOnSignUp: true,
  },

  //organizationOnly: false,

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      hd: "student.rug.nl",
    },
  },
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      await sendEmailSafely({
        to: user.email,
        subject: "Reset your password",
        react: ForgotPasswordEmail({
          username: user.name,
          resetUrl: url,
          userEmail: user.email,
        }),
      });
    },
    requireEmailVerification: true,
  },
  databaseHooks: {
    user: {
      create: {
        after: async (createdUser) => {
          await sendEmailSafely({
            to: createdUser.email,
            subject: "Welcome to GEARS!",
            react: WelcomeEmail({
              username: createdUser.name,
              dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
            }),
          });
        },
      },
    },
    session: {
      create: {
        before: async (session) => {
          let activeOrganizationId: string | undefined;

          // Do not block login if organization lookup fails.
          try {
            const activeOrganization = await resolveActiveOrganizationForUser(
              session.userId
            );
            activeOrganizationId = activeOrganization?.id;
          } catch (error) {
            console.error("Failed to resolve active organization on login", {
              userId: session.userId,
              error,
            });
          }

          return {
            data: {
              ...session,
              activeOrganizationId,
            },
          };
        },
      },
    },
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  plugins: [
    organizationPlugin({
      //organizationOnly: false,
      organizationCreation: {
        afterCreate: async ({ organization }) => {
          const result = await createOrganizationDriveFolders({
            name: organization.name,
          });

          if (!result.success) {
            console.error(
              "Failed to create Google Drive folders for organization",
              {
                organizationId: organization.id,
                error: result.error,
              }
            );
            return;
          }

          await db
            .update(organizationTable)
            .set({
              driveFolderId: result.folderId,
              driveMeetingsFolderId: result.meetingsFolderId,
            })
            .where(eq(organizationTable.id, organization.id));
        },
      },
      sendInvitationEmail: async (data) => {
        const inviteLink = `${appUrl}/api/accept-invitation/${data.id}`;

        await sendEmailSafely({
          to: data.email,
          subject: "You've been invited to join our organization",
          react: OrganizationInvitationEmail({
            email: data.email,
            invitedByUsername: data.inviter.user.name,
            invitedByEmail: data.inviter.user.email,
            teamName: data.organization.name,
            inviteLink,
          }),
        });
      },
      roles: {
        owner,
        admin,
        member: permissionMember,
      },
    }),
    lastLoginMethod(),
    nextCookies(),
  ],
});
