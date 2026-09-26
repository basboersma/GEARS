import { and, eq, gt, inArray } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/drizzle";
import {
  boardPermissionRequest,
  dashboardNotification,
  member,
  organization,
} from "@/db/schema";
import { auth } from "@/lib/auth";

const requestSchema = z.object({
  organizationId: z.string().min(1),
  action: z.enum(["budget", "gma"]),
  target: z.string().min(1),
});

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = requestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid permission request" },
      { status: 400 }
    );
  }

  const membership = await db.query.member.findFirst({
    where: and(
      eq(member.organizationId, parsed.data.organizationId),
      eq(member.userId, session.user.id),
      inArray(member.role, ["owner", "admin"])
    ),
  });
  const organizationRow = await db.query.organization.findFirst({
    where: eq(organization.id, parsed.data.organizationId),
  });
  if (!(membership && organizationRow)) {
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 }
    );
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const existing = await db.query.boardPermissionRequest.findFirst({
    where: and(
      eq(boardPermissionRequest.organizationId, parsed.data.organizationId),
      eq(boardPermissionRequest.requestedByUserId, session.user.id),
      eq(boardPermissionRequest.action, parsed.data.action),
      eq(boardPermissionRequest.status, "pending"),
      gt(boardPermissionRequest.expiresAt, now)
    ),
  });
  if (existing) {
    return NextResponse.json({ requestId: existing.id });
  }

  const id = crypto.randomUUID();
  const link =
    parsed.data.action === "gma"
      ? `/dashboard/organization/${organizationRow.slug}/gma?permissionRequestId=${id}`
      : `/dashboard/treasurer?organizationId=${parsed.data.organizationId}&permissionRequestId=${id}`;
  await db.insert(boardPermissionRequest).values({
    id,
    organizationId: parsed.data.organizationId,
    requestedByUserId: session.user.id,
    action: parsed.data.action,
    target: parsed.data.target,
    status: "pending",
    expiresAt,
    createdAt: now,
    updatedAt: now,
  });
  await db.insert(dashboardNotification).values({
    id: crypto.randomUUID(),
    organizationId: parsed.data.organizationId,
    type: "budget",
    title: "Board permission requested",
    body: `${session.user.name} requested board permission to ${parsed.data.action === "gma" ? "open a GMA" : "change the budget"}.`,
    link,
    requestId: id,
    expiresAt,
    read: false,
    createdAt: now,
  });
  return NextResponse.json({ requestId: id, expiresAt });
}
