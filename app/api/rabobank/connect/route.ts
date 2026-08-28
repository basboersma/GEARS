import { NextResponse } from "next/server";
import {
  buildRabobankAuthorizationUrl,
  type RabobankProduct,
} from "@/lib/rabobank";
import { getCurrentUser } from "@/server/users";

export async function GET(request: Request) {
  const { user } = await getCurrentUser();
  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get("organizationId");
  const product = searchParams.get("product") as RabobankProduct | null;

  if (!(organizationId && product)) {
    return NextResponse.json(
      { error: "organizationId and product are required" },
      { status: 400 }
    );
  }

  const authorizationUrl = buildRabobankAuthorizationUrl({
    organizationId,
    product,
    userId: user.id,
    nonce: crypto.randomUUID(),
  });

  return NextResponse.redirect(authorizationUrl);
}
