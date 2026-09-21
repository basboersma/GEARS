import { and, eq, inArray } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/drizzle";
import { member, organizationDepartment, team } from "@/db/schema";
import { auth } from "@/lib/auth";
import { verifyMemberPassword } from "@/lib/organization-password";
import { recordCurrentTeamSnapshot } from "@/server/membership-history";

const assignmentSchema = z.object({
  departmentId: z.string().min(1),
  memberId: z.string().min(1),
  isSubLead: z.boolean().default(false),
  isAdvisor: z.boolean().default(false),
  isTreasurer: z.boolean().default(false),
});

const payloadSchema = z.object({
  organizationId: z.string().min(1),
  password: z.string().min(1),
  assignments: z.array(assignmentSchema),
});

export async function PATCH(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = payloadSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid team assignments" },
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
    return NextResponse.json(
      { error: "Only owners and admins can update teams" },
      { status: 403 }
    );
  }

  const passwordMatches = await verifyMemberPassword(
    parsed.data.organizationId,
    session.user.id,
    parsed.data.password
  );
  if (!passwordMatches) {
    return NextResponse.json({ error: "Invalid password" }, { status: 403 });
  }

  const departments = await db.query.organizationDepartment.findMany({
    where: eq(
      organizationDepartment.organizationId,
      parsed.data.organizationId
    ),
  });
  const departmentIds = new Set(departments.map((department) => department.id));
  const memberRows = await db.query.member.findMany({
    where: eq(member.organizationId, parsed.data.organizationId),
  });
  const memberIds = new Set(memberRows.map((entry) => entry.id));

  if (
    parsed.data.assignments.some(
      (assignment) =>
        !(
          departmentIds.has(assignment.departmentId) &&
          memberIds.has(assignment.memberId)
        )
    )
  ) {
    return NextResponse.json(
      { error: "Team assignment is outside the organization" },
      { status: 400 }
    );
  }

  const uniqueAssignments = Array.from(
    new Map(
      parsed.data.assignments.map((assignment) => [
        `${assignment.departmentId}:${assignment.memberId}`,
        assignment,
      ])
    ).values()
  );

  // neon-http driver does not support db.transaction(); run sequentially instead.
  await db
    .delete(team)
    .where(eq(team.organizationId, parsed.data.organizationId));
  if (uniqueAssignments.length > 0) {
    await db.insert(team).values(
      uniqueAssignments.map((assignment) => ({
        id: crypto.randomUUID(),
        organizationId: parsed.data.organizationId,
        ...assignment,
        createdAt: new Date(),
        updatedAt: new Date(),
      }))
    );
  }
  await recordCurrentTeamSnapshot(parsed.data.organizationId);

  return NextResponse.json({ success: true });
}
