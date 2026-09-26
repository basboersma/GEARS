import { and, eq, inArray, isNotNull } from "drizzle-orm";
import { db } from "@/db/drizzle";
import { member } from "@/db/schema";

export async function getMemberPasswords(userId: string) {
  const rows = await db
    .select({ password: member.password })
    .from(member)
    .where(and(eq(member.userId, userId), isNotNull(member.password)));

  return rows.flatMap((row) => (row.password ? [row.password] : []));
}

export async function verifyMemberPassword(
  organizationId: string,
  userId: string,
  password: string
) {
  const membership = await db.query.member.findFirst({
    where: and(
      eq(member.organizationId, organizationId),
      eq(member.userId, userId),
      inArray(member.role, ["owner", "admin"])
    ),
  });

  if (!membership) {
    return false;
  }

  return (await getMemberPasswords(userId)).includes(password);
}
