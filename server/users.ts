"use server";

import { and, eq, inArray, not } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db/drizzle";
import { invitation, member, user } from "@/db/schema";
import { auth } from "@/lib/auth";

export const getCurrentUser = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const currentUser = await db.query.user.findFirst({
    where: eq(user.id, session.user.id),
  });

  if (!currentUser) {
    redirect("/login");
  }

  const memberships = await db.query.member.findMany({
    where: eq(member.userId, currentUser.id),
  });
  if (memberships.length === 0) {
    const acceptedInvitations = await db.query.invitation.findMany({
      where: and(
        eq(invitation.email, currentUser.email.toLowerCase()),
        eq(invitation.status, "accepted")
      ),
    });
    for (const acceptedInvitation of acceptedInvitations) {
      const restoredRole =
        acceptedInvitation.role === "owner" ||
        acceptedInvitation.role === "admin" ||
        acceptedInvitation.role === "sub_owner"
          ? acceptedInvitation.role
          : "member";
      await db
        .insert(member)
        .values({
          id: crypto.randomUUID(),
          organizationId: acceptedInvitation.organizationId,
          userId: currentUser.id,
          role: restoredRole,
          createdAt: new Date(),
        })
        .onConflictDoNothing();
    }
  }

  return {
    ...session,
    currentUser,
  };
};

export const signIn = async (email: string, password: string) => {
  try {
    await auth.api.signInEmail({
      body: {
        email,
        password,
      },
    });

    return {
      success: true,
      message: "Signed in successfully.",
    };
  } catch (error) {
    const e = error as Error;

    return {
      success: false,
      message: e.message || "An unknown error occurred.",
    };
  }
};

export const signUp = async (
  email: string,
  password: string,
  username: string
) => {
  try {
    await auth.api.signUpEmail({
      body: {
        email,
        password,
        name: username,
      },
    });

    return {
      success: true,
      message: "Signed up successfully.",
    };
  } catch (error) {
    const e = error as Error;

    return {
      success: false,
      message: e.message || "An unknown error occurred.",
    };
  }
};

export const getUsers = async (organizationId: string) => {
  try {
    const members = await db.query.member.findMany({
      where: eq(member.organizationId, organizationId),
    });

    const memberUserIds = members.map((m) => m.userId);

    // inArray/not(inArray()) with an empty list produces invalid SQL, so skip the filter entirely.
    const users =
      memberUserIds.length > 0
        ? await db.query.user.findMany({
            where: not(inArray(user.id, memberUserIds)),
          })
        : await db.query.user.findMany();

    return users;
  } catch (error) {
    console.error(error);
    return [];
  }
};
