import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { invitation as invitationTable, member, team } from "@/db/schema";
import { auth } from "@/lib/auth";
import {
  recordCurrentTeamSnapshot,
  recordMembershipJoin,
} from "@/server/membership-history";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ invitationId: string }> }
) {
  const { invitationId } = await params;

  const session = await auth.api.getSession({ headers: await headers() });

  // Accepting an invitation requires a logged-in session matching the invited email.
  if (!session) {
    const invitationRecord = await db.query.invitation.findFirst({
      where: eq(invitationTable.id, invitationId),
    });

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("invitationId", invitationId);
    if (invitationRecord?.email) {
      loginUrl.searchParams.set("email", invitationRecord.email);
    }

    return NextResponse.redirect(loginUrl);
  }

  const invitationRecord = await db.query.invitation.findFirst({
    where: eq(invitationTable.id, invitationId),
  });

  const dashboardUrl = new URL("/dashboard", request.url);
  let inviteStatus: "accepted" | "error" = "accepted";

  try {
    await auth.api.acceptInvitation({
      body: {
        invitationId,
      },
      headers: await headers(),
    });

    const newMember = invitationRecord
      ? await db.query.member.findFirst({
          where: and(
            eq(member.organizationId, invitationRecord.organizationId),
            eq(member.userId, session.user.id)
          ),
        })
      : null;
    if (newMember) {
      await recordMembershipJoin(newMember);
    }

    if (invitationRecord?.departmentIds && newMember) {
      const departmentIds = JSON.parse(
        invitationRecord.departmentIds
      ) as string[];

      if (departmentIds.length > 0) {
        await db
          .insert(team)
          .values(
            departmentIds.map((departmentId) => ({
              id: crypto.randomUUID(),
              organizationId: invitationRecord.organizationId,
              departmentId,
              memberId: newMember.id,
              isSubLead: false,
              isAdvisor: false,
              isTreasurer: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            }))
          )
          .onConflictDoNothing();
        await recordCurrentTeamSnapshot(invitationRecord.organizationId);
      }
    }
  } catch (error) {
    console.error("Failed to accept invitation", error);
    inviteStatus = "error";
  }

  // Dashboard redirects further before any query string would be seen, so use a
  // short-lived cookie the client can read to show a toast regardless of where it lands.
  const response = NextResponse.redirect(dashboardUrl);
  response.cookies.set("invite_status", inviteStatus, {
    maxAge: 30,
    path: "/",
  });

  return response;
}
