import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/drizzle";
import { dashboardRoadmapItem, member } from "@/db/schema";
import { auth } from "@/lib/auth";

const roadmapSchema = z.object({
  id: z.string().optional(),
  organizationId: z.string().min(1),
  title: z.string().trim().min(1),
  department: z.string().trim().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  color: z.string().min(1),
  progress: z.number().int().min(0).max(100),
});

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = roadmapSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid roadmap item" },
      { status: 400 }
    );
  }

  const item = parsed.data;
  const membership = await db.query.member.findFirst({
    where: and(
      eq(member.organizationId, item.organizationId),
      eq(member.userId, session.user.id)
    ),
  });
  if (!(membership?.role === "owner" || membership?.role === "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const id = item.id ?? crypto.randomUUID();
  await db
    .insert(dashboardRoadmapItem)
    .values({ ...item, id, createdAt: new Date(), updatedAt: new Date() })
    .onConflictDoUpdate({
      target: dashboardRoadmapItem.id,
      set: {
        title: item.title,
        department: item.department,
        startDate: item.startDate,
        endDate: item.endDate,
        color: item.color,
        progress: item.progress,
        updatedAt: new Date(),
      },
    });

  return NextResponse.json({ id });
}
