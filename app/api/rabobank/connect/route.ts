import { NextResponse } from "next/server";
import { buildRabobankAuthorizationUrl } from "@/lib/rabobank";
import { getCurrentUser } from "@/server/users";

export async function GET(request: Request) {
  const { user } = await getCurrentUser();
  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get("organizationId");

  if (!organizationId) {
    return NextResponse.json(
      { error: "organizationId is required" },
      { status: 400 }
    );
  }

  const authorizationUrl = buildRabobankAuthorizationUrl({
    organizationId,
    userId: user.id,
    nonce: crypto.randomUUID(),
  });

  return NextResponse.redirect(authorizationUrl);
}
