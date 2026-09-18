import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/drizzle";
import { member, passwords } from "@/db/schema";
import { auth } from "@/lib/auth";

const payloadSchema = z.object({
  organizationId: z.string().min(1),
  previousPassword: z.string(),
  newPassword: z.string().min(8),
});

function hashPassword(password: string, salt: Buffer) {
  return scryptSync(password, salt, 64).toString("hex");
}

function matchesPassword(password: string, hash: string, salt: string) {
  const expected = Buffer.from(hash, "hex");
  const actual = Buffer.from(
    hashPassword(password, Buffer.from(salt, "hex")),
    "hex"
  );
  return expected.length === actual.length && timingSafeEqual(expected, actual);
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
    !matchesPassword(parsed.data.previousPassword, currentHash, currentSalt)
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
          ownerHash: hashPassword(parsed.data.newPassword, salt),
          ownerSalt: salt.toString("hex"),
        }
      : {
          adminHash: hashPassword(parsed.data.newPassword, salt),
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

  const passwordRow = await db.query.passwords.findFirst({
    where: eq(passwords.organizationId, parsed.data.organizationId),
  });
  const passwordMatches = [
    [passwordRow?.ownerHash, passwordRow?.ownerSalt],
    [passwordRow?.adminHash, passwordRow?.adminSalt],
  ].some(([hash, salt]) => {
    if (!(hash && salt)) {
      return false;
    }
    const actual = scryptSync(
      parsed.data.password,
      Buffer.from(salt, "hex"),
      64
    );
    const expected = Buffer.from(hash, "hex");
    return (
      expected.length === actual.length && timingSafeEqual(expected, actual)
    );
  });

  return NextResponse.json({ valid: passwordMatches });
}
