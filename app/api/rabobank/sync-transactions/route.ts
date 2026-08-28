import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { member, rabobankConnection, rabobankTransaction } from "@/db/schema";
import { rabobankApiRequest, refreshRabobankAccessToken } from "@/lib/rabobank";
import { getCurrentUser } from "@/server/users";

function pickTransactions(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return [] as Record<string, unknown>[];
  }

  const typedPayload = payload as Record<string, unknown>;
  const candidates = ["transactions", "bookedTransactions", "entries", "data"];

  for (const key of candidates) {
    const value = typedPayload[key];
    if (Array.isArray(value)) {
      return value as Record<string, unknown>[];
    }
  }

  return [] as Record<string, unknown>[];
}

function pickTransactionId(transaction: Record<string, unknown>) {
  return String(
    transaction.transactionId ??
      transaction.id ??
      transaction.reference ??
      transaction.entryReference ??
      crypto.randomUUID()
  );
}

type RabobankTransactionRecord = Record<string, unknown> & {
  amount?: unknown;
  instructedAmount?: {
    content?: unknown;
    currency?: unknown;
  };
  transactionAmount?: unknown;
  currency?: unknown;
  remittanceInformationUnstructured?: unknown;
  description?: unknown;
  entryDetails?: unknown;
  bookingDate?: unknown;
  bookingDateTime?: unknown;
  valueDate?: unknown;
  valueDateTime?: unknown;
  counterpartyName?: unknown;
  creditorName?: unknown;
  debtorName?: unknown;
  counterpartyIban?: unknown;
  creditorAccount?: {
    iban?: unknown;
  };
  debtorAccount?: {
    iban?: unknown;
  };
};

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: This handler validates access, refreshes tokens, fetches accounts, and persists transactions.
export async function POST(request: Request) {
  const { user } = await getCurrentUser();
  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get("organizationId");

  if (!organizationId) {
    return NextResponse.json(
      { error: "organizationId is required" },
      { status: 400 }
    );
  }

  const connection = await db.query.rabobankConnection.findFirst({
    where: and(
      eq(rabobankConnection.organizationId, organizationId),
      eq(rabobankConnection.product, "account_information")
    ),
  });

  if (!connection) {
    return NextResponse.json(
      { error: "No Rabobank account-information connection found" },
      { status: 404 }
    );
  }

  if (connection.organizationId !== organizationId) {
    return NextResponse.json({ error: "Connection mismatch" }, { status: 403 });
  }

  const membership = await db.query.member.findFirst({
    where: and(
      eq(member.organizationId, organizationId),
      eq(member.userId, user.id)
    ),
  });

  if (!membership) {
    return NextResponse.json(
      { error: "Only organization members can sync" },
      { status: 403 }
    );
  }

  let accessToken = connection.accessToken;

  if (
    connection.refreshToken &&
    connection.accessTokenExpiresAt &&
    connection.accessTokenExpiresAt < new Date()
  ) {
    const refreshed = await refreshRabobankAccessToken(connection.refreshToken);
    accessToken = refreshed.access_token;

    await db
      .update(rabobankConnection)
      .set({
        accessToken: refreshed.access_token,
        refreshToken: refreshed.refresh_token ?? connection.refreshToken,
        accessTokenExpiresAt: new Date(
          Date.now() + refreshed.expires_in * 1000
        ),
        refreshTokenExpiresAt: refreshed.refresh_token_expires_in
          ? new Date(Date.now() + refreshed.refresh_token_expires_in * 1000)
          : connection.refreshTokenExpiresAt,
        updatedAt: new Date(),
      })
      .where(eq(rabobankConnection.id, connection.id));
  }

  if (!accessToken) {
    return NextResponse.json(
      { error: "Rabobank access token missing" },
      { status: 400 }
    );
  }

  const accountList = await rabobankApiRequest<{
    accounts?: Record<string, unknown>[];
  }>({
    method: "GET",
    path: "/insight/accounts",
    accessToken,
  });

  const accounts = accountList.accounts ?? [];
  let inserted = 0;

  for (const account of accounts) {
    const accountId = String(
      account.resourceId ?? account.accountId ?? account.id ?? ""
    );
    if (!accountId) {
      continue;
    }

    await db
      .update(rabobankConnection)
      .set({
        accountId,
        iban: String(account.iban ?? connection.iban ?? ""),
        accountName: String(
          account.name ?? account.ownerName ?? connection.accountName ?? ""
        ),
        updatedAt: new Date(),
      })
      .where(eq(rabobankConnection.id, connection.id));

    const transactionsResponse = await rabobankApiRequest<{
      transactions?: Record<string, unknown>[];
      bookedTransactions?: Record<string, unknown>[];
      entries?: Record<string, unknown>[];
      data?: Record<string, unknown>[];
    }>({
      method: "GET",
      path: `/insight/accounts/${encodeURIComponent(accountId)}/transactions`,
      accessToken,
    });

    const transactions = pickTransactions(transactionsResponse);

    for (const transaction of transactions) {
      const typedTransaction = transaction as RabobankTransactionRecord;
      const transactionId = pickTransactionId(transaction);
      const amount = String(
        typedTransaction.amount ??
          typedTransaction.instructedAmount?.content ??
          typedTransaction.transactionAmount ??
          ""
      );
      const currency = String(
        typedTransaction.currency ??
          typedTransaction.instructedAmount?.currency ??
          ""
      );
      const description = String(
        typedTransaction.remittanceInformationUnstructured ??
          typedTransaction.description ??
          typedTransaction.entryDetails ??
          ""
      );

      await db
        .delete(rabobankTransaction)
        .where(
          and(
            eq(rabobankTransaction.connectionId, connection.id),
            eq(rabobankTransaction.externalId, transactionId)
          )
        );

      await db.insert(rabobankTransaction).values({
        id: crypto.randomUUID(),
        connectionId: connection.id,
        externalId: transactionId,
        accountId,
        bookingDate: String(
          typedTransaction.bookingDate ?? typedTransaction.bookingDateTime ?? ""
        ),
        valueDate: String(
          typedTransaction.valueDate ?? typedTransaction.valueDateTime ?? ""
        ),
        amount,
        currency,
        description,
        counterpartyName: String(
          typedTransaction.counterpartyName ??
            typedTransaction.creditorName ??
            typedTransaction.debtorName ??
            ""
        ),
        counterpartyIban: String(
          typedTransaction.counterpartyIban ??
            typedTransaction.creditorAccount?.iban ??
            typedTransaction.debtorAccount?.iban ??
            ""
        ),
        rawPayload: JSON.stringify(transaction),
      });

      inserted += 1;
    }
  }

  return NextResponse.json({
    success: true,
    accounts: accounts.length,
    transactions: inserted,
  });
}
