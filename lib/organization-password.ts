import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db/drizzle";
import { member } from "@/db/schema";

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

  return membership?.password === password;
}
