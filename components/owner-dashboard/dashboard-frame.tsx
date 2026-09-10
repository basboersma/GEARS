"use client";

import Link from "next/link";
import { useState } from "react";
import { Logout } from "@/components/logout";
import { OrganizationSwitcher } from "@/components/organization-switcher";
import type { Organization } from "@/db/schema";
import { useDashboardData } from "./dashboard-data-context";
import { MembersModal } from "./MembersModal";

function SubteamsNav() {
  const { departments, subteams } = useDashboardData();
  const [open, setOpen] = useState(false);
  const [openDept, setOpenDept] = useState<string | null>(null);

  return (
    <div>
      <button
        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[#9C8272] text-xs transition-all hover:bg-white/5 hover:text-[#FFEDD1]"
        onClick={() => setOpen((current) => !current)}
        type="button"
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
          {departments.map((department, index) => (
            <div key={department}>
              <button
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[#9C8272] text-[11px] transition-all hover:bg-white/5 hover:text-[#FFEDD1]"
                onClick={() =>
                  setOpenDept((current) =>
                    current === department ? null : department
                  )
                }
                type="button"
              >
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-sm"
                  style={{
                    background: [
                      "#4f6ef7",
                      "#10b981",
                      "#8b5cf6",
                      "#f59e0b",
                      "#f43f5e",
                      "#ec4899",
                    ][index % 6],
                  }}
                />
                <span className="flex-1">{department}</span>
                <span className="text-[8px] opacity-50">
                  {openDept === department ? "▲" : "▼"}
                </span>
              </button>
              {openDept === department && (
                <div className="space-y-0.5 pl-4">
                  {(subteams[department] ?? []).map((subteam) => (
                    <button
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1 text-left text-[#7A6555] text-[10px] transition-colors hover:bg-white/5 hover:text-[#C4A882]"
                      key={subteam}
                      type="button"
                    >
                      <span
                        className="h-3 w-px shrink-0"
                        style={{
                          background: `${["#4f6ef7", "#10b981", "#8b5cf6", "#f59e0b", "#f43f5e", "#ec4899"][index % 6]}60`,
                        }}
                      />
                      {subteam}
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

export function OwnerDashboardFrame({
  activePage,
  children,
  organizationName,
  organizationSlug,
  organizations,
  userEmail,
  userName,
}: {
  activePage: "dashboard" | "orders";
  children: React.ReactNode;
  organizationName: string;
  organizationSlug: string;
  organizations: Organization[];
  userEmail: string;
  userName: string;
}) {
  const [showMembers, setShowMembers] = useState(false);
  const dashboardHref = `/dashboard/organization/${organizationSlug}`;
  const ordersHref = `${dashboardHref}/order-review`;
  const navClass = (isActive: boolean) =>
    `flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs transition-all ${isActive ? "bg-[#F0684D]/20 text-[#F0684D]" : "text-[#9C8272] hover:bg-white/5 hover:text-[#FFEDD1]"}`;

  return (
    <div
      className="flex h-screen overflow-hidden bg-[#1A1919]"
      style={{ fontFamily: "'Inter',sans-serif" }}
    >
      <aside className="flex h-full w-52 shrink-0 flex-col border-[#FFEDD1]/10 border-r bg-[#141212]">
        <div className="relative border-white/8 border-b p-3">
          <div className="flex items-center gap-2.5 px-2 py-1.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#F0684D]">
              <span className="font-bold text-[10px] text-white">
                {organizationName[0]}
              </span>
            </div>
            <OrganizationSwitcher organizations={organizations} />
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-auto p-3">
          <div className="mt-1 mb-2 px-2 font-semibold text-[#9C8272] text-[9px] uppercase tracking-widest">
            Navigation
          </div>
          <Link
            className={navClass(activePage === "dashboard")}
            href={dashboardHref}
          >
            <span
              className={`h-1 w-1 shrink-0 rounded-full ${activePage === "dashboard" ? "bg-[#F0684D]" : "bg-[#9C8272]/50"}`}
            />
            <span>Dashboard</span>
          </Link>
          <div className="space-y-0.5 pt-1">
            <SubteamsNav />
            <button
              className={navClass(false)}
              onClick={() => setShowMembers(true)}
              type="button"
            >
              <span className="h-1 w-1 shrink-0 rounded-full bg-[#9C8272]/50" />
              <span>Manage members</span>
            </button>
            <Link
              className={navClass(activePage === "orders")}
              href={ordersHref}
            >
              <span
                className={`h-1 w-1 shrink-0 rounded-full ${activePage === "orders" ? "bg-[#F0684D]" : "bg-[#9C8272]/50"}`}
              />
              <span>Manage orders</span>
            </Link>
          </div>
        </nav>

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

      <div className="flex h-full min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center justify-between border-white/8 border-b bg-[#141212] px-5 py-2.5">
          <h1 className="font-semibold text-[#FFEDD1] text-base tracking-wide">
            Member Dashboard
          </h1>
          <div className="flex items-center gap-1.5">
            <Link
              className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[#9C8272] text-xs transition-all hover:border-white/20 hover:text-[#FFEDD1]"
              href="/dashboard/personal-information"
            >
              Settings
            </Link>
            <Logout />
          </div>
        </header>
        {children}
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
