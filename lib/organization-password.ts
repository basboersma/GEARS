import { scryptSync, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db/drizzle";
import { passwords } from "@/db/schema";

export function hashUserPassword(password: string, salt: Buffer) {
  return scryptSync(password, salt, 64).toString("hex");
}

export function matchesUserPassword(
  password: string,
  hash: string,
  salt: string
) {
  const expected = Buffer.from(hash, "hex");
  const actual = Buffer.from(
    hashUserPassword(password, Buffer.from(salt, "hex")),
    "hex"
  );
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function verifyUserPassword(userId: string, password: string) {
  const passwordRow = await db.query.passwords.findFirst({
    where: eq(passwords.userId, userId),
  });

  return Boolean(
    passwordRow &&
      matchesUserPassword(password, passwordRow.hash, passwordRow.salt)
  );
}
