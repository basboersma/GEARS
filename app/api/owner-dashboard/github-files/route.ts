import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { member, organization } from "@/db/schema";
import { auth } from "@/lib/auth";
import { listOrganizationGithubTree } from "@/lib/github";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const organizationId = new URL(request.url).searchParams.get(
    "organizationId"
  );
  if (!organizationId) {
    return NextResponse.json(
      { error: "organizationId is required." },
      { status: 400 }
    );
  }

  const membership = await db.query.member.findFirst({
    where: and(
      eq(member.organizationId, organizationId),
      eq(member.userId, session.user.id)
    ),
  });
  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const organizationRow = await db.query.organization.findFirst({
    where: eq(organization.id, organizationId),
  });
  if (!organizationRow?.slug) {
    return NextResponse.json({ available: false, tree: [] });
  }

  try {
    const tree = await listOrganizationGithubTree(organizationRow.slug);
    return NextResponse.json({ available: tree !== null, tree: tree ?? [] });
  } catch (error) {
    console.error("Failed to load organization GitHub tree", error);
    return NextResponse.json(
      { error: "The GitHub repository could not be loaded." },
      { status: 502 }
    );
  }
}
