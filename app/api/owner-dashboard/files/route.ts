import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { member, organization } from "@/db/schema";
import { auth } from "@/lib/auth";
import {
  isGoogleDriveDescendant,
  uploadGoogleDriveFile,
} from "@/lib/google-drive";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const organizationId = formData.get("organizationId");
  const folderId = formData.get("folderId");
  const file = formData.get("file");

  if (
    typeof organizationId !== "string" ||
    typeof folderId !== "string" ||
    !(file instanceof File)
  ) {
    return NextResponse.json(
      { error: "organizationId, folderId, and file are required." },
      { status: 400 }
    );
  }

  const membership = await db.query.member.findFirst({
    where: and(
      eq(member.organizationId, organizationId),
      eq(member.userId, session.user.id)
    ),
  });
  if (!(membership?.role === "owner" || membership?.role === "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const organizationRow = await db.query.organization.findFirst({
    where: eq(organization.id, organizationId),
  });
  if (!organizationRow?.driveFolderId) {
    return NextResponse.json(
      { error: "This organization has no configured Google Drive folder." },
      { status: 400 }
    );
  }
  const folderAccess = await isGoogleDriveDescendant({
    folderId,
    ancestorFolderId: organizationRow.driveFolderId,
  });
  if (!folderAccess.success) {
    return NextResponse.json({ error: folderAccess.error }, { status: 502 });
  }
  if (!folderAccess.isDescendant) {
    return NextResponse.json(
      {
        error: "The selected Google Drive folder is outside this organization.",
      },
      { status: 403 }
    );
  }

  const result = await uploadGoogleDriveFile({ folderId, file });
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  return NextResponse.json({ file: result.file }, { status: 201 });
}
