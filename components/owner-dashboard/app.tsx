// biome-ignore-all lint/a11y/noLabelWithoutControl: Preserves the reference dashboard interaction design.
// biome-ignore-all lint/a11y/noNoninteractiveElementInteractions: Preserves the reference dashboard modal interaction design.
// biome-ignore-all lint/a11y/noStaticElementInteractions: Preserves the reference dashboard modal interaction design.
// biome-ignore-all lint/a11y/noSvgWithoutTitle: Preserves the reference dashboard visual assets.
// biome-ignore-all lint/a11y/useButtonType: Preserves the reference dashboard controls.
// biome-ignore-all lint/a11y/useKeyWithClickEvents: Preserves the reference dashboard modal interaction design.
// biome-ignore-all lint/complexity/noExcessiveCognitiveComplexity: Preserves the reference dashboard component structure.
// biome-ignore-all lint/complexity/noForEach: Preserves the reference dashboard data flow.
// biome-ignore-all lint/correctness/useExhaustiveDependencies: Preserves the reference dashboard interaction timing.
// biome-ignore-all lint/suspicious/noArrayIndexKey: Preserves the reference dashboard list rendering.
// biome-ignore-all lint/suspicious/noExplicitAny: Preserves the reference dashboard chart library contract.
// biome-ignore-all lint/style/noNestedTernary: Preserves the reference dashboard visual state expressions.
// biome-ignore-all lint/style/noNonNullAssertion: Preserves the reference dashboard data contract.
// biome-ignore-all lint/style/useFilenamingConvention: Preserves the reference dashboard source names.
"use client";

import { useState } from "react";
// GearsNL dashboard
import { CalendarBlock } from "./CalendarBlock";
import {
  BUDGET,
  DEPARTMENTS,
  DEPT_COLORS,
  NOTIFICATIONS,
  SUBTEAMS,
} from "./data";
import { FilesBlock } from "./FilesBlock";
import { IcicleChart } from "./IcicleChart";
import { MembersModal } from "./MembersModal";
import { TodoBlock } from "./TodoBlock";
import type { AppNotification, BudgetData } from "./types";

// ─── Notifications block ──────────────────────────────────────────────────────
const NOTIF_TYPE_COLOR: Record<AppNotification["type"], string> = {
  order: "#FFD142",
  member: "#F0684D",
  event: "#60a5fa",
  todo: "#a78bfa",
  budget: "#F0684D",
};

function NotificationsBlock() {
  const [notifs, setNotifs] = useState<AppNotification[]>(NOTIFICATIONS);
  const markRead = (id: string) =>
    setNotifs((p) => p.map((n) => (n.id === id ? { ...n, read: true } : n)));
  const unread = notifs.filter((n) => !n.read).length;
  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 flex shrink-0 items-center justify-between">
        <h2 className="font-semibold text-[#FFEDD1] text-sm">Notifications</h2>
        {unread > 0 && (
          <span className="rounded-full bg-[#F0684D]/20 px-1.5 py-0.5 font-bold text-[#F0684D] text-[9px]">
            {unread} new
          </span>
        )}
      </div>
      <div className="min-h-0 flex-1 space-y-1.5 overflow-auto">
        {notifs.map((n) => (
          <button
            className={`flex w-full items-start gap-2.5 rounded-xl border p-2.5 text-left transition-all ${
              n.read
                ? "border-[#3D3330] bg-[#232120] opacity-60"
                : "border-[#3D3330] bg-[#2A2724] hover:border-[#4A3F38]"
            }`}
            key={n.id}
            onClick={() => markRead(n.id)}
          >
            <span
              className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
              style={{
                background: n.read ? "#3D3330" : NOTIF_TYPE_COLOR[n.type],
              }}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate font-medium text-[#FFEDD1] text-xs">
                  {n.title}
                </span>
                <span className="shrink-0 text-[#7A6555] text-[9px]">
                  {n.time}
                </span>
              </div>
              <p className="mt-0.5 text-[#9C8272] text-[10px] leading-snug">
                {n.body}
              </p>
            </div>
          </button>
        ))}
        {notifs.length === 0 && (
          <div className="flex h-32 flex-col items-center justify-center gap-2 text-[#7A6555] text-sm">
            <span className="font-thin text-3xl text-[#4A3F38]">—</span>
            <span>All clear</span>
          </div>
        )}
      </div>
    </div>
  );
}

