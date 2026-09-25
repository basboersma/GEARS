"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { db } from "@/db/drizzle";
import { boardDecision, organization } from "@/db/schema";
import { auth } from "@/lib/auth";
import { boardLock } from "@/lib/board-lock";

export async function saveTotalBudget(totalBudget: number) {
  const normalized = Number(totalBudget || 0);

  if (normalized < 0) {
    return {
      success: false,
      error: "The total budget cannot be negative.",
    };
  }

  const organizations = await db.query.organization.findMany();
  const currentTotal = organizations.reduce(
    (sum, org) => sum + Number(org.budget || 0),
    0
  );

  if (organizations.length === 0) {
    revalidatePath("/dashboard/admin");
    return { success: true };
  }

  if (currentTotal === 0) {
    await Promise.all(
      organizations.map((org) =>
        db
          .update(organization)
          .set({ budget: "0" })
          .where(eq(organization.id, org.id))
      )
    );

    revalidatePath("/dashboard/admin");
    return { success: true };
  }

  await Promise.all(
    organizations.map((org) => {
      const orgBudget = Number(org.budget || 0);
      const nextBudget = (orgBudget / currentTotal) * normalized;

      return db
        .update(organization)
        .set({
          budget: nextBudget.toFixed(2),
        })
        .where(eq(organization.id, org.id));
    })
  );

  revalidatePath("/dashboard/admin");
  return { success: true };
}

export async function saveOrganizationBudget(
  organizationId: string,
  allocatedBudget: number
) {
  const normalized = Number(allocatedBudget || 0);

  if (normalized < 0) {
    return {
      success: false,
      error: "The organization budget cannot be negative.",
    };
  }

  const session = await auth.api.getSession({ headers: await headers() });
  const adminMembership = session
    ? await db.query.member.findFirst({
        where: (membership, { and, eq }) =>
          and(
            eq(membership.userId, session.user.id),
            eq(membership.organizationId, organizationId),
            eq(membership.role, "admin")
          ),
      })
    : null;
  if (!adminMembership) {
    return { success: false, error: "Admin access required." };
  }

  const lock = await boardLock(organizationId);
  if (!lock.unlocked) {
    return {
      success: false,
      error: `Get approval from ${lock.requirements.requiredPasswords} board members first.`,
    };
  }

  await db
    .update(organization)
    .set({
      budget: normalized.toFixed(2),
    })
    .where(eq(organization.id, organizationId));

  await db
    .update(boardDecision)
    .set({ approval: false, updatedAt: new Date() })
    .where(eq(boardDecision.organizationId, organizationId));

  revalidatePath("/dashboard/admin");
  return { success: true };
}
