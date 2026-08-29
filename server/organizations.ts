"use server";

import { createHash, timingSafeEqual } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db/drizzle";
import { member, organization, session } from "@/db/schema";
import { getCurrentUser } from "./users";

function matchesOrganizationRemovalKey(input: string) {
  const expectedKey = process.env.ORG_DELETE_KEY?.trim();

  if (!expectedKey) {
    return false;
  }

  const candidateHash = createHash("sha256").update(input).digest();
  const expectedHash = Buffer.from(expectedKey, "hex");

  if (candidateHash.length !== expectedHash.length) {
    return false;
  }

  return timingSafeEqual(candidateHash, expectedHash);
}

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
  const activeSession = await db.query.session.findFirst({
    where: eq(session.userId, userId),
  });

  if (activeSession?.activeOrganizationId) {
    const activeOrganization = await db.query.organization.findFirst({
      where: eq(organization.id, activeSession.activeOrganizationId),
    });

    if (activeOrganization) {
      return activeOrganization;
    }
  }

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

export async function deleteOrganization(
  organizationId: string,
  confirmationKey?: string
) {
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

  if (!(confirmationKey && matchesOrganizationRemovalKey(confirmationKey))) {
    return {
      success: false,
      error: "Invalid removal key.",
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