const ORGS = ["GearsNL", "GearsNL B-team", "GearsNL Alumni"];

function SubteamsNav() {
  const [open, setOpen] = useState(false);
  const [openDept, setOpenDept] = useState<string | null>(null);
  return (
    <div>
      <button
        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[#9C8272] text-xs transition-all hover:bg-white/5 hover:text-[#FFEDD1]"
        onClick={() => setOpen((o) => !o)}
      >
        <span
          className="text-[8px] transition-transform duration-150"
          style={{ transform: open ? "rotate(90deg)" : "none" }}
        >
          ▶
        </span>
        <span>Subteams</span>
      </button>
      {open && (
        <div className="space-y-0.5 pl-3">
          {DEPARTMENTS.map((dept) => (
            <div key={dept}>
              <button
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[#9C8272] text-[11px] transition-all hover:bg-white/5 hover:text-[#FFEDD1]"
                onClick={() => setOpenDept((d) => (d === dept ? null : dept))}
              >
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-sm"
                  style={{ background: DEPT_COLORS[dept] }}
                />
                <span className="flex-1">{dept}</span>
                <span className="text-[8px] opacity-50">
                  {openDept === dept ? "▲" : "▼"}
                </span>
              </button>
              {openDept === dept && (
                <div className="space-y-0.5 pl-4">
                  {(SUBTEAMS[dept] ?? []).map((sub) => (
                    <button
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1 text-left text-[#7A6555] text-[10px] transition-colors hover:bg-white/5 hover:text-[#C4A882]"
                      key={sub}
                    >
                      <span
                        className="h-3 w-px shrink-0"
                        style={{ background: `${DEPT_COLORS[dept]}60` }}
                      />
                      {sub}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({
  organizationName,
  userName,
  userEmail,
  onManageMembers,
}: {
  organizationName: string;
  userName: string;
  userEmail: string;
  onManageMembers: () => void;
}) {
  const [org, setOrg] = useState(organizationName);
  const [orgOpen, setOrgOpen] = useState(false);

  return (
    <aside className="flex h-full w-52 shrink-0 flex-col border-[#FFEDD1]/10 border-r bg-[#141212]">
      {/* Org dropdown */}
      <div className="relative border-white/8 border-b p-3">
        <button
          className="group flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/5"
          onClick={() => setOrgOpen((o) => !o)}
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#F0684D]">
            <span className="font-bold text-[10px] text-white">{org[0]}</span>
          </div>
          <span className="flex-1 truncate text-left font-semibold text-[#FFEDD1] text-xs tracking-wide">
            {org}
          </span>
          <span className="shrink-0 text-[#7A6555] text-[9px]">
            {orgOpen ? "▲" : "▼"}
          </span>
        </button>
        {orgOpen && (
          <div className="absolute top-full right-3 left-3 z-50 mt-1 overflow-hidden rounded-xl border border-[#3D3330] bg-[#232120] shadow-xl">
            {[
              organizationName,
              ...ORGS.filter((name) => name !== organizationName),
            ].map((o) => (
              <button
                className={`w-full px-3 py-2 text-left text-xs transition-colors ${o === org ? "bg-[#F0684D]/10 text-[#F0684D]" : "text-[#C4A882] hover:bg-white/5 hover:text-[#FFEDD1]"}`}
                key={o}
                onClick={() => {
                  setOrg(o);
                  setOrgOpen(false);
                }}
              >
                {o}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-auto p-3">
        <div className="mt-1 mb-2 px-2 font-semibold text-[#9C8272] text-[9px] uppercase tracking-widest">
          Navigation
        </div>
        <button className="flex w-full items-center gap-2.5 rounded-lg bg-[#F0684D]/20 px-2.5 py-2 text-left text-[#F0684D] text-xs transition-all">
          <span className="h-1 w-1 shrink-0 rounded-full bg-[#F0684D]" />
          <span>Dashboard</span>
        </button>
        <div className="space-y-0.5 pt-1">
          <SubteamsNav />
          <button
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[#9C8272] text-xs transition-all hover:bg-white/5 hover:text-[#FFEDD1]"
            onClick={onManageMembers}
          >
            <span className="h-1 w-1 shrink-0 rounded-full bg-[#9C8272]/50" />
            <span>Manage members</span>
          </button>
          <button className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[#9C8272] text-xs transition-all hover:bg-white/5 hover:text-[#FFEDD1]">
            <span className="h-1 w-1 shrink-0 rounded-full bg-[#9C8272]/50" />
            <span>Manage orders</span>
          </button>
        </div>
      </nav>

      {/* User */}
      <div className="border-white/8 border-t p-3">
        <div className="flex items-center gap-2 py-1">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F0684D] font-bold text-white text-xs">
            A
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium text-[#FFEDD1] text-xs">
              {userName}
            </div>
            <div className="truncate text-[#9C8272] text-[10px]">
              {userEmail}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

// ─── Header ────────────────────────────────────────────────────────────────────
function Header() {
  return (
    <header className="flex shrink-0 items-center justify-between border-white/8 border-b bg-[#141212] px-5 py-2.5">
      <h1 className="font-semibold text-[#FFEDD1] text-base tracking-wide">
        Member Dashboard
      </h1>
      <div className="flex items-center gap-1.5">
        {(["Settings", "Logout"] as const).map((label) => (
          <button
            className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[#9C8272] text-xs transition-all hover:border-white/20 hover:text-[#FFEDD1]"
            key={label}
          >
            {label}
          </button>
        ))}
      </div>
    </header>
  );
}

// ─── App ───────────────────────────────────────────────────────────────────────
export default function App({
  organizationName,
  userName,
  userEmail,
  budget = BUDGET,
}: {
  organizationName: string;
  userName: string;
  userEmail: string;
  budget?: BudgetData;
}) {
  const [showMembers, setShowMembers] = useState(false);

  return (
    <div
      className="flex h-full overflow-hidden bg-[#1A1919]"
      style={{ fontFamily: "'Inter',sans-serif" }}
    >
      <Sidebar
        onManageMembers={() => setShowMembers(true)}
        organizationName={organizationName}
        userEmail={userEmail}
        userName={userName}
      />
      <div className="flex h-full min-w-0 flex-1 flex-col">
        <Header />
        <main className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-4">
          <IcicleChart data={budget} />
          <div className="grid min-h-0 flex-1 grid-cols-2 grid-rows-2 gap-3">
            <div className="flex flex-col overflow-hidden rounded-2xl border border-[#3D3330] bg-[#232120] p-3">
              <CalendarBlock />
            </div>
            <div className="flex flex-col overflow-hidden rounded-2xl border border-[#3D3330] bg-[#232120] p-3">
              <NotificationsBlock />
            </div>
            <div className="flex flex-col overflow-hidden rounded-2xl border border-[#3D3330] bg-[#232120] p-3">
              <h2 className="mb-2 shrink-0 font-semibold text-[#FFEDD1] text-sm">
                Todo
              </h2>
              <TodoBlock />
            </div>
            <div className="flex flex-col overflow-hidden rounded-2xl border border-[#3D3330] bg-[#232120] p-3">
              <FilesBlock />
            </div>
          </div>
        </main>
      </div>
      {showMembers && (
        <MembersModal
          currentTeam="Board"
          onClose={() => setShowMembers(false)}
        />
      )}
    </div>
  );
}
