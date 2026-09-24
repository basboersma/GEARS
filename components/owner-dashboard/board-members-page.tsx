"use client";

import { useState } from "react";
import { avatarBg } from "./data";
import { MembersOverTimeChart, PieStatsWidget } from "./MembersPage";
import type {
  BoardMember,
  BoardPosition,
  Member,
  TeamHistorySnapshot,
} from "./types";
import { BOARD_POSITIONS } from "./types";

interface BoardInvite {
  email: string;
  position: BoardPosition;
}

function BoardInvitePanel({
  members,
  organizationId,
  onClose,
}: {
  members: Member[];
  organizationId: string;
  onClose: () => void;
}) {
  const [email, setEmail] = useState("");
  const [position, setPosition] = useState<BoardPosition>(BOARD_POSITIONS[0]);
  const [error, setError] = useState("");
  const [sent, setSent] = useState<BoardInvite[]>([]);

  const sendInvite = async () => {
    setError("");
    const response = await fetch("/api/organization-invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organizationId,
        email,
        boardPosition: position,
      }),
    });
    const result = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    if (!response.ok) {
      setError(result?.error ?? "Unable to send invitation.");
      return;
    }
    setSent((current) => [...current, { email, position }]);
    setEmail("");
  };

  return (
    <aside className="flex h-full w-[296px] min-w-[296px] flex-col overflow-hidden border-[#3D3330] border-l bg-[#1E1C1B]">
      <div className="flex shrink-0 items-center justify-between border-[#3D3330] border-b px-4 py-3">
        <h2 className="font-semibold text-[#FFEDD1] text-sm">
          Invite Board Member
        </h2>
        <button
          className="text-[#7A6555] text-sm hover:text-[#FFEDD1]"
          onClick={onClose}
          type="button"
        >
          ✕
        </button>
      </div>
      <div className="shrink-0 space-y-2 border-[#3D3330] border-b p-3">
        <input
          className="w-full rounded-xl border border-[#3D3330] bg-[#2A2724] px-2.5 py-1.5 text-[#FFEDD1] text-xs outline-none placeholder:text-[#7A6555] focus:border-[#F0684D]/60"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="student@university.nl"
          type="email"
          value={email}
        />
        <select
          className="w-full rounded-xl border border-[#3D3330] bg-[#2A2724] px-2.5 py-1.5 text-[#C4A882] text-xs outline-none focus:border-[#F0684D]/60"
          onChange={(event) => setPosition(event.target.value as BoardPosition)}
          value={position}
        >
          {BOARD_POSITIONS.map((boardPosition) => (
            <option key={boardPosition} value={boardPosition}>
              {boardPosition}
            </option>
          ))}
        </select>
        <button
          className="w-full rounded-xl bg-[#F0684D] py-1.5 font-semibold text-white text-xs hover:bg-[#E05538]"
          onClick={sendInvite}
          type="button"
        >
          Send Invite Mail
        </button>
        {error && <p className="text-[10px] text-rose-400">{error}</p>}
      </div>
      <div className="flex-1 space-y-1.5 overflow-auto p-3">
        {sent.map((invite, index) => (
          <div
            className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2 py-1.5"
            key={`${invite.email}-${index}`}
          >
            <div className="truncate text-[10px] text-emerald-400">
              {invite.email}
            </div>
            <div className="text-[9px] text-emerald-400/60">
              {invite.position}
            </div>
          </div>
        ))}
        {members.length === 0 && (
          <p className="text-[#7A6555] text-xs">No current members.</p>
        )}
      </div>
    </aside>
  );
}

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
              <PieStatsWidget
                members={initialMembers.filter((member) =>
                  boardMembers.some((entry) => entry.memberId === member.id)
                )}
              />
            </div>
            <div className="flex min-w-0 flex-1 flex-col rounded-xl border border-[#3D3330] bg-[#232120] p-3">
              <MembersOverTimeChart
                activeSnapshot={historySnapshot}
                boardMemberCount={boardMembers.length}
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
          <BoardInvitePanel
            members={initialMembers}
            onClose={() => setShowInvite(false)}
            organizationId={initialOrganizationId}
          />
        )}
      </div>
    </div>
  );
}
