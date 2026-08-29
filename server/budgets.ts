"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/drizzle";
import { budgetSetting, organizationBudget } from "@/db/schema";

export async function saveTotalBudget(totalBudget: number) {
  const normalized = Number(totalBudget || 0);

  if (normalized < 0) {
    return {
      success: false,
      error: "The total budget cannot be negative.",
    };
  }

  const allBudgets = await db.query.organizationBudget.findMany();
  const totalAllocated = allBudgets.reduce(
    (sum, item) => sum + Number(item.allocatedBudget || 0),
    0
  );

  if (totalAllocated > normalized) {
    return {
      success: false,
      error: "The total allocated budget already exceeds the new total budget.",
    };
  }

  const existing = await db.query.budgetSetting.findFirst();

  if (existing) {
    await db
      .update(budgetSetting)
      .set({
        totalBudget: normalized.toFixed(2),
        updatedAt: new Date(),
      })
      .where(eq(budgetSetting.id, existing.id));
  } else {
    await db.insert(budgetSetting).values({
      id: crypto.randomUUID(),
      totalBudget: normalized.toFixed(2),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

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

  const totalBudgetRow = await db.query.budgetSetting.findFirst();
  const totalBudget = Number(totalBudgetRow?.totalBudget ?? 0);

  const allBudgets = await db.query.organizationBudget.findMany();
  const totalAllocated = allBudgets.reduce(
    (sum, item) =>
      sum +
      (item.organizationId === organizationId
        ? 0
        : Number(item.allocatedBudget || 0)),
    0
  );

  if (totalAllocated + normalized > totalBudget) {
    return {
      success: false,
      error: "The total allocated budget cannot exceed the total budget.",
    };
  }

  const existing = await db.query.organizationBudget.findFirst({
    where: eq(organizationBudget.organizationId, organizationId),
  });

  if (existing) {
    await db
      .update(organizationBudget)
      .set({
        allocatedBudget: normalized.toFixed(2),
        updatedAt: new Date(),
      })
      .where(eq(organizationBudget.id, existing.id));
  } else {
    await db.insert(organizationBudget).values({
      id: crypto.randomUUID(),
      organizationId,
      allocatedBudget: normalized.toFixed(2),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  revalidatePath("/dashboard/admin");
  return { success: true };
}
