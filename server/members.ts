"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/db/drizzle";
import { member, type Role } from "@/db/schema";
import { auth } from "@/lib/auth";
import { getCurrentUser } from "./users";

export const addMember = async (
  organizationId: string,
  userId: string,
  role: Role
) => {
  try {
    await auth.api.addMember({
      body: {
        userId,
        organizationId,
        role,
      },
    });
  } catch (error) {
    console.error(error);
    throw new Error("Failed to add member.");
  }
};

export const removeMember = async (memberId: string) => {
  const { currentUser } = await getCurrentUser();

  const targetMember = await db.query.member.findFirst({
    where: eq(member.id, memberId),
  });

  if (!targetMember) {
    return {
      success: false,
      error: "Member not found.",
    };
  }

  const currentMembership = await db.query.member.findFirst({
    where: and(
      eq(member.userId, currentUser.id),
      eq(member.organizationId, targetMember.organizationId)
    ),
  });

  if (!currentMembership || currentMembership.role !== "admin") {
    return {
      success: false,
      error: "You are not authorized to remove members.",
    };
  }

  try {
    await db.delete(member).where(eq(member.id, memberId));

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: "Failed to remove member.",
    };
  }
};

export const setMemberRole = async (memberId: string, role: Role) => {
  const { currentUser } = await getCurrentUser();
  const targetMember = await db.query.member.findFirst({
    where: eq(member.id, memberId),
  });

  if (!targetMember) {
    return { success: false, error: "Member not found." };
  }

  const currentMembership = await db.query.member.findFirst({
    where: and(
      eq(member.userId, currentUser.id),
      eq(member.organizationId, targetMember.organizationId)
    ),
  });

  if (currentMembership?.role !== "owner") {
    return { success: false, error: "Only owners can change member roles." };
  }

  if (!(role === "member" || role === "sub_owner")) {
    return { success: false, error: "This role cannot be assigned here." };
  }

  await db.update(member).set({ role }).where(eq(member.id, memberId));
  return { success: true, error: null };
};
