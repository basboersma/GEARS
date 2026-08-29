"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/drizzle";
import { organization } from "@/db/schema";

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

  await db
    .update(organization)
    .set({
      budget: normalized.toFixed(2),
    })
    .where(eq(organization.id, organizationId));

  revalidatePath("/dashboard/admin");
  return { success: true };
}
