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
import { useRef, useState } from "react";
import { avatarBg, DEPARTMENTS, MEMBERS, memberIdx } from "./data";
import { Inp, ModalHeader, ModalShell } from "./shared";
import type { Member } from "./types";

// ─── Sub-modals ───────────────────────────────────────────────────────────────

function StrikeModal({
  member,
  onClose,
}: {
  member: Member;
  onClose: () => void;
}) {
  const [comment, setComment] = useState("");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm animate-slide-up rounded-2xl border border-[#3D3330] bg-[#2A2724] p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-[#FFEDD1]">Issue Strike</h3>
            <p className="text-[#7A6555] text-xs">{member.name}</p>
          </div>
          <button
            className="text-[#C4A882] hover:text-[#FFEDD1]"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-[#C4A882] text-xs">Comment</label>
            <textarea
              className="w-full resize-none rounded-lg border border-[#3D3330] bg-[#232120] px-3 py-2 text-[#FFEDD1] text-sm placeholder:text-[#7A6555] focus:border-[#F0684D] focus:outline-none"
              onChange={(e) => setComment(e.target.value)}
              placeholder="Reason for strike…"
              rows={3}
              value={comment}
            />
          </div>
          <div>
            <label className="mb-1 block text-[#C4A882] text-xs">
              Attach file (optional)
            </label>
            <div
              className={`cursor-pointer rounded-xl border-2 border-dashed px-3 py-3 text-center transition-colors ${dragOver ? "border-[#F0684D] bg-[#F0684D]/8" : "border-[#3D3330] hover:border-[#7A6555]"}`}
              onClick={() => fileInputRef.current?.click()}
              onDragLeave={() => setDragOver(false)}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const f = e.dataTransfer.files[0];
                if (f) {
                  setAttachedFile(f);
                }
              }}
            >
              <input
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    setAttachedFile(e.target.files[0]);
                  }
                }}
                ref={fileInputRef}
                type="file"
              />
              {attachedFile ? (
                <div className="flex items-center justify-center gap-2">
                  <span className="max-w-[180px] truncate text-[#FFEDD1] text-xs">
                    {attachedFile.name}
                  </span>
                  <button
                    className="text-[#7A6555] text-xs hover:text-[#F0684D]"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAttachedFile(null);
                    }}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <span className="text-[#7A6555] text-[10px]">
                  Drop file or click to browse
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            className="flex-1 rounded-xl border border-[#3D3330] bg-[#232120] py-2 text-[#FFEDD1] text-sm transition-colors hover:bg-[#2E2B2A]"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="flex-1 rounded-xl bg-rose-600 py-2 font-medium text-sm text-white transition-colors hover:bg-rose-700"
            onClick={onClose}
          >
            Issue Strike
          </button>
        </div>
      </div>
    </div>
  );
}

