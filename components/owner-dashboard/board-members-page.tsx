"use client";

import { useState } from "react";
import { avatarBg } from "./data";
import {
  ChoroplethMap,
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

interface BoardInvite {
  email: string;
  position: BoardPosition;
}

function BoardMemberCard({
  member,
  onRemove,
}: {
  member: Member;
  onRemove: () => void;
}) {
  return (
    <div className="flex cursor-pointer select-none items-center gap-2 rounded-xl border border-[#3D3330] bg-[#2A2724] px-2.5 py-2 transition-all duration-150 hover:border-[#4A3F38]">
      <div
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${avatarBg(0)} font-bold text-[9px] text-white`}
      >
        {member.avatar}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold text-[#FFEDD1] text-[11px]">
          {member.name}
        </div>
        <div className="truncate text-[#7A6555] text-[9px]">{member.role}</div>
      </div>
      <button
        aria-label={`Remove ${member.name} from the board`}
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[#7A6555] text-[9px] transition-colors hover:bg-rose-400/10 hover:text-rose-400"
        onClick={onRemove}
        title={`Remove ${member.name}`}
        type="button"
      >
        ✕
      </button>
    </div>
  );
}

function BoardPositionColumn({
  color,
  availableMembers,
  member,
  position,
  onAssign,
  onRemove,
}: {
  color: string;
  availableMembers: Member[];
  member: Member | null;
  position: BoardPosition;
  onAssign: (memberId: string) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex min-w-[190px] max-w-[230px] flex-1 flex-col gap-2 rounded-2xl border border-[#3D3330] bg-[#232120] p-3 transition-all">
      <div className="flex items-center gap-2 border-[#3D3330] border-b pb-2">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-sm"
          style={{ background: color }}
        />
        <span className="flex-1 truncate font-bold text-[#FFEDD1] text-xs">
          {position}
        </span>
        <span
          className="rounded px-1.5 py-0.5 font-semibold text-[9px]"
          style={{ background: `${color}22`, color }}
        >
          {member ? 1 : 0}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1.5">
        <div className="font-semibold text-[#7A6555] text-[9px] uppercase tracking-wider">
          Members
        </div>
        {member ? (
          <BoardMemberCard member={member} onRemove={onRemove} />
        ) : (
          <select
            aria-label={`Add member to ${position}`}
            className="w-full rounded-xl border border-[#3D3330] border-dashed bg-[#2A2724] px-2.5 py-2 text-[#9C8272] text-[10px] outline-none focus:border-[#F0684D]/60"
            onChange={(event) => {
              if (event.target.value) {
                onAssign(event.target.value);
              }
            }}
            value=""
          >
            <option value="">Add board member</option>
            {availableMembers.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        )}
        {!member && (
          <div className="py-2 text-center text-[#4A3F38] text-[10px]">
            No members
          </div>
        )}
      </div>
    </div>
  );
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
  const [selectedCountryIso, setSelectedCountryIso] = useState<string | null>(
    null
  );
  const [saveError, setSaveError] = useState<string | null>(null);

  const boardMemberFor = (position: BoardPosition) =>
    boardMembers.find((entry) => entry.position === position);
  const boardMembersOnly = initialMembers.filter((member) =>
    boardMembers.some((entry) => entry.memberId === member.id)
  );
  async function savePosition(position: BoardPosition, memberId: string) {
    setSaveError(null);
    try {
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
    } catch {
      setSaveError("Unable to save board member. Check your connection.");
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex min-h-0 flex-1 overflow-hidden rounded-2xl border border-[#3D3330]">
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#1E1C1B]">
          <div
            className="flex shrink-0 gap-3 border-[#3D3330] border-b p-3"
            style={{ height: 286 }}
          >
            <div className="flex w-[218px] shrink-0 flex-col rounded-xl border border-[#3D3330] bg-[#232120] p-3">
              <PieStatsWidget members={boardMembersOnly} />
            </div>
            <div className="flex min-w-0 flex-1 flex-col rounded-xl border border-[#3D3330] bg-[#232120] p-3">
              <MembersOverTimeChart
                activeSnapshot={historySnapshot}
                boardHistory={boardMembers}
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
            <div className="flex w-[312px] shrink-0 flex-col rounded-xl border border-[#3D3330] bg-[#232120] p-3">
              <ChoroplethMap
                members={boardMembersOnly}
                onCountryClick={setSelectedCountryIso}
                selectedIso={selectedCountryIso}
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
          <div className="min-h-0 flex-1 overflow-auto p-4">
            <div className="flex min-w-max flex-col items-center pt-10 pb-8">
              <div className="flex flex-col items-center">
                <div className="w-52 rounded-2xl border border-[#F0684D]/50 bg-[#F0684D]/10 px-3 py-2.5">
                  <div className="mb-1.5 font-semibold text-[#F0684D] text-[9px] uppercase tracking-wider">
                    Lead
                  </div>
                  {(() => {
                    const chair = initialMembers.find(
                      (member) =>
                        member.id === boardMemberFor("Chair")?.memberId
                    );
                    return chair ? (
                      <BoardMemberCard
                        member={chair}
                        onRemove={() =>
                          savePosition("Chair", "").catch(() => undefined)
                        }
                      />
                    ) : (
                      <select
                        aria-label="Add member as Chair"
                        className="w-full rounded-xl border border-[#F0684D]/40 border-dashed bg-[#2A2724] px-2.5 py-2 text-[#C4A882] text-[10px] outline-none focus:border-[#F0684D]"
                        onChange={(event) => {
                          if (event.target.value) {
                            savePosition("Chair", event.target.value).catch(
                              () => undefined
                            );
                          }
                        }}
                        value=""
                      >
                        <option value="">Assign Chair</option>
                        {initialMembers
                          .filter(
                            (member) =>
                              !boardMembers.some(
                                (boardMember) =>
                                  boardMember.memberId === member.id
                              )
                          )
                          .map((member) => (
                            <option key={member.id} value={member.id}>
                              {member.name}
                            </option>
                          ))}
                      </select>
                    );
                  })()}
                </div>
                <div className="h-5 w-px bg-[#3D3330]" />
              </div>
              <div className="relative flex items-start gap-3">
                <div
                  className="absolute top-0 h-px bg-[#3D3330]"
                  style={{
                    left: "calc(50% / 5)",
                    right: "calc(50% / 5)",
                  }}
                />
                {BOARD_POSITIONS.filter((position) => position !== "Chair").map(
                  (position) => {
                    const member = initialMembers.find(
                      (entry) => entry.id === boardMemberFor(position)?.memberId
                    );
                    const availableMembers = initialMembers.filter(
                      (entry) =>
                        !boardMembers.some(
                          (boardMember) => boardMember.memberId === entry.id
                        )
                    );
                    return (
                      <div
                        className="flex flex-col items-center"
                        key={position}
                      >
                        <div className="h-4 w-px bg-[#3D3330]" />
                        <BoardPositionColumn
                          availableMembers={availableMembers}
                          color={
                            [
                              "#4f6ef7",
                              "#10b981",
                              "#8b5cf6",
                              "#f59e0b",
                              "#f43f5e",
                            ][BOARD_POSITIONS.indexOf(position) - 1] ?? "#888"
                          }
                          member={member ?? null}
                          onAssign={(memberId) =>
                            savePosition(position, memberId).catch(
                              () => undefined
                            )
                          }
                          onRemove={() =>
                            savePosition(position, "").catch(() => undefined)
                          }
                          position={position}
                        />
                      </div>
                    );
                  }
                )}
              </div>
            </div>
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
