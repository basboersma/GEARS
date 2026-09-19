import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/drizzle";
import { member, passwords } from "@/db/schema";
import { auth } from "@/lib/auth";
import { verifyUserPassword } from "@/lib/organization-password";

const payloadSchema = z.object({
  organizationId: z.string().min(1),
  previousPassword: z.string().optional(),
  newPassword: z.string().min(8),
});

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  const organizationId = new URL(request.url).searchParams.get(
    "organizationId"
  );
  if (!(session && organizationId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const membership = await db.query.member.findFirst({
    where: and(
      eq(member.organizationId, organizationId),
      eq(member.userId, session.user.id)
    ),
  });
  if (
    !membership ||
    (membership.role !== "owner" && membership.role !== "admin")
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const password = await db.query.passwords.findFirst({
    where: eq(passwords.userId, session.user.id),
  });
  return NextResponse.json({ hasPassword: Boolean(password) });
}

export async function PATCH(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = payloadSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "New password must be at least 8 characters" },
      { status: 400 }
    );
  }
  const membership = await db.query.member.findFirst({
    where: and(
      eq(member.organizationId, parsed.data.organizationId),
      eq(member.userId, session.user.id)
    ),
  });
  if (
    !membership ||
    (membership.role !== "owner" && membership.role !== "admin")
  ) {
    return NextResponse.json(
      { error: "Only owners and admins can change this password" },
      { status: 403 }
    );
  }
  const current = await db.query.passwords.findFirst({
    where: eq(passwords.userId, session.user.id),
  });
  if (current && !parsed.data.previousPassword) {
    return NextResponse.json(
      { error: "Old password is required" },
      { status: 400 }
    );
  }
  if (current && parsed.data.previousPassword !== current.password) {
    return NextResponse.json(
      { error: "Previous password is incorrect" },
      { status: 400 }
    );
  }
  try {
    const now = new Date();
    await db
      .insert(passwords)
      .values({
        id: crypto.randomUUID(),
        userId: session.user.id,
        password: parsed.data.newPassword,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: passwords.userId,
        set: {
          password: parsed.data.newPassword,
          updatedAt: now,
        },
      });
  } catch (error) {
    console.error("Failed to save user password", error);
    return NextResponse.json(
      { error: "Unable to save password" },
      { status: 500 }
    );
  }
  return NextResponse.json({ success: true });
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = z
    .object({
      organizationId: z.string().min(1),
      password: z.string().min(1),
    })
    .safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Password is required" },
      { status: 400 }
    );
  }

  const membership = await db.query.member.findFirst({
    where: and(
      eq(member.organizationId, parsed.data.organizationId),
      eq(member.userId, session.user.id)
    ),
  });
  if (
    !membership ||
    (membership.role !== "owner" && membership.role !== "admin")
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const passwordMatches = await verifyUserPassword(
    session.user.id,
    parsed.data.password
  );

  return NextResponse.json({ valid: passwordMatches });
}
