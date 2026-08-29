"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/drizzle";
import { member, organizationDepartment } from "@/db/schema";
import { getCurrentUser } from "@/server/users";

export async function getOrganizationDepartments(
  organizationId: string
): Promise<(typeof organizationDepartment.$inferSelect)[]> {
  const departments = await db.query.organizationDepartment.findMany({
    where: eq(organizationDepartment.organizationId, organizationId),
    orderBy: (organizationDepartment, { asc }) => [
      asc(organizationDepartment.name),
    ],
  });

  return departments;
}

export async function addOrganizationDepartment(
  organizationId: string,
  name: string
) {
  const { currentUser } = await getCurrentUser();
  const trimmedName = name.trim();

  if (!trimmedName) {
    return {
      success: false,
      error: "Department name is required.",
    };
  }

  const ownership = await db.query.member.findFirst({
    where: and(
      eq(member.organizationId, organizationId),
      eq(member.userId, currentUser.id)
    ),
  });

  if (!ownership || ownership.role !== "owner") {
    return {
      success: false,
      error: "Only organization owners can manage departments.",
    };
  }

  const existing = await db.query.organizationDepartment.findFirst({
    where: and(
      eq(organizationDepartment.organizationId, organizationId),
      eq(organizationDepartment.name, trimmedName)
    ),
  });

  if (existing) {
    return {
      success: false,
      error: "This department already exists.",
    };
  }

  await db.insert(organizationDepartment).values({
    id: crypto.randomUUID(),
    organizationId,
    name: trimmedName,
    createdAt: new Date(),
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/organization");

  return {
    success: true,
    error: null,
  };
}

export async function deleteOrganizationDepartment(departmentId: string) {
  const { currentUser } = await getCurrentUser();

  const department = await db.query.organizationDepartment.findFirst({
    where: eq(organizationDepartment.id, departmentId),
    with: {
      organization: {
        with: {
          members: true,
        },
      },
    },
  });

  if (!department) {
    return {
      success: false,
      error: "Department not found.",
    };
  }

  const membership = department.organization.members.find(
    (memberEntry) => memberEntry.userId === currentUser.id
  );

  if (!membership || membership.role !== "owner") {
    return {
      success: false,
      error: "Only organization owners can delete departments.",
    };
  }

  await db
    .delete(organizationDepartment)
    .where(eq(organizationDepartment.id, departmentId));

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/organization");

  return {
    success: true,
    error: null,
  };
}
