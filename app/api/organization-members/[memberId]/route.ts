import { and, eq, inArray } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/drizzle";
import { member } from "@/db/schema";
import { auth } from "@/lib/auth";
import { verifyUserPassword } from "@/lib/organization-password";
import { removeOrganizationMembership } from "@/server/membership-history";

const payloadSchema = z.object({
  organizationId: z.string().min(1),
  password: z.string().min(1),
});

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = payloadSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Organization and password are required" },
      { status: 400 }
    );
  }

  const manager = await db.query.member.findFirst({
    where: and(
      eq(member.organizationId, parsed.data.organizationId),
      eq(member.userId, session.user.id),
      inArray(member.role, ["owner", "admin"])
    ),
  });
  if (!manager) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { memberId } = await params;
  const target = await db.query.member.findFirst({
    where: and(
      eq(member.id, memberId),
      eq(member.organizationId, parsed.data.organizationId)
    ),
  });
  if (!target) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }
  if (target.userId === session.user.id || target.role === "owner") {
    return NextResponse.json(
      { error: "The organization owner cannot be removed" },
      { status: 400 }
    );
  }

  const passwordMatches = await verifyUserPassword(
    session.user.id,
    parsed.data.password
  );
  if (!passwordMatches) {
    return NextResponse.json({ error: "Invalid password" }, { status: 403 });
  }

  const result = await removeOrganizationMembership(
    parsed.data.organizationId,
    memberId
  );
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
