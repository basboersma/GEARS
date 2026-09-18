import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import {
  departmentInvitation as departmentInvitationTable,
  member,
  organization,
  team,
} from "@/db/schema";
import { auth } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ invitationId: string }> }
) {
  const { invitationId } = await params;

  const invitationRecord = await db.query.departmentInvitation.findFirst({
    where: eq(departmentInvitationTable.id, invitationId),
  });

  if (!invitationRecord) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const targetMember = await db.query.member.findFirst({
    where: eq(member.id, invitationRecord.memberId),
  });

  // Only the invited member's own account may accept this invitation.
  if (!targetMember || targetMember.userId !== session.user.id) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const org = await db.query.organization.findFirst({
    where: eq(organization.id, invitationRecord.organizationId),
  });
  const membersUrl = new URL(
    org?.slug ? `/dashboard/organization/${org.slug}/members` : "/dashboard",
    request.url
  );

  let inviteStatus: "accepted" | "error" = "accepted";

  if (
    invitationRecord.status !== "pending" ||
    invitationRecord.expiresAt < new Date()
  ) {
    inviteStatus = "error";
  } else {
    try {
      const departmentIds = JSON.parse(
        invitationRecord.departmentIds
      ) as string[];

      await db
        .insert(team)
        .values(
          departmentIds.map((departmentId) => ({
            id: crypto.randomUUID(),
            organizationId: invitationRecord.organizationId,
            departmentId,
            memberId: targetMember.id,
            isSubLead: false,
            isAdvisor: false,
            isTreasurer: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          }))
        )
        .onConflictDoNothing();

      await db
        .update(departmentInvitationTable)
        .set({ status: "accepted" })
        .where(eq(departmentInvitationTable.id, invitationId));
    } catch (error) {
      console.error("Failed to accept department invitation", error);
      inviteStatus = "error";
    }
  }

  const response = NextResponse.redirect(membersUrl);
  response.cookies.set("invite_status", inviteStatus, {
    maxAge: 30,
    path: "/",
  });

  return response;
}
