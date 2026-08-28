import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { member, rabobankConnection, rabobankPayment } from "@/db/schema";
import { rabobankApiRequest } from "@/lib/rabobank";
import { getCurrentUser } from "@/server/users";

export async function POST(request: Request) {
  const { user } = await getCurrentUser();
  const payload = await request.json();
  const organizationId = String(payload.organizationId ?? "");
  const connectionId = String(payload.connectionId ?? "");
  const creditorName = String(payload.creditorName ?? "");
  const creditorIban = String(payload.creditorIban ?? "");
  const debtorIban = String(payload.debtorIban ?? "");
  const amount = String(payload.amount ?? "");
  const currency = String(payload.currency ?? "EUR");
  const remittanceInformation = String(payload.remittanceInformation ?? "");
  const executionDate = String(payload.executionDate ?? "");

  if (
    !(
      organizationId &&
      connectionId &&
      creditorName &&
      creditorIban &&
      debtorIban &&
      amount
    )
  ) {
    return NextResponse.json(
      {
        error:
          "organizationId, connectionId, creditorName, creditorIban, debtorIban, and amount are required",
      },
      { status: 400 }
    );
  }

  const connection = await db.query.rabobankConnection.findFirst({
    where: and(
      eq(rabobankConnection.id, connectionId),
      eq(rabobankConnection.organizationId, organizationId),
      eq(rabobankConnection.product, "payment_initiation")
    ),
  });

  if (!connection) {
    return NextResponse.json(
      { error: "No payment initiation connection found" },
      { status: 404 }
    );
  }

  const membership = await db.query.member.findFirst({
    where: and(
      eq(member.organizationId, organizationId),
      eq(member.userId, user.id)
    ),
  });

  if (!membership) {
    return NextResponse.json(
      { error: "Only organization members can initiate payments" },
      { status: 403 }
    );
  }

  if (!connection.accessToken) {
    return NextResponse.json(
      { error: "Rabobank access token missing" },
      { status: 400 }
    );
  }

  const response = await rabobankApiRequest<{
    paymentId?: string;
    transactionStatus?: string;
  }>({
    method: "POST",
    path: "/v1/single/sepa-credit-transfers",
    accessToken: connection.accessToken,
    body: {
      creditorAccount: {
        iban: creditorIban,
        currency,
      },
      creditorName,
      debtorAccount: {
        iban: debtorIban,
        currency,
      },
      instructedAmount: {
        content: amount,
        currency,
      },
      remittanceInformationUnstructured: remittanceInformation || undefined,
      requestedExecutionDate: executionDate || undefined,
    },
  });

  await db.insert(rabobankPayment).values({
    id: crypto.randomUUID(),
    connectionId,
    externalPaymentId: response.paymentId ?? null,
    status: "pending",
    creditorName,
    creditorIban,
    debtorIban,
    amount,
    currency,
    remittanceInformation: remittanceInformation || null,
    executionDate: executionDate || null,
    rawPayload: JSON.stringify(response),
  });

  return NextResponse.json({ success: true, payment: response });
}
