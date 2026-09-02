import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { invitation as invitationTable } from "@/db/schema";
import { auth } from "@/lib/auth";

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

  const dashboardUrl = new URL("/dashboard", request.url);

  try {
    await auth.api.acceptInvitation({
      body: {
        invitationId,
      },
      headers: await headers(),
    });

    dashboardUrl.searchParams.set("invite", "accepted");
  } catch (error) {
    console.error("Failed to accept invitation", error);
    dashboardUrl.searchParams.set("invite", "error");
  }

  return NextResponse.redirect(dashboardUrl);
}
