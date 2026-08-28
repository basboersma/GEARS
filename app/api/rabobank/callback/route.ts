import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { member, organization, rabobankConnection } from "@/db/schema";
import {
  decodeRabobankStateToken,
  exchangeRabobankAuthorizationCode,
  type RabobankProduct,
} from "@/lib/rabobank";

function normalizeProduct(product: RabobankProduct) {
  return product === "payment_initiation"
    ? "payment_initiation"
    : "account_information";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(
        `/dashboard?rabobankError=${encodeURIComponent(error)}`,
        request.url
      )
    );
  }

  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  if (!state) {
    return NextResponse.json(
      { error: "Missing code or state" },
      { status: 400 }
    );
  }

  const decoded = decodeRabobankStateToken(state);

  const org = await db.query.organization.findFirst({
    where: eq(organization.id, decoded.organizationId),
  });

  if (!org) {
    return NextResponse.json(
      { error: "Organization not found" },
      { status: 404 }
    );
  }

  const membership = await db.query.member.findFirst({
    where: and(
      eq(member.userId, decoded.userId),
      eq(member.organizationId, decoded.organizationId)
    ),
  });

  if (!membership) {
    return NextResponse.json(
      { error: "Organization membership required" },
      { status: 403 }
    );
  }

  const token = await exchangeRabobankAuthorizationCode(code);

  await db.insert(rabobankConnection).values({
    id: crypto.randomUUID(),
    organizationId: decoded.organizationId,
    createdByUserId: decoded.userId,
    product: normalizeProduct(decoded.product),
    scope:
      decoded.product === "payment_initiation"
        ? "bspi.single.read-write"
        : "bai.accountinformation.read",
    accessToken: token.access_token,
    refreshToken: token.refresh_token ?? null,
    accessTokenExpiresAt: new Date(Date.now() + token.expires_in * 1000),
    refreshTokenExpiresAt: token.refresh_token_expires_in
      ? new Date(Date.now() + token.refresh_token_expires_in * 1000)
      : null,
    status: "active",
  });

  return NextResponse.redirect(
    new URL(`/dashboard/organization/${org.slug}`, request.url)
  );
}
