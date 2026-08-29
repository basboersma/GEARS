"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/drizzle";
import { organization } from "@/db/schema";

export function saveTotalBudget() {
  return {
    success: false,
    error:
      "The total budget is calculated automatically from the organization budgets.",
  };
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
