"use server";

import { eq, inArray } from "drizzle-orm";
import { db } from "@/db/drizzle";
import { member, organization } from "@/db/schema";
import { getCurrentUser } from "./users";

const TREASURER_ORG_SLUG = "treasurer";
const TREASURER_ORG_NAME = "Treasurer";

async function ensureTreasurerOrganization() {
  const existingTreasurerOrg = await db.query.organization.findFirst({
    where: eq(organization.slug, TREASURER_ORG_SLUG),
  });

  if (existingTreasurerOrg) {
    return existingTreasurerOrg;
  }

  const createdAt = new Date();
  const [createdTreasurerOrg] = await db
    .insert(organization)
    .values({
      id: crypto.randomUUID(),
      name: TREASURER_ORG_NAME,
      slug: TREASURER_ORG_SLUG,
      createdAt,
    })
    .returning();

  return createdTreasurerOrg;
}

export async function getOrganizations() {
  const { currentUser } = await getCurrentUser();

  await ensureTreasurerOrganization();

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
    if (slug === TREASURER_ORG_SLUG) {
      await ensureTreasurerOrganization();
    }

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
