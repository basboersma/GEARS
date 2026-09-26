"use client";

import { useState } from "react";
import type { BoardLockRequirements } from "@/lib/board-lock";

export interface TeamOrganization {
  id: string;
  name: string;
  budget: number;
  boardLock: BoardLockRequirements;
}

function formatBudget(value: number) {
  return new Intl.NumberFormat("en-US", {
    currency: "EUR",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: "currency",
  }).format(value);
}

function BudgetCard({ organization }: { organization: TeamOrganization }) {
  const [budget, setBudget] = useState(String(organization.budget));
  const [lock, setLock] = useState(organization.boardLock);
  const [passwords, setPasswords] = useState<string[]>(() =>
    Array.from({ length: organization.boardLock.requiredPasswords }, () => "")
  );
  const [verifiedDecisions, setVerifiedDecisions] = useState<
    Array<BoardLockRequirements["decisions"][number] | null>
  >(() =>
    organization.boardLock.decisions
      .filter((decision) => decision.approval)
      .slice(0, organization.boardLock.requiredPasswords)
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const verifiedCount = verifiedDecisions.filter(Boolean).length;
  const verify = async (index: number) => {
    const password = passwords[index];
    if (!password) {
      return;
    }
    setError(null);
    const response = await fetch("/api/board-decisions", {
      body: JSON.stringify({
        action: "verify",
        organizationId: organization.id,
        password,
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const result = (await response.json().catch(() => null)) as {
      decisions?: BoardLockRequirements["decisions"];
      memberId?: string;
      position?: string;
      error?: string;
    } | null;
    if (
      !(response.ok && result?.decisions && result.memberId && result.position)
    ) {
      setError(
        result?.error ?? "That board password could not unlock the budget."
      );
      return;
    }
    setLock({ ...lock, decisions: result.decisions });
    setVerifiedDecisions((current) => {
      const next = [...current];
      next[index] = {
        memberId: result.memberId as string,
        position: result.position as string,
        approval: true,
        canRevoke: true,
      };
      return next;
    });
    setPasswords((current) =>
      current.map((value, valueIndex) => (valueIndex === index ? "" : value))
    );
  };

  const revoke = async (index: number) => {
    const decision = verifiedDecisions[index];
    if (!decision || decision.canRevoke === false) {
      return;
    }
    setError(null);
    const response = await fetch("/api/board-decisions", {
      body: JSON.stringify({
        action: "toggle",
        organizationId: organization.id,
        memberId: decision.memberId,
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const result = (await response.json().catch(() => null)) as {
      decisions?: BoardLockRequirements["decisions"];
      error?: string;
    } | null;
    if (!(response.ok && result?.decisions)) {
      setError(result?.error ?? "That board approval could not be revoked.");
      return;
    }
    setLock({ ...lock, decisions: result.decisions });
    setVerifiedDecisions((current) =>
      current.map((entry, entryIndex) => (entryIndex === index ? null : entry))
    );
  };

  const save = async () => {
    const amount = Number(budget);
    if (!Number.isFinite(amount) || amount < 0) {
      setError("Enter a valid non-negative budget.");
      return;
    }
    if (verifiedCount < lock.requiredPasswords) {
      setError(
        `Unlock this team with ${lock.requiredPasswords} board member passwords first.`
      );
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/team-management/budget", {
        body: JSON.stringify({
          budget: amount,
          organizationId: organization.id,
        }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      const result = (await response.json().catch(() => null)) as {
        boardLock?: BoardLockRequirements;
        error?: string;
      } | null;
      if (!response.ok) {
        setError(result?.error ?? "Unable to save the team budget.");
        if (result?.boardLock) {
          setLock(result.boardLock);
        }
        return;
      }
      setLock({
        ...lock,
        approvedCount: 0,
        decisions: lock.decisions.map((decision) => ({
          ...decision,
          approval: false,
        })),
      });
      setVerifiedDecisions([]);
    } catch {
      setError("Unable to save the team budget. Check your connection.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="flex min-h-[260px] w-[10%] min-w-64 flex-col justify-between rounded-2xl border border-[#3D3330] bg-[#232120] p-4 shadow-xl">
      <div>
        <p className="font-mono text-[#F0684D] text-[9px] uppercase tracking-[0.2em]">
          Team
        </p>
        <h2 className="mt-1 truncate font-semibold text-[#FFEDD1] text-lg">
          {organization.name}
        </h2>
        <p className="mt-1 text-[#7A6555] text-xs">
          Current: {formatBudget(Number(budget) || 0)}
        </p>
      </div>
      <label className="mt-5 block space-y-1">
        <span className="text-[#9C8272] text-[10px] uppercase tracking-widest">
          Team budget
        </span>
        <input
          className="w-full rounded-lg border border-[#3D3330] bg-[#1A1919] px-3 py-2 text-[#FFEDD1] text-sm outline-none focus:border-[#F0684D]"
          min="0"
          onChange={(event) => setBudget(event.target.value)}
          step="0.01"
          type="number"
          value={budget}
        />
      </label>
      <div className="mt-4 border-[#3D3330] border-t pt-3">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-[#9C8272]">Board lock</span>
          <span
            className={
              verifiedCount >= lock.requiredPasswords
                ? "text-emerald-400"
                : "text-[#FFD142]"
            }
          >
            {verifiedCount}/{lock.requiredPasswords}
          </span>
        </div>
        <div className="mt-2 space-y-1.5">
          {Array.from({ length: lock.requiredPasswords }, (_, index) => (
            <div
              className="flex gap-1.5"
              key={`${organization.id}-password-${index}`}
            >
              {verifiedDecisions[index] ? (
                <button
                  className="flex min-h-9 w-full flex-col items-center justify-center rounded-lg border border-emerald-400/50 bg-emerald-400/10 text-emerald-400 disabled:cursor-default disabled:opacity-70"
                  disabled={verifiedDecisions[index]?.canRevoke === false}
                  onClick={() => {
                    revoke(index).catch(() =>
                      setError("That board approval could not be revoked.")
                    );
                  }}
                  title={
                    verifiedDecisions[index]?.canRevoke === false
                      ? "Only this board member can revoke the approval"
                      : "Revoke this approval"
                  }
                  type="button"
                >
                  <span className="text-base leading-4">✓</span>
                  <span className="font-mono text-[8px] uppercase tracking-widest">
                    {verifiedDecisions[index]?.position}
                  </span>
                </button>
              ) : (
                <input
                  className="min-w-0 flex-1 rounded-lg border border-[#3D3330] bg-[#1A1919] px-2 py-1.5 text-[#FFEDD1] text-xs outline-none focus:border-[#F0684D]"
                  onChange={(event) =>
                    setPasswords((current) => {
                      const next = [...current];
                      next[index] = event.target.value;
                      return next;
                    })
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      verify(index).catch(() =>
                        setError(
                          "That board password could not unlock the budget."
                        )
                      );
                    }
                  }}
                  placeholder={`Board password ${index + 1}`}
                  type="password"
                  value={passwords[index] ?? ""}
                />
              )}
            </div>
          ))}
        </div>
      </div>
      {error && <p className="mt-3 text-[10px] text-rose-400">{error}</p>}
      <button
        className="mt-3 w-full rounded-lg bg-[#F0684D] px-3 py-2 font-semibold text-white text-xs hover:bg-[#E05538] disabled:cursor-not-allowed disabled:opacity-50"
        disabled={saving || verifiedCount < lock.requiredPasswords}
        onClick={() => save()}
        type="button"
      >
        {saving ? "Saving..." : "Save budget"}
      </button>
    </section>
  );
}

export function TeamsPanel({
  organizations,
}: {
  organizations: TeamOrganization[];
}) {
  return (
    <div className="flex flex-wrap items-start gap-5">
      {organizations.map((organization) => (
        <BudgetCard key={organization.id} organization={organization} />
      ))}
    </div>
  );
}
