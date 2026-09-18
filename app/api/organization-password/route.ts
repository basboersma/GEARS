import { randomBytes } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/drizzle";
import { member, passwords } from "@/db/schema";
import { auth } from "@/lib/auth";
import {
  hashOrganizationPassword,
  matchesOrganizationPassword,
  verifyOrganizationPassword,
} from "@/lib/organization-password";

const payloadSchema = z.object({
  organizationId: z.string().min(1),
  previousPassword: z.string(),
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
    where: eq(passwords.organizationId, organizationId),
  });
  return NextResponse.json({
    hasPassword: Boolean(
      membership.role === "owner" ? password?.ownerHash : password?.adminHash
    ),
  });
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
    where: eq(passwords.organizationId, parsed.data.organizationId),
  });
  const currentHash =
    membership.role === "owner" ? current?.ownerHash : current?.adminHash;
  const currentSalt =
    membership.role === "owner" ? current?.ownerSalt : current?.adminSalt;
  if (
    currentHash &&
    currentSalt &&
    !matchesOrganizationPassword(
      parsed.data.previousPassword,
      currentHash,
      currentSalt
    )
  ) {
    return NextResponse.json(
      { error: "Previous password is incorrect" },
      { status: 400 }
    );
  }
  const salt = randomBytes(16);
  const values =
    membership.role === "owner"
      ? {
          ownerHash: hashOrganizationPassword(parsed.data.newPassword, salt),
          ownerSalt: salt.toString("hex"),
        }
      : {
          adminHash: hashOrganizationPassword(parsed.data.newPassword, salt),
          adminSalt: salt.toString("hex"),
        };
  if (current) {
    await db
      .update(passwords)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(passwords.id, current.id));
  } else {
    await db.insert(passwords).values({
      id: crypto.randomUUID(),
      organizationId: parsed.data.organizationId,
      ...values,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
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

  const passwordMatches = await verifyOrganizationPassword(
    parsed.data.organizationId,
    parsed.data.password
  );

  return NextResponse.json({ valid: passwordMatches });
}
