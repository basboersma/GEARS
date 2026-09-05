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
import { useState } from "react";
import {
  avatarBg,
  DEPARTMENTS,
  FILES,
  formatDate,
  MEMBERS,
  memberIdx,
  parseDate,
} from "./data";
import { MiniCalPicker } from "./MiniCalPicker";
import { Field, Inp, ModalHeader, ModalShell, Sel } from "./shared";
import type {
  CalEvent,
  DiscussionPoint,
  InviteStatus,
  VoteGroup,
} from "./types";

const TYPE_COLOR: Record<CalEvent["type"], string> = {
  event: "#10b981",
  meeting: "#4f6ef7",
};
const STATUS_CLS: Record<InviteStatus, string> = {
  accepted: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
  pending: "bg-amber-500/20  text-amber-400  border-amber-500/40",
  declined: "bg-rose-500/20   text-rose-400   border-rose-500/40",
};

interface Props {
  initial?: CalEvent;
  onSave: (ev: CalEvent) => void;
  onClose: () => void;
}

export function EventFormModal({ initial, onSave, onClose }: Props) {
  const today = formatDate(new Date());
  const blank: CalEvent = {
    id: Date.now().toString(),
    title: "",
    type: "event",
    date: today,
    startTime: "10:00",
    endDate: today,
    endTime: "11:00",
    color: "#10b981",
    description: "",
    location: "",
    invitees: [],
    sendMail: false,
    linkedFiles: [],
    localFiles: [],
    repeat: null,
    discussionPoints: [],
  };
  const [ev, setEv] = useState<CalEvent>(initial ?? blank);
  const [mSearch, setMSearch] = useState("");
  const [showStartCal, setShowStartCal] = useState(false);
  const [showEndCal, setShowEndCal] = useState(false);
  const [activeInvMenu, setActiveInvMenu] = useState<string | null>(null);
  const [dpVoteSearch, setDpVoteSearch] = useState<Record<string, string>>({});
  const [fileSearch, setFileSearch] = useState("");
  const [fileDragActive, setFileDragActive] = useState(false);

  const set = (patch: Partial<CalEvent>) => setEv((p) => ({ ...p, ...patch }));

  // ─ Type
  const changeType = (type: CalEvent["type"]) =>
    set({ type, color: TYPE_COLOR[type] });

  // ─ Invitees
  const addInvitee = (id: string) => {
    if (ev.invitees.find((i) => i.memberId === id)) {
      return;
    }
    set({ invitees: [...ev.invitees, { memberId: id, status: "pending" }] });
  };
  const removeInvitee = (id: string) =>
    set({ invitees: ev.invitees.filter((i) => i.memberId !== id) });
  const setStatus = (id: string, status: InviteStatus) => {
    set({
      invitees: ev.invitees.map((i) =>
        i.memberId === id ? { ...i, status } : i
      ),
    });
    setActiveInvMenu(null);
  };
  const addByDept = (dept: string) => {
    const toAdd = MEMBERS.filter(
      (m) =>
        m.department === dept && !ev.invitees.find((i) => i.memberId === m.id)
    );
    set({
      invitees: [
        ...ev.invitees,
        ...toAdd.map((m) => ({
          memberId: m.id,
          status: "pending" as InviteStatus,
        })),
      ],
    });
  };

  const filteredM = MEMBERS.filter(
    (m) =>
      !ev.invitees.find((i) => i.memberId === m.id) &&
      m.name.toLowerCase().includes(mSearch.toLowerCase())
  );

  // ─ Discussion points
  const addDp = () =>
    set({
      discussionPoints: [
        ...ev.discussionPoints,
        {
          id: Date.now().toString(),
          title: "",
          notes: "",
          votingEnabled: false,
          votes: { for: [], against: [], abstain: [] },
        },
      ],
    });

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setFileDragActive(false);
    Array.from(e.dataTransfer.files).forEach((f) => {
      if (!ev.localFiles.includes(f.name)) {
        set({ localFiles: [...ev.localFiles, f.name] });
      }
    });
  };
  const removeDp = (id: string) =>
    set({ discussionPoints: ev.discussionPoints.filter((d) => d.id !== id) });
  const updateDp = (id: string, patch: Partial<DiscussionPoint>) =>
    set({
      discussionPoints: ev.discussionPoints.map((d) =>
        d.id === id ? { ...d, ...patch } : d
      ),
    });
  const addVote = (dpId: string, mId: string, g: keyof VoteGroup) =>
    set({
      discussionPoints: ev.discussionPoints.map((dp) => {
        if (dp.id !== dpId) {
          return dp;
        }
        const v = {
          for: [...dp.votes.for],
          against: [...dp.votes.against],
          abstain: [...dp.votes.abstain],
        };
        v.for = v.for.filter((x) => x !== mId);
        v.against = v.against.filter((x) => x !== mId);
        v.abstain = v.abstain.filter((x) => x !== mId);
        v[g] = [...v[g], mId];
        return { ...dp, votes: v };
      }),
    });
  const removeVote = (dpId: string, mId: string, g: keyof VoteGroup) =>
    set({
      discussionPoints: ev.discussionPoints.map((dp) =>
        dp.id === dpId
          ? {
              ...dp,
              votes: { ...dp.votes, [g]: dp.votes[g].filter((x) => x !== mId) },
            }
          : dp
      ),
    });

  const fmtDate = (s: string) => {
    if (!s) {
      return "Select date";
    }
    const d = parseDate(s);
    return d.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  return (
    <ModalShell onClose={onClose} width="max-w-2xl">
      <ModalHeader
        onClose={onClose}
        title={initial ? "Edit Event" : "New Event"}
      />

      <div className="flex-1 space-y-5 overflow-auto p-5">
        {/* Type toggle */}
        <div className="flex gap-2">
          {(["event", "meeting"] as const).map((t) => (
            <button
              className={`flex-1 rounded-xl border py-2.5 font-semibold text-sm transition-all ${ev.type === t ? "border-transparent text-white" : "border-[#3D3330] bg-[#232120] text-[#C4A882] hover:text-[#FFEDD1]"}`}
              key={t}
              onClick={() => changeType(t)}
              style={ev.type === t ? { background: TYPE_COLOR[t] } : {}}
            >
              {t === "event" ? "📅 Event" : "🗓 Meeting"}
            </button>
          ))}
        </div>

        {/* Title + Location */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Title">
            <Inp
              onChange={(v) => set({ title: v })}
              placeholder="Title…"
              value={ev.title}
            />
          </Field>
          <Field label="Location">
            <Inp
              onChange={(v) => set({ location: v })}
              placeholder="Room, link…"
              value={ev.location}
            />
          </Field>
        </div>

        <Field label="Description">
          <textarea
            className="w-full resize-none rounded-lg border border-[#3D3330] bg-[#232120] px-3 py-2 text-[#FFEDD1] text-sm placeholder:text-[#7A6555] focus:border-[#F0684D] focus:outline-none"
            onChange={(e) => set({ description: e.target.value })}
            placeholder="Description…"
            rows={2}
            value={ev.description}
          />
        </Field>

        {/* Date / Time picker */}
        <div className="space-y-2.5 rounded-xl border border-[#3D3330] bg-[#232120] p-3">
          <div className="font-semibold text-[#C4A882] text-xs uppercase tracking-wider">
            Date & Time
          </div>
          {/* Starts */}
          <div className="flex items-center gap-2">
            <span className="w-10 shrink-0 text-[#7A6555] text-xs">Starts</span>
            <div className="relative flex-1">
              <button
                className="w-full rounded-lg border border-[#3D3330] bg-white px-3 py-1.5 text-left text-[#FFEDD1] text-sm transition-colors hover:border-[#F0684D]/40"
                onClick={() => {
                  setShowStartCal(!showStartCal);
                  setShowEndCal(false);
                }}
              >
                {fmtDate(ev.date)}
              </button>
              {showStartCal && (
                <MiniCalPicker
                  onChange={(v) => {
                    set({ date: v });
                    setShowStartCal(false);
                  }}
                  onClose={() => setShowStartCal(false)}
                  value={ev.date}
                />
              )}
            </div>
            <input
              className="w-24 rounded-lg border border-[#3D3330] bg-white px-2 py-1.5 text-[#FFEDD1] text-sm focus:border-[#F0684D] focus:outline-none"
              onChange={(e) => set({ startTime: e.target.value })}
              type="time"
              value={ev.startTime}
            />
          </div>
          {/* Ends */}
          <div className="flex items-center gap-2">
            <span className="w-10 shrink-0 text-[#7A6555] text-xs">Ends</span>
            <div className="relative flex-1">
              <button
                className="w-full rounded-lg border border-[#3D3330] bg-white px-3 py-1.5 text-left text-[#FFEDD1] text-sm transition-colors hover:border-[#F0684D]/40"
                onClick={() => {
                  setShowEndCal(!showEndCal);
                  setShowStartCal(false);
                }}
              >
                {fmtDate(ev.endDate)}
              </button>
              {showEndCal && (
                <MiniCalPicker
                  onChange={(v) => {
                    set({ endDate: v });
                    setShowEndCal(false);
                  }}
                  onClose={() => setShowEndCal(false)}
                  value={ev.endDate}
                />
              )}
            </div>
            <input
              className="w-24 rounded-lg border border-[#3D3330] bg-white px-2 py-1.5 text-[#FFEDD1] text-sm focus:border-[#F0684D] focus:outline-none"
              onChange={(e) => set({ endTime: e.target.value })}
              type="time"
              value={ev.endTime}
            />
          </div>
          {/* Repeat */}
          <div className="flex items-center gap-2 pt-0.5">
            <label className="flex cursor-pointer select-none items-center gap-2 text-[#C4A882] text-xs">
              <input
                checked={!!ev.repeat}
                className="accent-[#F0684D]"
                onChange={(e) =>
                  set({
                    repeat: e.target.checked
                      ? { every: 1, unit: "weeks" }
                      : null,
                  })
                }
                type="checkbox"
              />
              Repeat every
            </label>
            {ev.repeat && (
              <>
                <input
                  className="w-14 rounded-lg border border-[#3D3330] bg-white px-2 py-1 text-center text-[#FFEDD1] text-sm focus:border-[#F0684D] focus:outline-none"
                  max={52}
                  min={1}
                  onChange={(e) =>
                    set({
                      repeat: {
                        ...ev.repeat!,
                        every: Math.max(1, Number(e.target.value)),
                      },
                    })
                  }
                  type="number"
                  value={ev.repeat.every}
                />
                <Sel
                  className="w-24"
                  onChange={(v) =>
                    set({
                      repeat: { ...ev.repeat!, unit: v as "days" | "weeks" },
                    })
                  }
                  value={ev.repeat.unit}
                >
                  <option value="days">days</option>
                  <option value="weeks">weeks</option>
                </Sel>
              </>
            )}
          </div>
        </div>

        {/* Invitees */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="font-semibold text-[#C4A882] text-xs uppercase tracking-wider">
              Invitees
            </span>
            <label className="flex cursor-pointer select-none items-center gap-1.5 text-[#C4A882] text-xs">
              <input
                checked={ev.sendMail}
                className="accent-[#F0684D]"
                onChange={(e) => set({ sendMail: e.target.checked })}
                type="checkbox"
              />
              Send mail to invitees
            </label>
          </div>
          {/* Dept bulk-add */}
          <div className="mb-2 flex flex-wrap gap-1.5">
            {DEPARTMENTS.map((dept) => (
              <button
                className="rounded-lg border border-[#3D3330] bg-white px-2 py-0.5 font-medium text-[#C4A882] text-[10px] transition-colors hover:border-[#F0684D]/40 hover:text-[#F0684D]"
                key={dept}
                onClick={() => addByDept(dept)}
              >
                + {dept}
              </button>
            ))}
          </div>
          {/* Search */}
          <div className="relative mb-2">
            <Inp
              onChange={setMSearch}
              placeholder="Search members…"
              value={mSearch}
            />
            {mSearch && filteredM.length > 0 && (
              <div className="absolute top-full right-0 left-0 z-20 mt-0.5 overflow-hidden rounded-xl border border-[#3D3330] bg-[#232120] shadow-xl">
                {filteredM.slice(0, 5).map((m) => (
                  <button
                    className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-[#232120]"
                    key={m.id}
                    onClick={() => {
                      addInvitee(m.id);
                      setMSearch("");
                    }}
                  >
                    <span
                      className={`h-5 w-5 rounded-full ${avatarBg(memberIdx(m.id))} flex shrink-0 items-center justify-center font-bold text-[9px] text-white`}
                    >
                      {m.avatar}
                    </span>
                    <span className="text-[#FFEDD1] text-sm">{m.name}</span>
                    <span className="ml-auto text-[#7A6555] text-xs">
                      {m.department}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Chips */}
          {ev.invitees.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {ev.invitees.map((inv) => {
                const m = MEMBERS.find((x) => x.id === inv.memberId);
                if (!m) {
                  return null;
                }
                const mi = memberIdx(m.id);
                return (
                  <div className="relative" key={inv.memberId}>
                    <div
                      className={`group flex cursor-pointer select-none items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${STATUS_CLS[inv.status]}`}
                      onClick={() =>
                        setActiveInvMenu(
                          activeInvMenu === inv.memberId ? null : inv.memberId
                        )
                      }
                    >
                      <span
                        className={`h-4 w-4 rounded-full ${avatarBg(mi)} flex shrink-0 items-center justify-center font-bold text-[8px] text-white`}
                      >
                        {m.avatar}
                      </span>
                      <span>{m.name.split(" ")[0]}</span>
                      <span className="text-[10px] capitalize opacity-60">
                        ({inv.status})
                      </span>
                      <button
                        className="ml-0.5 opacity-0 transition-opacity hover:text-white group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeInvitee(inv.memberId);
                        }}
                      >
                        ✕
                      </button>
                    </div>
                    {activeInvMenu === inv.memberId && (
                      <div className="absolute top-full left-0 z-30 mt-1 min-w-[7rem] overflow-hidden rounded-xl border border-[#3D3330] bg-[#232120] shadow-xl">
                        {(
                          ["accepted", "pending", "declined"] as InviteStatus[]
                        ).map((s) => (
                          <button
                            className={`w-full px-3 py-2 text-left text-xs capitalize transition-colors hover:bg-[#232120] ${inv.status === s ? "text-[#F0684D]" : "text-[#C4A882]"}`}
                            key={s}
                            onClick={() => setStatus(inv.memberId, s)}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Linked Files */}
        <div>
          <div className="mb-2 font-semibold text-[#C4A882] text-xs uppercase tracking-wider">
            Linked Files
          </div>
          {/* Drag zone */}
          <div
            className={`mb-2 rounded-xl border-2 border-dashed px-3 py-2.5 text-center text-xs transition-colors ${fileDragActive ? "border-[#F0684D] bg-[#F0684D]/10 text-[#F0684D]" : "border-[#3D3330] text-[#7A6555]"}`}
            onDragLeave={() => setFileDragActive(false)}
            onDragOver={(e) => {
              e.preventDefault();
              setFileDragActive(true);
            }}
            onDrop={handleFileDrop}
          >
            📎 Drop files here to attach
          </div>
          {/* Show dropped local files */}
          {ev.localFiles.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {ev.localFiles.map((name, i) => (
                <div
                  className="flex items-center gap-1.5 rounded-full border border-[#3D3330] bg-[#232120] px-2.5 py-1 text-[#FFEDD1] text-xs"
                  key={i}
                >
                  📎 {name}
                  <button
                    className="text-[#7A6555] hover:text-rose-400"
                    onClick={() =>
                      set({
                        localFiles: ev.localFiles.filter((_, j) => j !== i),
                      })
                    }
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
          {/* Drive file search */}
          <input
            className="mb-2 w-full rounded-lg border border-[#3D3330] bg-[#232120] px-3 py-1.5 text-[#FFEDD1] text-xs placeholder:text-[#7A6555] focus:border-[#F0684D] focus:outline-none"
            onChange={(e) => setFileSearch(e.target.value)}
            placeholder="Search Drive files…"
            value={fileSearch}
          />
          <div className="grid max-h-28 grid-cols-2 gap-1 overflow-auto">
            {FILES.filter((f) =>
              f.name.toLowerCase().includes(fileSearch.toLowerCase())
            ).map((f) => (
              <label
                className="group flex cursor-pointer items-center gap-2 py-0.5"
                key={f.id}
              >
                <input
                  checked={ev.linkedFiles.includes(f.id)}
                  className="shrink-0 accent-[#F0684D]"
                  onChange={() =>
                    set({
                      linkedFiles: ev.linkedFiles.includes(f.id)
                        ? ev.linkedFiles.filter((x) => x !== f.id)
                        : [...ev.linkedFiles, f.id],
                    })
                  }
                  type="checkbox"
                />
                <span className="truncate text-[#C4A882] text-xs transition-colors group-hover:text-[#FFEDD1]">
                  {f.name}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Discussion points (meeting only) */}
        {ev.type === "meeting" && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="font-semibold text-[#C4A882] text-xs uppercase tracking-wider">
                Discussion Points
              </span>
              <button
                className="text-[#F0684D] text-xs hover:underline"
                onClick={addDp}
              >
                + Add point
              </button>
            </div>
            <div className="space-y-3">
              {ev.discussionPoints.map((dp, idx) => (
                <div
                  className="space-y-2 rounded-xl border border-[#3D3330] bg-[#232120] p-3"
                  key={dp.id}
                >
                  <div className="flex items-center gap-2">
                    <span className="shrink-0 font-mono text-[#7A6555] text-xs">
                      {idx + 1}.
                    </span>
                    <Inp
                      onChange={(v) => updateDp(dp.id, { title: v })}
                      placeholder="Point title…"
                      value={dp.title}
                    />
                    <button
                      className="shrink-0 text-[#7A6555] transition-colors hover:text-rose-400"
                      onClick={() => removeDp(dp.id)}
                    >
                      ✕
                    </button>
                  </div>
                  <textarea
                    className="w-full resize-none rounded-lg border border-[#3D3330] bg-white px-3 py-2 text-[#FFEDD1] text-sm placeholder:text-[#7A6555] focus:border-[#F0684D] focus:outline-none"
                    onChange={(e) => updateDp(dp.id, { notes: e.target.value })}
                    placeholder="Notes / minutes…"
                    rows={2}
                    value={dp.notes}
                  />
                  {/* Voting */}
                  <div>
                    <label className="mb-1.5 flex cursor-pointer select-none items-center gap-2 font-bold text-[#7A6555] text-[9px] uppercase tracking-wider">
                      <input
                        checked={dp.votingEnabled}
                        className="accent-[#F0684D]"
                        onChange={(e) =>
                          updateDp(dp.id, { votingEnabled: e.target.checked })
                        }
                        type="checkbox"
                      />
                      Enable voting for this point
                    </label>
                    {dp.votingEnabled && (
                      <>
                        <div className="relative mb-2">
                          <Inp
                            onChange={(v) =>
                              setDpVoteSearch((p) => ({ ...p, [dp.id]: v }))
                            }
                            placeholder="Add member to vote…"
                            value={dpVoteSearch[dp.id] ?? ""}
                          />
                          {(dpVoteSearch[dp.id] ?? "") && (
                            <div className="absolute top-full right-0 left-0 z-20 mt-0.5 overflow-hidden rounded-xl border border-[#3D3330] bg-[#232120] shadow-xl">
                              {MEMBERS.filter((m) =>
                                m.name
                                  .toLowerCase()
                                  .includes(
                                    (dpVoteSearch[dp.id] ?? "").toLowerCase()
                                  )
                              )
                                .slice(0, 4)
                                .map((m) => (
                                  <div
                                    className="flex items-center gap-2 border-[#3D3330] border-b px-3 py-2 last:border-0"
                                    key={m.id}
                                  >
                                    <span
                                      className={`h-5 w-5 rounded-full ${avatarBg(memberIdx(m.id))} flex shrink-0 items-center justify-center font-bold text-[9px] text-white`}
                                    >
                                      {m.avatar}
                                    </span>
                                    <span className="flex-1 text-[#FFEDD1] text-xs">
                                      {m.name.split(" ")[0]}
                                    </span>
                                    {(
                                      ["for", "abstain", "against"] as const
                                    ).map((g) => (
                                      <button
                                        className={`rounded border px-2 py-0.5 font-semibold text-[9px] ${g === "for" ? "border-emerald-500/30 bg-emerald-500/20 text-emerald-400" : g === "against" ? "border-rose-500/30 bg-rose-500/20 text-rose-400" : "border-amber-500/30 bg-amber-500/20 text-amber-400"}`}
                                        key={g}
                                        onClick={() => {
                                          addVote(dp.id, m.id, g);
                                          setDpVoteSearch((p) => ({
                                            ...p,
                                            [dp.id]: "",
                                          }));
                                        }}
                                      >
                                        {g}
                                      </button>
                                    ))}
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                          {(["for", "abstain", "against"] as const).map((g) => {
                            const gcls = {
                              for: {
                                bg: "bg-emerald-500/10 border-emerald-500/20",
                                label: "text-emerald-400",
                                name: "text-emerald-300",
                              },
                              abstain: {
                                bg: "bg-amber-500/10 border-amber-500/20",
                                label: "text-amber-400",
                                name: "text-amber-300",
                              },
                              against: {
                                bg: "bg-rose-500/10 border-rose-500/20",
                                label: "text-rose-400",
                                name: "text-rose-300",
                              },
                            }[g];
                            return (
                              <div
                                className={`rounded-lg border p-2 ${gcls.bg}`}
                                key={g}
                              >
                                <div
                                  className={`mb-1 font-bold text-[9px] uppercase ${gcls.label}`}
                                >
                                  {g} ({dp.votes[g].length})
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {dp.votes[g].map((id) => {
                                    const m = MEMBERS.find((x) => x.id === id);
                                    if (!m) {
                                      return null;
                                    }
                                    return (
                                      <span
                                        className={`flex items-center gap-0.5 text-[9px] ${gcls.name}`}
                                        key={id}
                                      >
                                        {m.name.split(" ")[0]}
                                        <button
                                          className="text-[#7A6555] hover:text-rose-400"
                                          onClick={() =>
                                            removeVote(dp.id, id, g)
                                          }
                                        >
                                          ✕
                                        </button>
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex shrink-0 gap-2 border-[#3D3330] border-t px-5 py-4">
        <button
          className="flex-1 rounded-xl border border-[#3D3330] bg-[#232120] py-2 font-medium text-[#FFEDD1] text-sm transition-colors hover:bg-[#2E2B2A]"
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          className="flex-1 rounded-xl bg-[#F0684D] py-2 font-medium text-sm text-white transition-colors hover:bg-[#E05538]"
          onClick={() => {
            if (ev.title.trim()) {
              onSave(ev);
            }
          }}
        >
          {initial ? "Save changes" : "Create"}
        </button>
      </div>
    </ModalShell>
  );
}