function RemoveModal({
  member,
  onClose,
}: {
  member: Member;
  onClose: () => void;
}) {
  const [pw, setPw] = useState("");
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xs animate-slide-up rounded-2xl border border-[#3D3330] bg-white p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4">
          <h3 className="font-semibold text-[#FFEDD1]">Remove Member</h3>
          <p className="mt-0.5 text-[#7A6555] text-xs">
            This action cannot be undone. Enter your password to confirm.
          </p>
        </div>
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3">
          <span
            className={`h-9 w-9 rounded-full ${avatarBg(memberIdx(member.id))} flex shrink-0 items-center justify-center font-bold text-sm text-white`}
          >
            {member.avatar}
          </span>
          <div>
            <div className="font-medium text-[#FFEDD1] text-sm">
              {member.name}
            </div>
            <div className="text-[#7A6555] text-xs">
              {member.team} · {member.role}
            </div>
          </div>
        </div>
        <Inp
          className="mb-3"
          onChange={setPw}
          placeholder="Enter password…"
          type="password"
          value={pw}
        />
        <div className="flex gap-2">
          <button
            className="flex-1 rounded-xl border border-[#3D3330] bg-[#232120] py-2 text-[#FFEDD1] text-sm transition-colors hover:bg-[#2E2B2A]"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="flex-1 rounded-xl bg-rose-600 py-2 font-medium text-sm text-white transition-colors hover:bg-rose-700"
            onClick={onClose}
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Invite Members tab ───────────────────────────────────────────────────────

type InviteState = Record<string, "invite" | "pending" | "declined">;

function InviteTab({ currentTeam }: { currentTeam: string }) {
  const [q, setQ] = useState("");
  const [states, setStates] = useState<InviteState>({});
  const [hovered, setHovered] = useState<string | null>(null);

  const outside = MEMBERS.filter(
    (m) =>
      m.team !== currentTeam && m.name.toLowerCase().includes(q.toLowerCase())
  );

  const statusCls = (s?: InviteState[string]) => {
    if (!s || s === "invite") {
      return "bg-[#F0684D]/20 text-[#F0684D] border-[#F0684D]/40";
    }
    if (s === "pending") {
      return "bg-amber-500/20 text-amber-400 border-amber-500/40";
    }
    return "bg-rose-500/20 text-rose-400 border-rose-500/40";
  };

  const invite = (id: string) => setStates((p) => ({ ...p, [id]: "pending" }));

  return (
    <div className="flex h-full flex-col">
      <Inp
        className="mb-3"
        onChange={setQ}
        placeholder="Search members outside your team…"
        value={q}
      />
      <div className="min-h-0 flex-1 space-y-1.5 overflow-auto">
        {outside.map((m, _i) => {
          const st = states[m.id];
          const isDeclined = st === "declined";
          const isHovered = hovered === m.id;
          return (
            <div
              className="flex items-center gap-3 rounded-xl border border-[#3D3330] bg-[#232120] p-3"
              key={m.id}
            >
              <div
                className={`h-9 w-9 rounded-full ${avatarBg(MEMBERS.indexOf(m))} flex shrink-0 items-center justify-center font-bold text-sm text-white`}
              >
                {m.avatar}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium text-[#FFEDD1] text-sm">
                  {m.name}
                </div>
                <div className="text-[#7A6555] text-xs">
                  {m.team} · {m.role}
                </div>
              </div>
              <button
                className={`rounded-lg border px-3 py-1.5 font-semibold text-xs transition-all ${
                  isDeclined && isHovered
                    ? "border-[#F0684D]/40 bg-[#F0684D]/20 text-[#F0684D]"
                    : statusCls(st)
                }`}
                onClick={() => {
                  if (!st || st === "invite" || isDeclined) {
                    invite(m.id);
                  } else if (st === "pending") {
                    setStates((p) => ({ ...p, [m.id]: "declined" }));
                  }
                }}
                onMouseEnter={() => setHovered(m.id)}
                onMouseLeave={() => setHovered(null)}
              >
                {isDeclined && isHovered
                  ? "Invite"
                  : st
                    ? {
                        invite: "Invite",
                        pending: "Pending",
                        declined: "Declined",
                      }[st]
                    : "Invite"}
              </button>
            </div>
          );
        })}
        {outside.length === 0 && (
          <div className="py-8 text-center text-[#7A6555] text-sm">
            No members found outside your team
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Manage Members tab ───────────────────────────────────────────────────────

function ManageTab({ currentTeam }: { currentTeam: string }) {
  const [q, setQ] = useState("");
  const [strikeTarget, setStrikeTarget] = useState<Member | null>(null);
  const [removeTarget, setRemoveTarget] = useState<Member | null>(null);
  const [depts, setDepts] = useState<Record<string, string>>({});

  const team = MEMBERS.filter(
    (m) =>
      m.team === currentTeam && m.name.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="flex h-full flex-col">
      <Inp
        className="mb-3"
        onChange={setQ}
        placeholder="Search team members…"
        value={q}
      />
      <div className="min-h-0 flex-1 space-y-2 overflow-auto">
        {team.map((m, _i) => (
          <div
            className="space-y-2.5 rounded-xl border border-[#3D3330] bg-[#232120] p-3"
            key={m.id}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`h-9 w-9 rounded-full ${avatarBg(MEMBERS.indexOf(m))} relative flex shrink-0 items-center justify-center font-bold text-sm text-white`}
              >
                {m.avatar}
                {m.isSubLead && (
                  <span className="absolute -right-0.5 -bottom-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-[#252d3d] bg-amber-400 font-bold text-[7px] text-black">
                    ★
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 font-medium text-[#FFEDD1] text-sm">
                  {m.name}
                  {m.strikes > 0 && (
                    <span className="font-semibold text-[10px] text-rose-400">
                      ⚡{m.strikes}
                    </span>
                  )}
                </div>
                <div className="text-[#7A6555] text-xs">{m.role}</div>
              </div>
              <span
                className={`h-2 w-2 rounded-full ${m.status === "active" ? "bg-emerald-400" : "bg-[#4a5568]"}`}
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {/* Department */}
              <select
                className="cursor-pointer rounded-lg border border-[#3D3330] bg-white px-2 py-1 text-[#C4A882] text-[10px] transition-colors focus:border-[#F0684D] focus:outline-none"
                onChange={(e) =>
                  setDepts((p) => ({ ...p, [m.id]: e.target.value }))
                }
                value={depts[m.id] ?? m.department}
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              {/* Sub-lead */}
              <button className="rounded-lg border border-amber-500/30 bg-amber-500/20 px-2.5 py-1 font-medium text-[10px] text-amber-400 transition-colors hover:bg-amber-500/30">
                {m.isSubLead ? "★ Sub-lead" : "Make sub-lead"}
              </button>
              {/* Strike */}
              <button
                className="rounded-lg border border-orange-500/30 bg-orange-500/20 px-2.5 py-1 font-medium text-[10px] text-orange-400 transition-colors hover:bg-orange-500/30"
                onClick={() => setStrikeTarget(m)}
              >
                ⚡ Strike
              </button>
              {/* Remove */}
              <button
                className="rounded-lg border border-rose-500/30 bg-rose-500/20 px-2.5 py-1 font-medium text-[10px] text-rose-400 transition-colors hover:bg-rose-500/30"
                onClick={() => setRemoveTarget(m)}
              >
                🗑 Remove
              </button>
            </div>
          </div>
        ))}
        {team.length === 0 && (
          <div className="py-8 text-center text-[#7A6555] text-sm">
            No members found
          </div>
        )}
      </div>
      {strikeTarget && (
        <StrikeModal
          member={strikeTarget}
          onClose={() => setStrikeTarget(null)}
        />
      )}
      {removeTarget && (
        <RemoveModal
          member={removeTarget}
          onClose={() => setRemoveTarget(null)}
        />
      )}
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export function MembersModal({
  currentTeam,
  onClose,
}: {
  currentTeam: string;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"invite" | "manage">("invite");

  return (
    <ModalShell onClose={onClose} width="max-w-lg">
      <ModalHeader
        onClose={onClose}
        sub={`Current team: ${currentTeam}`}
        title="Members"
      />
      {/* Tab toggle */}
      <div className="flex shrink-0 gap-1.5 p-4 pb-0">
        <button
          className={`flex-1 rounded-xl border py-2.5 font-semibold text-sm transition-all ${tab === "invite" ? "border-[#F0684D] bg-[#F0684D] text-white" : "border-[#3D3330] bg-[#232120] text-[#C4A882] hover:text-[#FFEDD1]"}`}
          onClick={() => setTab("invite")}
        >
          Invite Members
        </button>
        <button
          className={`flex-1 rounded-xl border py-2.5 font-semibold text-sm transition-all ${tab === "manage" ? "border-[#F0684D] bg-[#F0684D] text-white" : "border-[#3D3330] bg-[#232120] text-[#C4A882] hover:text-[#FFEDD1]"}`}
          onClick={() => setTab("manage")}
        >
          Manage Members
        </button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4">
        {tab === "invite" ? (
          <InviteTab currentTeam={currentTeam} />
        ) : (
          <ManageTab currentTeam={currentTeam} />
        )}
      </div>
    </ModalShell>
  );
}
