import { and, eq, inArray } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/drizzle";
import { dashboardTodo, dashboardTodoAssignee, member } from "@/db/schema";
import { auth } from "@/lib/auth";

const todoSchema = z.object({
  id: z.string().optional(),
  organizationId: z.string().min(1),
  text: z.string().trim().min(1),
  description: z.string().default(""),
  done: z.boolean(),
  color: z.string(),
  assignedMembers: z.array(z.string()).default([]),
  linkedFiles: z.array(z.string()).default([]),
  addToCalendar: z.boolean(),
  calendarDate: z.string().default(""),
  dueDate: z.string().nullable().optional(),
  subtasks: z.array(
    z.object({ id: z.string(), text: z.string(), done: z.boolean() })
  ),
});

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = todoSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid todo" }, { status: 400 });
  }
  const todo = parsed.data;
  const membership = await db.query.member.findFirst({
    where: and(
      eq(member.organizationId, todo.organizationId),
      eq(member.userId, session.user.id)
    ),
  });
  if (!(membership?.role === "owner" || membership?.role === "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const validMembers = todo.assignedMembers.length
    ? await db.query.member.findMany({
        where: and(
          eq(member.organizationId, todo.organizationId),
          inArray(member.id, todo.assignedMembers)
        ),
      })
    : [];
  if (validMembers.length !== todo.assignedMembers.length) {
    return NextResponse.json(
      { error: "An assigned member is not in this organization." },
      { status: 400 }
    );
  }

  const id = todo.id ?? crypto.randomUUID();
  await db.transaction(async (transaction) => {
    await transaction
      .insert(dashboardTodo)
      .values({
        id,
        organizationId: todo.organizationId,
        text: todo.text,
        description: todo.description,
        done: todo.done,
        color: todo.color,
        assignedMemberIds: JSON.stringify(todo.assignedMembers),
        linkedFileIds: JSON.stringify(todo.linkedFiles),
        addToCalendar: todo.addToCalendar,
        calendarDate: todo.calendarDate,
        dueDate: todo.dueDate ?? null,
        subtasks: JSON.stringify(todo.subtasks),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: dashboardTodo.id,
        set: {
          text: todo.text,
          description: todo.description,
          done: todo.done,
          color: todo.color,
          assignedMemberIds: JSON.stringify(todo.assignedMembers),
          linkedFileIds: JSON.stringify(todo.linkedFiles),
          addToCalendar: todo.addToCalendar,
          calendarDate: todo.calendarDate,
          dueDate: todo.dueDate ?? null,
          subtasks: JSON.stringify(todo.subtasks),
          updatedAt: new Date(),
        },
      });
    await transaction
      .delete(dashboardTodoAssignee)
      .where(eq(dashboardTodoAssignee.todoId, id));
    if (todo.assignedMembers.length) {
      await transaction
        .insert(dashboardTodoAssignee)
        .values(
          todo.assignedMembers.map((memberId) => ({ todoId: id, memberId }))
        );
    }
  });

  return NextResponse.json({ id });
}
