import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/drizzle";
import { dashboardRoadmapItem, dashboardTodo, member } from "@/db/schema";
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
  todoSubtasks: z
    .array(z.object({ id: z.string(), text: z.string(), done: z.boolean() }))
    .nullable()
    .optional(),
});

function parseStringArray(value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) &&
      parsed.every((entry) => typeof entry === "string")
      ? parsed
      : [];
  } catch {
    return [];
  }
}

function parseSubtasks(value: string) {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter(
          (entry): entry is { id: string; text: string; done: boolean } =>
            typeof entry === "object" &&
            entry !== null &&
            typeof entry.id === "string" &&
            typeof entry.text === "string" &&
            typeof entry.done === "boolean"
        )
      : [];
  } catch {
    return [];
  }
}

function serializeTodo(row: typeof dashboardTodo.$inferSelect) {
  return {
    id: row.id,
    text: row.text,
    description: row.description,
    done: row.done,
    color: row.color,
    assignedMembers: parseStringArray(row.assignedMemberIds),
    linkedFiles: parseStringArray(row.linkedFileIds),
    addToCalendar: row.addToCalendar,
    calendarDate: row.calendarDate,
    dueDate: row.dueDate ?? undefined,
    subtasks: parseSubtasks(row.subtasks),
  };
}

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
  if (
    !(
      membership?.role === "owner" ||
      membership?.role === "admin" ||
      membership?.role === "advisor"
    )
  ) {
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

  let todo: ReturnType<typeof serializeTodo> | null | undefined;
  if (item.todoSubtasks !== undefined) {
    const todoId = `roadmap:${id}`;
    if (item.todoSubtasks === null) {
      await db
        .delete(dashboardTodo)
        .where(
          and(
            eq(dashboardTodo.id, todoId),
            eq(dashboardTodo.organizationId, item.organizationId)
          )
        );
      todo = null;
    } else {
      await db
        .insert(dashboardTodo)
        .values({
          id: todoId,
          organizationId: item.organizationId,
          text: item.title,
          color: item.color,
          subtasks: JSON.stringify(item.todoSubtasks),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: dashboardTodo.id,
          set: {
            text: item.title,
            color: item.color,
            subtasks: JSON.stringify(item.todoSubtasks),
            updatedAt: new Date(),
          },
        });
      const todoRow = await db.query.dashboardTodo.findFirst({
        where: and(
          eq(dashboardTodo.id, todoId),
          eq(dashboardTodo.organizationId, item.organizationId)
        ),
      });
      todo = todoRow ? serializeTodo(todoRow) : null;
    }
  }

  return NextResponse.json({ id, ...(todo !== undefined ? { todo } : {}) });
}
