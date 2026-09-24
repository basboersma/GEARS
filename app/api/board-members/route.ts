import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/drizzle";
import { board, member } from "@/db/schema";
import { auth } from "@/lib/auth";

const positions = [
  "Chair",
  "Secretary",
  "Extern",
  "Treasurer",
  "PR",
  "Intern",
] as const;
const payloadSchema = z.object({
  organizationId: z.string().min(1),
  memberId: z.string().min(1),
  position: z.enum(positions),
});

async function getManager(organizationId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return null;
  }
  return db.query.member.findFirst({
    where: and(
      eq(member.organizationId, organizationId),
      eq(member.userId, session.user.id)
    ),
  });
}

export async function POST(request: Request) {
  const parsed = payloadSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid board assignment." },
      { status: 400 }
    );
  }
  const manager = await getManager(parsed.data.organizationId);
  if (!(manager?.role === "admin" || manager?.role === "owner")) {
    return NextResponse.json(
      { error: "Admin or owner access is required." },
      { status: 403 }
    );
  }
  const target = await db.query.member.findFirst({
    where: and(
      eq(member.id, parsed.data.memberId),
      eq(member.organizationId, parsed.data.organizationId)
    ),
  });
  if (!target) {
    return NextResponse.json({ error: "Member not found." }, { status: 404 });
  }

  const id = crypto.randomUUID();
  await db.transaction(async (tx) => {
    await tx
      .delete(board)
      .where(
        and(
          eq(board.organizationId, parsed.data.organizationId),
          eq(board.position, parsed.data.position)
        )
      );
    await tx
      .delete(board)
      .where(
        and(
          eq(board.organizationId, parsed.data.organizationId),
          eq(board.memberId, parsed.data.memberId)
        )
      );
    await tx.insert(board).values({
      id,
      organizationId: parsed.data.organizationId,
      memberId: parsed.data.memberId,
      position: parsed.data.position,
    });
  });
  return NextResponse.json({
    boardMember: {
      id,
      memberId: parsed.data.memberId,
      position: parsed.data.position,
    },
  });
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const organizationId = url.searchParams.get("organizationId");
  const position = url.searchParams.get("position");
  const parsed = z
    .object({ organizationId: z.string().min(1), position: z.enum(positions) })
    .safeParse({ organizationId, position });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid board position." },
      { status: 400 }
    );
  }
  const manager = await getManager(parsed.data.organizationId);
  if (!(manager?.role === "admin" || manager?.role === "owner")) {
    return NextResponse.json(
      { error: "Admin or owner access is required." },
      { status: 403 }
    );
  }
  await db
    .delete(board)
    .where(
      and(
        eq(board.organizationId, parsed.data.organizationId),
        eq(board.position, parsed.data.position)
      )
    );
  return NextResponse.json({ success: true });
}
