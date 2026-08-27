import { and, asc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/drizzle";
import { agendaEvent, member } from "@/db/schema";
import { auth } from "@/lib/auth";

const categoryEnum = [
  "meeting",
  "review",
  "task",
  "deadline",
  "break",
  "personal",
] as const;

const createAgendaEventSchema = z.object({
  organizationId: z.string().min(1),
  start: z.string().trim().min(1),
  end: z.string().trim().min(1),
  title: z.string().trim().min(1),
  category: z.enum(categoryEnum),
  description: z.string().trim().min(1),
  location: z.string().trim().optional().default(""),
  attendees: z.string().trim().optional().default(""),
  isMeeting: z.boolean().default(true),
});

async function getSessionUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return null;
  }

  return session.user;
}

async function canManageAgenda(userId: string, organizationId: string) {
  const membership = await db.query.member.findFirst({
    where: and(
      eq(member.userId, userId),
      eq(member.organizationId, organizationId)
    ),
  });

  if (!membership) {
    return false;
  }

  return membership.role === "owner" || membership.role === "admin";
}

export async function GET(request: Request) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get("organizationId");

  if (!organizationId) {
    return NextResponse.json(
      { error: "organizationId is required" },
      { status: 400 }
    );
  }

  const hasAccess = await canManageAgenda(user.id, organizationId);

  if (!hasAccess) {
    return NextResponse.json(
      { error: "Only owners and admins can view agenda" },
      { status: 403 }
    );
  }

  const events = await db.query.agendaEvent.findMany({
    where: eq(agendaEvent.organizationId, organizationId),
    orderBy: [asc(agendaEvent.start), asc(agendaEvent.createdAt)],
  });

  return NextResponse.json({ events });
}

export async function POST(request: Request) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json();
  const parsed = createAgendaEventSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid agenda event payload",
        details: parsed.error.flatten(),
      },
      { status: 400 }
    );
  }

  const hasAccess = await canManageAgenda(user.id, parsed.data.organizationId);

  if (!hasAccess) {
    return NextResponse.json(
      { error: "Only owners and admins can create agenda events" },
      { status: 403 }
    );
  }

  await db.insert(agendaEvent).values({
    id: crypto.randomUUID(),
    organizationId: parsed.data.organizationId,
    createdByUserId: user.id,
    start: parsed.data.start,
    end: parsed.data.end,
    title: parsed.data.title,
    category: parsed.data.category,
    description: parsed.data.description,
    location: parsed.data.location || null,
    attendees: parsed.data.attendees || null,
    isMeeting: parsed.data.isMeeting,
    minutes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return NextResponse.json({ success: true });
}
