import { and, eq, isNull, or } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/drizzle";
import { dashboardNotification, member } from "@/db/schema";
import { auth } from "@/lib/auth";

const notificationSchema = z.object({
  organizationId: z.string().min(1),
  type: z.enum([
    "order",
    "member",
    "event",
    "todo",
    "budget",
    "reimbursement",
    "reimbursement_payment",
  ]),
  title: z.string().min(1),
  body: z.string().min(1),
  link: z.string().optional(),
  requestId: z.string().optional(),
  expiresAt: z.coerce.date().optional(),
});

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = notificationSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid notification" },
      { status: 400 }
    );
  }
  const notification = parsed.data;
  const membership = await db.query.member.findFirst({
    where: and(
      eq(member.organizationId, notification.organizationId),
      eq(member.userId, session.user.id)
    ),
  });
  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const id = crypto.randomUUID();
  await db
    .insert(dashboardNotification)
    .values({ ...notification, id, read: false, createdAt: new Date() });
  return NextResponse.json({ id });
}

export async function PATCH(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const payload = (await request.json()) as { id?: string };
  if (!payload.id) {
    return NextResponse.json(
      { error: "Notification ID is required." },
      { status: 400 }
    );
  }
  const notification = await db.query.dashboardNotification.findFirst({
    where: and(
      eq(dashboardNotification.id, payload.id),
      or(
        isNull(dashboardNotification.userId),
        eq(dashboardNotification.userId, session.user.id)
      )
    ),
  });
  if (!notification) {
    return NextResponse.json(
      { error: "Notification not found." },
      { status: 404 }
    );
  }
  const membership = await db.query.member.findFirst({
    where: and(
      eq(member.organizationId, notification.organizationId),
      eq(member.userId, session.user.id)
    ),
  });
  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await db
    .update(dashboardNotification)
    .set({ read: true })
    .where(eq(dashboardNotification.id, notification.id));
  return NextResponse.json({ success: true });
}
