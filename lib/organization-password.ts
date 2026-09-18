import { scryptSync, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db/drizzle";
import { passwords } from "@/db/schema";

export function hashOrganizationPassword(password: string, salt: Buffer) {
  return scryptSync(password, salt, 64).toString("hex");
}

export function matchesOrganizationPassword(
  password: string,
  hash: string,
  salt: string
) {
  const expected = Buffer.from(hash, "hex");
  const actual = Buffer.from(
    hashOrganizationPassword(password, Buffer.from(salt, "hex")),
    "hex"
  );
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function verifyOrganizationPassword(
  organizationId: string,
  password: string
) {
  const passwordRow = await db.query.passwords.findFirst({
    where: eq(passwords.organizationId, organizationId),
  });

  return [
    [passwordRow?.ownerHash, passwordRow?.ownerSalt],
    [passwordRow?.adminHash, passwordRow?.adminSalt],
  ].some(
    ([hash, salt]) =>
      Boolean(hash && salt) &&
      matchesOrganizationPassword(password, hash as string, salt as string)
  );
}
