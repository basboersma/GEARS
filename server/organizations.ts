"use server";

import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db/drizzle";
import { member, organization } from "@/db/schema";
import { getCurrentUser } from "./users";

export async function getOrganizations() {
  const { currentUser } = await getCurrentUser();

  const members = await db.query.member.findMany({
    where: eq(member.userId, currentUser.id),
  });

  const organizations = await db.query.organization.findMany({
    where: inArray(
      organization.id,
      members.map((m) => m.organizationId)
    ),
  });

  return organizations;
}

export async function getActiveOrganization(userId: string) {
  const memberUser = await db.query.member.findFirst({
    where: eq(member.userId, userId),
  });

  if (!memberUser) {
    return null;
  }

  const activeOrganization = await db.query.organization.findFirst({
    where: eq(organization.id, memberUser.organizationId),
  });

  return activeOrganization;
}

export async function getOrganizationBySlug(slug: string) {
  try {
    const organizationBySlug = await db.query.organization.findFirst({
      where: eq(organization.slug, slug),
      with: {
        members: {
          with: {
            user: true,
          },
        },
      },
    });

    return organizationBySlug;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function deleteOrganization(organizationId: string) {
  const { currentUser } = await getCurrentUser();

  const membership = await db.query.member.findFirst({
    where: and(
      eq(member.userId, currentUser.id),
      eq(member.organizationId, organizationId)
    ),
  });

  if (!membership || membership.role !== "admin") {
    return {
      success: false,
      error: "You are not authorized to remove this organization.",
    };
  }

  try {
    await db.delete(organization).where(eq(organization.id, organizationId));

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: "Failed to remove organization.",
    };
  }
}
