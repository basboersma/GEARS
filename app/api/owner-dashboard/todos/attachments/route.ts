import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { dashboardTodo, member, organization } from "@/db/schema";
import { auth } from "@/lib/auth";
import { uploadTodoAttachments } from "@/lib/google-drive";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const todoId = formData.get("todoId");
  const files = formData
    .getAll("files")
    .filter((value): value is File => value instanceof File);
  if (typeof todoId !== "string" || files.length === 0) {
    return NextResponse.json(
      { error: "todoId and at least one file are required." },
      { status: 400 }
    );
  }

  const todo = await db.query.dashboardTodo.findFirst({
    where: eq(dashboardTodo.id, todoId),
  });
  if (!todo) {
    return NextResponse.json({ error: "Todo not found." }, { status: 404 });
  }
  const membership = await db.query.member.findFirst({
    where: and(
      eq(member.organizationId, todo.organizationId),
      eq(member.userId, session.user.id)
    ),
  });
  if (!(membership?.role === "owner" || membership?.role === "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const organizationRow = await db.query.organization.findFirst({
    where: eq(organization.id, todo.organizationId),
  });
  if (!organizationRow?.driveFolderId) {
    return NextResponse.json(
      { error: "This organization has no configured Google Drive folder." },
      { status: 400 }
    );
  }

  const result = await uploadTodoAttachments({
    organizationFolderId: organizationRow.driveFolderId,
    todoTitle: todo.text,
    createdAt: todo.createdAt,
    files,
  });
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  const existingFileIds = (JSON.parse(todo.linkedFileIds) as string[]).filter(
    (fileId) => !fileId.startsWith("local:")
  );
  const linkedFileIds = [
    ...existingFileIds,
    ...result.files.map((file) => file.id),
  ];
  await db
    .update(dashboardTodo)
    .set({
      linkedFileIds: JSON.stringify(linkedFileIds),
      updatedAt: new Date(),
    })
    .where(eq(dashboardTodo.id, todo.id));
  return NextResponse.json({ files: result.files });
}
