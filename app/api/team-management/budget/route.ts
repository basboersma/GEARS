import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/drizzle";
import { boardDecision, member, organization } from "@/db/schema";
import { auth } from "@/lib/auth";
import { boardLock } from "@/lib/board-lock";

const payloadSchema = z.object({
  organizationId: z.string().min(1),
  budget: z.number().finite().min(0),
});

export async function PATCH(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = payloadSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter a valid non-negative budget." },
      { status: 400 }
    );
  }

  const adminMembership = await db.query.member.findFirst({
    where: and(
      eq(member.userId, session.user.id),
      eq(member.organizationId, parsed.data.organizationId),
      eq(member.role, "admin")
    ),
  });
  if (!adminMembership) {
    return NextResponse.json(
      { error: "Admin access required." },
      { status: 403 }
    );
  }

  const lock = await boardLock(parsed.data.organizationId);
  if (!lock.unlocked) {
    return NextResponse.json(
      {
        error: `Get approval from ${lock.requirements.requiredPasswords} board members first.`,
        boardLock: lock.requirements,
      },
      { status: 403 }
    );
  }

  await db
    .update(organization)
    .set({ budget: parsed.data.budget.toFixed(2) })
    .where(eq(organization.id, parsed.data.organizationId));

  await db
    .update(boardDecision)
    .set({ approval: false, updatedAt: new Date() })
    .where(eq(boardDecision.organizationId, parsed.data.organizationId));

  return NextResponse.json({ success: true });
}
