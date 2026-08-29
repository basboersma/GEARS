import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/drizzle";
import { member, organization, organizationDepartment } from "@/db/schema";
import { auth } from "@/lib/auth";

const departmentSchema = z.object({
  name: z.string().trim().min(1, "Department name is required").max(80),
});

async function getOrganizationForUser(slug: string, userId: string) {
  const org = await db.query.organization.findFirst({
    where: eq(organization.slug, slug),
  });

  if (!org) {
    return null;
  }

  const membership = await db.query.member.findFirst({
    where: and(eq(member.organizationId, org.id), eq(member.userId, userId)),
  });

  if (!membership || membership.role !== "owner") {
    return null;
  }

  return org;
}

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const slug = url.searchParams.get("slug");

  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  const org = await getOrganizationForUser(slug, session.user.id);

  if (!org) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const departments = await db.query.organizationDepartment.findMany({
    where: eq(organizationDepartment.organizationId, org.id),
    orderBy: (organizationDepartment, { asc }) => [
      asc(organizationDepartment.name),
    ],
  });

  return NextResponse.json({ departments });
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const slug = url.searchParams.get("slug");

  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  const org = await getOrganizationForUser(slug, session.user.id);

  if (!org) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const payload = await request.json();
  const parsed = departmentSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid department payload" },
      { status: 400 }
    );
  }

  const existing = await db.query.organizationDepartment.findFirst({
    where: and(
      eq(organizationDepartment.organizationId, org.id),
      eq(organizationDepartment.name, parsed.data.name)
    ),
  });

  if (existing) {
    return NextResponse.json(
      { error: "This department already exists." },
      { status: 409 }
    );
  }

  const department = {
    id: crypto.randomUUID(),
    organizationId: org.id,
    name: parsed.data.name,
    createdAt: new Date(),
  };

  await db.insert(organizationDepartment).values(department);

  return NextResponse.json({ success: true, department });
}

export async function DELETE(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const slug = url.searchParams.get("slug");

  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  const org = await getOrganizationForUser(slug, session.user.id);

  if (!org) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const payload = await request.json().catch(() => null);
  const departmentId = payload?.departmentId;

  if (!departmentId || typeof departmentId !== "string") {
    return NextResponse.json(
      { error: "Missing departmentId" },
      { status: 400 }
    );
  }

  const department = await db.query.organizationDepartment.findFirst({
    where: and(
      eq(organizationDepartment.id, departmentId),
      eq(organizationDepartment.organizationId, org.id)
    ),
  });

  if (!department) {
    return NextResponse.json(
      { error: "Department not found for this organization." },
      { status: 404 }
    );
  }

  await db
    .delete(organizationDepartment)
    .where(eq(organizationDepartment.id, departmentId));

  return NextResponse.json({ success: true });
}
