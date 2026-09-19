import { eq } from "drizzle-orm";
import { db } from "@/db/drizzle";
import { passwords } from "@/db/schema";

export async function verifyUserPassword(userId: string, password: string) {
  const passwordRow = await db.query.passwords.findFirst({
    where: eq(passwords.userId, userId),
  });

  return passwordRow?.password === password;
}
