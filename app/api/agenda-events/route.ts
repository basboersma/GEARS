import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/drizzle";
import { agendaEvent, member } from "@/db/schema";
import { auth } from "@/lib/auth";

const bodySchema = z.object({
  organizationId: z.string().min(1),
  eventType: z.enum(["meeting", "minutes"]),
  title: z.string().trim().min(1).max(120),
  details: z.string().trim().max(500).optional(),
  eventDate: z.coerce.date(),
});

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid agenda payload",
        details: parsed.error.flatten(),
      },
      { status: 400 }
    );
  }

  const ownerMembership = await db.query.member.findFirst({
    where: and(
      eq(member.organizationId, parsed.data.organizationId),
      eq(member.userId, session.user.id),
      eq(member.role, "owner")
    ),
  });

  if (!ownerMembership) {
    return NextResponse.json(
      { error: "Only organization owners can add agenda items" },
      { status: 403 }
    );
  }

  const newEvent = {
    id: crypto.randomUUID(),
    organizationId: parsed.data.organizationId,
    userId: session.user.id,
    eventType: parsed.data.eventType,
    title: parsed.data.title,
    details: parsed.data.details || null,
    eventDate: parsed.data.eventDate,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await db.insert(agendaEvent).values(newEvent);

  return NextResponse.json({
    success: true,
    event: {
      id: newEvent.id,
      eventType: newEvent.eventType,
      title: newEvent.title,
      details: newEvent.details,
      eventDate: newEvent.eventDate.toISOString(),
    },
  });
}
