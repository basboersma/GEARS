"use client";

import Link from "next/link";
import { useState } from "react";
import { Logout } from "@/components/logout";
import type { BoardLockRequirements } from "@/lib/board-lock";

interface TeamOrganization {
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
  const [passwords, setPasswords] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const verifiedCount = lock.decisions.filter(
    (decision) => decision.approval
  ).length;
  const unlock = async (index: number) => {
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
      error?: string;
    } | null;
    if (!(response.ok && result?.decisions)) {
      setError(
        result?.error ?? "That board password could not unlock the budget."
      );
      return;
    }
    setLock({
      ...lock,
      decisions: result.decisions,
      approvedCount: result.decisions.filter((decision) => decision.approval)
        .length,
    });
    setPasswords((current) =>
      current.map((value, valueIndex) => (valueIndex === index ? "" : value))
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
              <input
                className="min-w-0 flex-1 rounded-lg border border-[#3D3330] bg-[#1A1919] px-2 py-1.5 text-[#FFEDD1] text-xs outline-none focus:border-[#F0684D]"
                onChange={(event) =>
                  setPasswords((current) =>
                    current.map((value, valueIndex) =>
                      valueIndex === index ? event.target.value : value
                    )
                  )
                }
                placeholder={`Board password ${index + 1}`}
                type="password"
                value={passwords[index] ?? ""}
              />
              <button
                className="rounded-lg border border-[#3D3330] px-2 text-[#F0684D] text-xs hover:bg-[#F0684D]/10"
                onClick={() => unlock(index)}
                type="button"
              >
                Unlock
              </button>
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

export function TeamManagementPage({
  organizations,
}: {
  organizations: TeamOrganization[];
}) {
  return (
    <div
      className="flex min-h-screen bg-[#1A1919] text-[#FFEDD1]"
      style={{ fontFamily: "'Inter',sans-serif" }}
    >
      <aside className="flex w-56 shrink-0 flex-col border-[#FFEDD1]/10 border-r bg-[#141212]">
        <div className="border-white/8 border-b p-4">
          <p className="font-semibold text-sm">Administration</p>
          <p className="mt-1 text-[#7A6555] text-[10px] uppercase tracking-widest">
            Admin workspace
          </p>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          <Link
            className="block rounded-lg px-3 py-2 text-[#9C8272] text-xs hover:bg-white/5 hover:text-[#FFEDD1]"
            href="/dashboard/admin"
          >
            Admin dashboard
          </Link>
          <Link
            className="block rounded-lg bg-[#F0684D]/20 px-3 py-2 text-[#F0684D] text-xs"
            href="/dashboard/admin/team-management"
          >
            Team management
          </Link>
          <Link
            className="block rounded-lg px-3 py-2 text-[#9C8272] text-xs hover:bg-white/5 hover:text-[#FFEDD1]"
            href="/dashboard/admin/orders"
          >
            Upcoming orders
          </Link>
        </nav>
        <div className="flex items-center justify-between border-white/8 border-t p-3">
          <span className="text-[#7A6555] text-xs">Admin</span>
          <Logout />
        </div>
      </aside>
      <main className="min-w-0 flex-1">
        <header className="flex items-center justify-between border-white/8 border-b bg-[#141212] px-6 py-4">
          <div>
            <p className="text-[#F0684D] text-[10px] uppercase tracking-[0.2em]">
              Administration
            </p>
            <h1 className="mt-1 font-semibold text-xl">Team management</h1>
          </div>
          <Link
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[#9C8272] text-xs hover:text-[#FFEDD1]"
            href="/dashboard"
          >
            Back to dashboard
          </Link>
        </header>
        <div className="flex flex-wrap items-start gap-5 p-6">
          {organizations.map((organization) => (
            <BudgetCard key={organization.id} organization={organization} />
          ))}
        </div>
      </main>
    </div>
  );
}
