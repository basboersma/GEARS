"use client";

import { useState } from "react";
import { avatarBg } from "./data";
import {
  InvitePanel,
  MembersOverTimeChart,
  PieStatsWidget,
} from "./MembersPage";
import type {
  BoardMember,
  BoardPosition,
  Member,
  TeamHistorySnapshot,
} from "./types";
import { BOARD_POSITIONS } from "./types";

export function BoardMembersPage({
  initialBoardMembers,
  initialDepartments,
  initialDepartmentIds,
  initialMembers,
  initialOrganizationId,
  teamHistory,
}: {
  initialBoardMembers: BoardMember[];
  initialDepartments: string[];
  initialDepartmentIds: Record<string, string>;
  initialMembers: Member[];
  initialOrganizationId: string;
  teamHistory: TeamHistorySnapshot[];
}) {
  const [boardMembers, setBoardMembers] = useState(initialBoardMembers);
  const [showInvite, setShowInvite] = useState(false);
  const [historySnapshot, setHistorySnapshot] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const boardMemberFor = (position: BoardPosition) =>
    boardMembers.find((entry) => entry.position === position);

  const savePosition = async (position: BoardPosition, memberId: string) => {
    setSaveError(null);
    const response = memberId
      ? await fetch("/api/board-members", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            organizationId: initialOrganizationId,
            memberId,
            position,
          }),
        })
      : await fetch(
          `/api/board-members?organizationId=${encodeURIComponent(initialOrganizationId)}&position=${encodeURIComponent(position)}`,
          {
            method: "DELETE",
          }
        );
    const result = (await response.json().catch(() => null)) as {
      boardMember?: BoardMember;
      error?: string;
    } | null;
    if (!response.ok) {
      setSaveError(result?.error ?? "Unable to save board member.");
      return;
    }
    setBoardMembers((current) => {
      const withoutPosition = current.filter(
        (entry) => entry.position !== position && entry.memberId !== memberId
      );
      return result?.boardMember
        ? [...withoutPosition, result.boardMember]
        : withoutPosition;
    });
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex min-h-0 flex-1 overflow-hidden rounded-2xl border border-[#3D3330]">
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#1E1C1B]">
          <div
            className="flex shrink-0 gap-3 border-[#3D3330] border-b p-3"
            style={{ height: 286 }}
          >
            <div className="flex w-[218px] shrink-0 flex-col rounded-xl border border-[#3D3330] bg-[#232120] p-3">
              <PieStatsWidget members={initialMembers} />
            </div>
            <div className="flex min-w-0 flex-1 flex-col rounded-xl border border-[#3D3330] bg-[#232120] p-3">
              <MembersOverTimeChart
                activeSnapshot={historySnapshot}
                departmentIds={initialDepartmentIds}
                departments={initialDepartments}
                deptColors={Object.fromEntries(
                  initialDepartments.map((department, index) => [
                    department,
                    ["#4f6ef7", "#10b981", "#8b5cf6", "#f59e0b"][index % 4],
                  ])
                )}
                history={teamHistory}
                onSnapshotChange={setHistorySnapshot}
              />
            </div>
            <div className="flex w-[218px] shrink-0 flex-col justify-center rounded-xl border border-[#3D3330] bg-[#232120] p-3">
              <div className="font-semibold text-[#7A6555] text-[10px] uppercase tracking-wider">
                Board seats
              </div>
              <div className="mt-2 font-bold text-3xl text-[#FFEDD1]">
                {boardMembers.length}/{BOARD_POSITIONS.length}
              </div>
              <div className="mt-1 text-[#9C8272] text-xs">
                filled positions
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 border-[#3D3330] border-b px-4 py-3">
            <h2 className="font-semibold text-[#FFEDD1] text-sm">
              Board Members
            </h2>
            <span className="text-[#7A6555] text-xs">
              Assign one member to each position
            </span>
            <div className="flex-1" />
            <button
              className={`rounded-xl border px-3 py-2 font-semibold text-xs transition-colors ${showInvite ? "border-[#F0684D] bg-[#F0684D] text-white" : "border-[#3D3330] bg-[#2A2724] text-[#FFEDD1] hover:border-[#4A3F38]"}`}
              onClick={() => setShowInvite((current) => !current)}
              type="button"
            >
              Invite Members
            </button>
          </div>

          {saveError && (
            <div className="mx-4 mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-rose-300 text-xs">
              {saveError}
            </div>
          )}
          <div className="grid min-h-0 flex-1 grid-cols-2 gap-3 overflow-auto p-4 md:grid-cols-3 xl:grid-cols-6">
            {BOARD_POSITIONS.map((position) => {
              const assignment = boardMemberFor(position);
              const selectedMember = initialMembers.find(
                (member) => member.id === assignment?.memberId
              );
              return (
                <div
                  className="flex min-h-36 flex-col rounded-xl border border-[#3D3330] bg-[#232120] p-3"
                  key={position}
                >
                  <div className="mb-3 font-semibold text-[#F0684D] text-[10px] uppercase tracking-wider">
                    {position}
                  </div>
                  {selectedMember && (
                    <div className="mb-3 flex items-center gap-2">
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${avatarBg(initialMembers.indexOf(selectedMember))} font-bold text-white text-xs`}
                      >
                        {selectedMember.avatar}
                      </div>
                      <div className="min-w-0 truncate text-[#FFEDD1] text-xs">
                        {selectedMember.name}
                      </div>
                    </div>
                  )}
                  <select
                    className="mt-auto w-full rounded-lg border border-[#3D3330] bg-[#2A2724] px-2 py-2 text-[#C4A882] text-xs outline-none focus:border-[#F0684D]/60"
                    onChange={(event) =>
                      savePosition(position, event.target.value)
                    }
                    value={assignment?.memberId ?? ""}
                  >
                    <option value="">Open position</option>
                    {initialMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        </div>
        {showInvite && (
          <InvitePanel
            departmentIds={initialDepartmentIds}
            deptColors={Object.fromEntries(
              initialDepartments.map((department) => [department, "#4f6ef7"])
            )}
            depts={initialDepartments}
            members={initialMembers}
            onClose={() => setShowInvite(false)}
            organizationId={initialOrganizationId}
          />
        )}
      </div>
    </div>
  );
}
