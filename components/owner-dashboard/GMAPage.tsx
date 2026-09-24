// biome-ignore-all assist/source/useSortedAttributes: Preserves the imported GMA dashboard JSX attribute order.
// biome-ignore-all lint: Preserves the imported GMA dashboard interaction and formatting conventions.
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BitJsonQrCode } from "./BitJsonQrCode";
import { useDashboardData } from "./dashboard-data-context";

// ── Types ──────────────────────────────────────────────────────────────────────
interface Motion {
  id: string;
  title: string;
  author: string;
  text: string;
  signaturesNeeded: number;
  signaturesGot: number;
  remainingSeconds?: number;
  timerPaused?: boolean;
}

interface PendingMotion {
  id: string;
  title: string;
  author: string;
  text: string;
}

interface SuggestedMotion {
  id: string;
  title: string;
  author: string;
  text: string;
  timeLeft: string;
  urgent: boolean;
  votesFor: number;
  votesAgainst: number;
  votesAbstain?: number;
  votesTotal?: number;
  currentUserVote?: VoteStatus | null;
}

type VoteStatus = "infavour" | "against" | "abstain" | "notvoted";
interface SeatMember {
  id: string;
  name: string;
  status: VoteStatus;
}

const SEAT_NAMES = [
  "Liam B.",
  "Sophie J.",
  "Emma V.",
  "Daan M.",
  "Noah S.",
  "Alex B.",
  "Sara K.",
  "Tim H.",
  "Julia P.",
  "Mark R.",
  "Anna W.",
  "Finn D.",
  "Lisa O.",
  "Kees V.",
  "Mia H.",
  "Bob A.",
  "Eva C.",
  "Tom F.",
  "Nora G.",
  "Lars N.",
  "Iris L.",
  "Sam B.",
  "Fien V.",
  "Joep K.",
  "Roos T.",
  "Pieter D.",
  "Amber S.",
  "Luuk J.",
  "Fleur M.",
  "Stef N.",
  "Merel O.",
  "Bram P.",
  "Inge Q.",
  "Cas R.",
  "Lotte S.",
  "Rick T.",
  "Vera U.",
  "Dirk V.",
  "Nina W.",
  "Thijs X.",
  "Hanna Y.",
  "Wout Z.",
  "Silke A.",
  "Jasper B.",
  "Tessa C.",
  "Ruben D.",
  "Eline E.",
  "Marcel F.",
  "Kim G.",
];

const INIT_STATUSES: VoteStatus[] = [
  "infavour",
  "infavour",
  "infavour",
  "infavour",
  "infavour",
  "infavour",
  "infavour",
  "infavour",
  "infavour",
  "infavour",
  "infavour",
  "infavour",
  "infavour",
  "infavour",
  "infavour",
  "infavour",
  "infavour",
  "infavour",
  "infavour",
  "infavour",
  "infavour",
  "infavour",
  "against",
  "against",
  "against",
  "against",
  "against",
  "against",
  "against",
  "against",
  "abstain",
  "abstain",
  "abstain",
  "abstain",
  "abstain",
  "notvoted",
  "notvoted",
  "notvoted",
  "notvoted",
  "notvoted",
  "notvoted",
  "notvoted",
  "notvoted",
  "notvoted",
  "notvoted",
  "notvoted",
  "notvoted",
  "notvoted",
  "notvoted",
];

const INIT_SEATS: SeatMember[] = SEAT_NAMES.map((name, i) => ({
  id: `seat-${i}`,
  name,
  status: INIT_STATUSES[i] ?? "notvoted",
}));

const VOTE_COLOR: Record<VoteStatus, string> = {
  infavour: "#10b981",
  against: "#F0684D",
  abstain: "#FFD142",
  notvoted: "#3D3330",
};

// ── Senate hemicycle chart ────────────────────────────────────────────────────
function SenateChart({ seats }: { seats: SeatMember[] }) {
  const [hovered, setHovered] = useState<string | null>(null);

  const cx = 290,
    cy = 258;
  const rowCounts = [4, 8, 11, 13, 13];
  const radii = [88, 120, 152, 183, 212];
  const angleMin = 28 * (Math.PI / 180);
  const angleMax = 152 * (Math.PI / 180);
  const seatR = 11;

  // Compute raw positions
  type Pos = { x: number; y: number };
  const positions: Pos[] = [];
  rowCounts.forEach((count, ri) => {
    const r = radii[ri];
    for (let si = 0; si < count; si++) {
      const t = count === 1 ? 0.5 : si / (count - 1);
      const angle = angleMin + t * (angleMax - angleMin);
      positions.push({
        x: cx + r * Math.cos(angle),
        y: cy - r * Math.sin(angle),
      });
    }
  });

  // Sort positions left→right (ascending x). Left = in favour, middle = abstain, right = against, far right = not voted.
  const sortedPos = [...positions].sort((a, b) => a.x - b.x);

  // Sort seats: infavour first, abstain second, against third, notvoted last — so colour groups map to spatial groups.
  const statusOrder: Record<VoteStatus, number> = {
    infavour: 0,
    abstain: 1,
    against: 2,
    notvoted: 3,
  };
  const sortedSeats = [...seats].sort(
    (a, b) => statusOrder[a.status] - statusOrder[b.status]
  );

  const dots = sortedPos.map((pos, i) => ({
    ...pos,
    member: sortedSeats[i] ?? {
      id: `x${i}`,
      name: "—",
      status: "notvoted" as VoteStatus,
    },
  }));

  return (
    <div className="relative w-full h-full">
      <svg
        viewBox="0 0 580 242"
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
        style={{ overflow: "visible" }}
      >
        {dots.map(({ x, y, member }) => {
          const isHov = hovered === member.id;
          const col = VOTE_COLOR[member.status];
          return (
            <g
              key={member.id}
              onMouseEnter={() => setHovered(member.id)}
              onMouseLeave={() => setHovered(null)}
            >
              <circle
                cx={x}
                cy={y}
                r={seatR + (isHov ? 3 : 0)}
                fill={col === "#3D3330" ? "#232120" : col + "22"}
                stroke={col}
                strokeWidth={isHov ? 2 : 1.5}
                style={{ transition: "all 0.15s" }}
              />
              {isHov && (
                <text
                  x={x}
                  y={y - seatR - 6}
                  textAnchor="middle"
                  fontSize="8"
                  fill="#FFEDD1"
                  fontFamily="monospace"
                >
                  {member.name}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── Active Vote Page (sub-view) ───────────────────────────────────────────────
function ActiveVotePage({
  motion,
  onBack,
  onAction,
  onVote,
}: {
  motion: Motion;
  onBack: () => void;
  onAction: (
    action: "start" | "pause" | "add-time" | "remove-time" | "end"
  ) => void;
  onVote: (status: VoteStatus) => void;
}) {
  const [seats, setSeats] = useState<SeatMember[]>(INIT_SEATS);
  const [timerSec, setTimerSec] = useState(motion.remainingSeconds ?? 300);
  const [running, setRunning] = useState(!motion.timerPaused);
  const [adminVote, setAdminVote] = useState<VoteStatus | null>(null);
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    setTimerSec(motion.remainingSeconds ?? 300);
    setRunning(!motion.timerPaused);
  }, [motion.remainingSeconds, motion.timerPaused]);

  useEffect(() => {
    if (!running || timerSec <= 0) return;
    const interval = window.setInterval(
      () => setTimerSec((seconds) => Math.max(0, seconds - 1)),
      1000
    );
    return () => window.clearInterval(interval);
  }, [running, timerSec]);

  const castVote = (status: VoteStatus) => {
    setAdminVote(status);
    onVote(status);
    // update seat-0 to reflect admin's vote
    setSeats((prev) => prev.map((s, i) => (i === 0 ? { ...s, status } : s)));
  };

  const displaySeats = seats;
  const inFavour = displaySeats.filter((s) => s.status === "infavour").length;
  const against = displaySeats.filter((s) => s.status === "against").length;
  const abstain = displaySeats.filter((s) => s.status === "abstain").length;
  const total = displaySeats.length;

  const mm = String(Math.floor(timerSec / 60)).padStart(2, "0");
  const ss = String(timerSec % 60).padStart(2, "0");

  const VOTE_CATS = [
    {
      status: "infavour" as VoteStatus,
      label: "In favour",
      color: "#10b981",
      count: inFavour,
    },
    {
      status: "abstain" as VoteStatus,
      label: "Abstain",
      color: "#FFD142",
      count: abstain,
    },
    {
      status: "against" as VoteStatus,
      label: "Against",
      color: "#F0684D",
      count: against,
    },
  ];

  if (ended) {
    return (
      <div className="flex flex-col flex-1 min-h-0 items-center justify-center gap-6">
        <div className="text-center">
          <p className="font-mono text-[0.6rem] text-[#F0684D] uppercase tracking-[0.22em] mb-1">
            Vote ended
          </p>
          <h1 className="text-2xl font-bold text-[#FFEDD1] mb-3">
            "{motion.title}"
          </h1>
          <div className="flex gap-8 justify-center mb-4">
            {VOTE_CATS.map(({ label, color, count }) => (
              <div key={label} className="text-center">
                <p
                  className="text-[10px] font-semibold uppercase tracking-widest"
                  style={{ color }}
                >
                  {label}
                </p>
                <p className="text-3xl font-bold font-mono" style={{ color }}>
                  {count}
                </p>
                <p className="text-[10px] text-[#7A6555]">
                  {Math.round((count / total) * 100)}%
                </p>
              </div>
            ))}
          </div>
          <p className="text-xs text-[#9C8272]">
            {inFavour > against ? "✓ Motion passed" : "✗ Motion did not pass"}
          </p>
        </div>
        <button
          onClick={onBack}
          className="px-6 py-2.5 rounded-xl border border-[#3D3330] text-xs text-[#9C8272] hover:text-[#FFEDD1] transition-colors"
        >
          Back to GMA Board
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-3">
      {/* Header row */}
      <div className="shrink-0 flex items-start justify-between gap-4">
        <div>
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-[10px] text-[#9C8272] hover:text-[#FFEDD1] transition-colors mb-2"
          >
            <svg
              viewBox="0 0 12 12"
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M7.5 2L3.5 6l4 4" />
            </svg>
            Back to GMA Board
          </button>
          <p className="font-mono text-[0.6rem] text-[#F0684D] uppercase tracking-[0.22em]">
            General Members Assembly
          </p>
          <h1 className="text-lg font-semibold text-[#FFEDD1] tracking-tight mt-0.5">
            Active Vote
          </h1>
        </div>

        {/* Timer + controls */}
        <div className="shrink-0 flex flex-col items-end gap-2">
          <p className="text-3xl font-mono font-bold text-[#FFEDD1] tracking-tight">
            {mm}:{ss}
          </p>
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            <button
              onClick={() => {
                setTimerSec((s) => s + 30);
                onAction("add-time");
              }}
              className="h-8 px-3 rounded-lg border border-[#3D3330] bg-[#232120] text-[#9C8272] hover:text-[#FFEDD1] hover:border-[#4A3F38] text-[11px] font-medium transition-colors whitespace-nowrap"
            >
              Add more time
            </button>
            <button
              onClick={() => {
                const nextRunning = !running;
                setRunning(nextRunning);
                onAction(nextRunning ? "start" : "pause");
              }}
              className="h-8 px-3 rounded-lg border border-[#3D3330] bg-[#232120] text-[#9C8272] hover:text-[#FFEDD1] hover:border-[#4A3F38] text-[11px] font-medium transition-colors whitespace-nowrap"
            >
              {running ? "Pause" : "Continue"}
            </button>
            <button
              onClick={() => {
                setTimerSec((s) => Math.max(0, s - 30));
                onAction("remove-time");
              }}
              className="h-8 px-3 rounded-lg border border-[#3D3330] bg-[#232120] text-[#9C8272] hover:text-[#FFEDD1] hover:border-[#4A3F38] text-[11px] font-medium transition-colors whitespace-nowrap"
            >
              Remove time
            </button>
            <button
              onClick={() => {
                setEnded(true);
                onAction("end");
              }}
              className="h-8 px-3 rounded-lg border border-[#F0684D]/40 bg-[#F0684D]/10 text-[#F0684D] text-[11px] font-semibold hover:bg-[#F0684D]/20 transition-colors whitespace-nowrap"
            >
              End Vote
            </button>
          </div>
        </div>
      </div>

      {/* Seating chart + stats */}
      <div className="flex-1 min-h-0 rounded-2xl border border-[#3D3330] bg-[#232120] p-4 flex flex-col gap-3">
        {/* Stats + vote buttons row */}
        <div className="flex justify-center gap-4 shrink-0 flex-wrap">
          {/* Vote In Favour — primary action button */}
          {(() => {
            const chosen = adminVote === "infavour";
            return (
              <button
                onClick={() => castVote("infavour")}
                className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl border font-semibold transition-all ${chosen ? "border-[#10b981] bg-[#10b981]/20" : "border-[#10b981]/50 bg-[#10b981]/10 hover:bg-[#10b981]/20"}`}
                style={{ color: "#10b981" }}
              >
                <svg
                  viewBox="0 0 16 16"
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="M3 8.5l3 3 7-7" />
                </svg>
                <span className="text-xs">Vote In Favour</span>
                <span className="font-mono text-lg font-bold leading-none">
                  {inFavour}
                </span>
              </button>
            );
          })()}

          {/* Abstain */}
          {(() => {
            const chosen = adminVote === "abstain";
            return (
              <button
                onClick={() => castVote("abstain")}
                className={`text-center px-5 py-2 rounded-xl border transition-all ${chosen ? "border-[#FFD142] bg-[#FFD142]/20" : "border-[#3D3330] hover:border-[#4A3F38]"}`}
                style={{ color: "#FFD142" }}
              >
                <p className="text-[10px] font-semibold uppercase tracking-widest">
                  Abstain
                </p>
                <p className="text-2xl font-bold font-mono">{abstain}</p>
                <p className="text-[9px] text-[#7A6555]">Vote Abstain</p>
              </button>
            );
          })()}

          {/* Against */}
          {(() => {
            const chosen = adminVote === "against";
            return (
              <button
                onClick={() => castVote("against")}
                className={`text-center px-5 py-2 rounded-xl border transition-all ${chosen ? "border-[#F0684D] bg-[#F0684D]/20" : "border-[#3D3330] hover:border-[#4A3F38]"}`}
                style={{ color: "#F0684D" }}
              >
                <p className="text-[10px] font-semibold uppercase tracking-widest">
                  Against
                </p>
                <p className="text-2xl font-bold font-mono">{against}</p>
                <p className="text-[9px] text-[#7A6555]">Vote Against</p>
              </button>
            );
          })()}
        </div>

        {/* Chart — fills remaining space */}
        <div className="flex-1 min-h-0">
          <SenateChart seats={displaySeats} />
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-6 shrink-0">
          {(["infavour", "abstain", "against", "notvoted"] as VoteStatus[]).map(
            (status) => {
              const labels: Record<VoteStatus, string> = {
                infavour: "In favour",
                abstain: "Abstain",
                against: "Against",
                notvoted: "Not voted",
              };
              return (
                <div key={status} className="flex items-center gap-1.5">
                  <span
                    className="w-3 h-3 rounded-full border shrink-0"
                    style={{
                      background:
                        status === "notvoted" ? "#232120" : VOTE_COLOR[status],
                      borderColor: VOTE_COLOR[status],
                    }}
                  />
                  <span className="text-[10px] text-[#9C8272]">
                    {labels[status]}
                  </span>
                </div>
              );
            }
          )}
        </div>
      </div>
    </div>
  );
}

// ── Pending motion popup ───────────────────────────────────────────────────────
function PendingMotionPopup({
  motion,
  onClose,
  onPushToActive,
}: {
  motion: PendingMotion;
  onClose: () => void;
  onPushToActive: (m: PendingMotion) => void;
}) {
  const [pushed, setPushed] = useState(false);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#232120] rounded-2xl border border-[#3D3330] shadow-2xl p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#FFD142]/10 border border-[#FFD142]/20 flex items-center justify-center shrink-0">
              <svg
                viewBox="0 0 16 16"
                className="w-3.5 h-3.5 text-[#FFD142]"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <rect x="2" y="2" width="12" height="12" rx="2" />
                <path d="M5 8h6M5 5.5h4M5 10.5h3" />
              </svg>
            </div>
            <span className="text-[10px] font-semibold text-[#FFD142] uppercase tracking-widest">
              Pending motion
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-[#7A6555] hover:text-[#FFEDD1] transition-colors shrink-0"
          >
            ✕
          </button>
        </div>

        <h3 className="text-sm font-semibold text-[#FFEDD1] mb-1">
          "{motion.title}"
        </h3>
        <p className="text-[11px] text-[#7A6555] mb-4">by {motion.author}</p>
        <p className="text-xs text-[#9C8272] leading-relaxed mb-5">
          {motion.text}
        </p>

        {pushed ? (
          <div className="rounded-xl border border-[#10b981]/30 bg-[#10b981]/8 p-3 text-center">
            <p className="text-sm text-[#10b981] font-semibold">
              ✓ Pushed to Active Vote
            </p>
          </div>
        ) : (
          <div className="flex gap-2 pt-4 border-t border-[#3D3330]">
            <button
              onClick={onClose}
              className="flex-1 py-2 rounded-xl text-xs border border-[#3D3330] text-[#9C8272] hover:text-[#FFEDD1] hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setPushed(true);
                onPushToActive(motion);
              }}
              className="flex-1 py-2 rounded-xl text-xs font-semibold border border-[#10b981]/40 bg-[#10b981]/10 text-[#10b981] hover:bg-[#10b981]/20 transition-colors"
            >
              Push to Active Vote
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Suggested motion detail popup ─────────────────────────────────────────────
function SuggestedMotionPopup({
  motion,
  onClose,
  onVote,
}: {
  motion: SuggestedMotion;
  onClose: () => void;
  onVote: (value: "for" | "against" | "abstain") => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#232120] rounded-2xl border border-[#3D3330] shadow-2xl p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 flex items-center justify-center shrink-0">
              <svg
                viewBox="0 0 16 16"
                className="w-3.5 h-3.5 text-[#8b5cf6]"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M8 2v1M8 13v1M2 8h1M13 8h1M4.2 4.2l.7.7M11.1 11.1l.7.7M4.2 11.8l.7-.7M11.1 4.9l.7-.7" />
                <circle cx="8" cy="8" r="3" />
              </svg>
            </div>
            <span className="text-[10px] font-semibold text-[#8b5cf6] uppercase tracking-widest">
              Suggested motion
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-[#7A6555] hover:text-[#FFEDD1] transition-colors shrink-0"
          >
            ✕
          </button>
        </div>
        <h3 className="text-sm font-semibold text-[#FFEDD1] mb-1">
          "{motion.title}"
        </h3>
        <p className="text-[11px] text-[#7A6555] mb-4">by {motion.author}</p>
        <p className="text-xs text-[#9C8272] leading-relaxed mb-5">
          {motion.text}
        </p>
        <div className="border-t border-[#3D3330] pt-4">
          <div className="mb-3 flex items-center justify-between text-[10px] text-[#9C8272]">
            <span>{motion.votesTotal ?? 0} votes cast</span>
            <span>30% of present members moves it to pending</span>
          </div>
          <div className="flex gap-2">
            {(["for", "abstain", "against"] as const).map((value) => (
              <button
                key={value}
                onClick={() => onVote(value)}
                className="flex-1 rounded-xl border border-[#3D3330] px-2 py-2 text-[10px] font-semibold text-[#FFEDD1] hover:border-[#8b5cf6]/50 transition-colors"
              >
                {value === "for"
                  ? "In favour"
                  : value[0].toUpperCase() + value.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Add motion popup ───────────────────────────────────────────────────────────
function AddMotionPopup({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (title: string, author: string, text: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("Admin user");
  const [text, setText] = useState("");
  const fieldCls =
    "w-full rounded-lg bg-[#1A1919] border border-[#3D3330] px-3 py-2 text-xs text-[#FFEDD1] placeholder:text-[#4A3F38] focus:outline-none focus:border-[#4A3F38] transition-colors";
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#232120] rounded-2xl border border-[#3D3330] shadow-2xl p-5 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-[#FFEDD1]">
            Suggest a Motion
          </h3>
          <button
            onClick={onClose}
            className="text-[#7A6555] hover:text-[#FFEDD1] transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="space-y-3">
          <label className="flex flex-col gap-1">
            <span className="font-mono text-[8.5px] text-[#7A6555] uppercase tracking-widest">
              Motion title
            </span>
            <input
              className={fieldCls}
              placeholder="e.g. Increase workshop hours"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-mono text-[8.5px] text-[#7A6555] uppercase tracking-widest">
              Author
            </span>
            <input
              className={fieldCls}
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-mono text-[8.5px] text-[#7A6555] uppercase tracking-widest">
              Motion text
            </span>
            <textarea
              className={`${fieldCls} resize-none`}
              rows={3}
              placeholder="Describe the motion…"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </label>
        </div>
        <div className="flex gap-2 mt-4">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-xl text-sm border border-[#3D3330] text-[#9C8272] hover:text-[#FFEDD1] transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={!title}
            onClick={() => {
              if (title) {
                onAdd(title, author, text);
                onClose();
              }
            }}
            className="flex-1 py-2 rounded-xl text-sm font-semibold border border-[#F0684D]/40 bg-[#F0684D]/8 text-[#F0684D] hover:bg-[#F0684D]/15 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Add pending vote popup ─────────────────────────────────────────────────────
function AddVotePopup({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (title: string, author: string, text: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("Admin user");
  const [text, setText] = useState("");
  const fieldCls =
    "w-full rounded-lg bg-[#1A1919] border border-[#3D3330] px-3 py-2 text-xs text-[#FFEDD1] placeholder:text-[#4A3F38] focus:outline-none focus:border-[#4A3F38] transition-colors";
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#232120] rounded-2xl border border-[#3D3330] shadow-2xl p-5 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-[#FFEDD1]">
            Add Pending Vote
          </h3>
          <button
            onClick={onClose}
            className="text-[#7A6555] hover:text-[#FFEDD1] transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="space-y-3">
          <label className="flex flex-col gap-1">
            <span className="font-mono text-[8.5px] text-[#7A6555] uppercase tracking-widest">
              Motion title
            </span>
            <input
              className={fieldCls}
              placeholder="e.g. Increase workshop hours"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-mono text-[8.5px] text-[#7A6555] uppercase tracking-widest">
              Author
            </span>
            <input
              className={fieldCls}
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-mono text-[8.5px] text-[#7A6555] uppercase tracking-widest">
              Motion text
            </span>
            <textarea
              className={`${fieldCls} resize-none`}
              rows={3}
              placeholder="Describe the motion…"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </label>
        </div>
        <div className="flex gap-2 mt-4">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-xl text-xs border border-[#3D3330] text-[#9C8272] hover:text-[#FFEDD1] transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={!title}
            onClick={() => {
              if (title) {
                onAdd(title, author, text);
                onClose();
              }
            }}
            className="flex-1 py-2 rounded-xl text-xs font-semibold border border-[#FFD142]/40 bg-[#FFD142]/8 text-[#FFD142] hover:bg-[#FFD142]/15 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Add to queue
          </button>
        </div>
      </div>
    </div>
  );
}

// ── GMA Page ───────────────────────────────────────────────────────────────────
export function GMAPage({
  organizationSlug,
}: {
  organizationSlug?: string;
} = {}) {
  const { members, organizationId } = useDashboardData();
  // ── GMA creation gate ──
  const [gmaCreated, setGmaCreated] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [loading, setLoading] = useState(true);

  const votePath = organizationSlug
    ? `/dashboard/organization/${organizationSlug}/gma/vote`
    : "/dashboard/organization/gearsnl/gma/vote";
  const [fullVoteUrl, setFullVoteUrl] = useState(votePath);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setFullVoteUrl(`${window.location.origin}${votePath}`);
    }
  }, [votePath]);

  const [active, setActive] = useState<Motion | null>(null);
  const [pending, setPending] = useState<PendingMotion[]>([]);
  const [suggested, setSuggested] = useState<SuggestedMotion[]>([]);
  const [view, setView] = useState<"board" | "activevote">("board");
  const [showAdd, setShowAdd] = useState(false);
  const [showAddVote, setShowAddVote] = useState(false);
  const [selectedSuggested, setSelectedSuggested] =
    useState<SuggestedMotion | null>(null);
  const [selectedPending, setSelectedPending] = useState<PendingMotion | null>(
    null
  );
  const [presentCount, setPresentCount] = useState(0);
  const totalMembers = members.length;

  const syncState = async () => {
    const response = await fetch(`/api/gma?organizationId=${organizationId}`, {
      cache: "no-store",
    });
    if (!response.ok) return;
    const data = (await response.json()) as {
      session: { presentCount: number; requiredVotes: number } | null;
      motions: Array<
        SuggestedMotion & {
          status: string;
          remainingSeconds: number;
          timerPaused: boolean;
          text: string;
          author: string;
        }
      >;
    };
    setGmaCreated(Boolean(data.session));
    if (!data.session) {
      setLoading(false);
      return;
    }
    setPresentCount(data.session.presentCount);
    const activeMotion = data.motions.find(
      (motion) => motion.status === "active"
    );
    setActive(
      activeMotion
        ? {
            ...activeMotion,
            signaturesNeeded: data.session.requiredVotes,
            signaturesGot: activeMotion.votesTotal ?? 0,
          }
        : null
    );
    setPending(data.motions.filter((motion) => motion.status === "pending"));
    setSuggested(
      data.motions
        .filter((motion) => motion.status === "suggested")
        .map((motion) => ({ ...motion, timeLeft: "", urgent: false }))
    );
    setLoading(false);
  };

  useEffect(() => {
    void syncState();
    const interval = window.setInterval(() => void syncState(), 5000);
    return () => window.clearInterval(interval);
  }, [organizationId]);

  const runAction = async (
    action:
      | "push-active"
      | "start"
      | "pause"
      | "add-time"
      | "remove-time"
      | "end",
    motionId?: string
  ) => {
    await fetch("/api/gma", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, organizationId, motionId }),
    });
    await syncState();
  };

  // Active motion must never appear in the pending list
  const allPending = pending.filter((m) => m.id !== active?.id);

  const pct = active
    ? Math.min((active.signaturesGot / active.signaturesNeeded) * 100, 100)
    : 0;

  const fieldCls =
    "rounded-lg bg-[#1A1919] border border-[#3D3330] px-3 py-2 text-xs text-[#FFEDD1] placeholder:text-[#4A3F38] focus:outline-none focus:border-[#4A3F38] transition-colors";

  if (loading) return null;

  // ── Creation gate view ──
  if (!gmaCreated) {
    return (
      <div className="flex flex-col flex-1 min-h-0 items-center justify-center gap-6">
        <div className="text-center">
          <p className="font-mono text-[0.6rem] text-[#F0684D] uppercase tracking-[0.22em]">
            General Members Assembly
          </p>
          <h1 className="text-2xl font-semibold text-[#FFEDD1] tracking-tight mt-0.5">
            Create GMA Session
          </h1>
          <p className="text-[11px] text-[#7A6555] mt-1">
            Set the schedule and unlock to begin the assembly.
          </p>
        </div>

        <div className="w-full max-w-2xl rounded-2xl border border-[#3D3330] bg-[#232120] p-6">
          <div className="flex items-end gap-4">
            <div className="flex gap-3 flex-1">
              <label className="flex-1 flex flex-col gap-1">
                <span className="font-mono text-[8.5px] text-[#7A6555] uppercase tracking-widest">
                  Start date
                </span>
                <input
                  type="date"
                  className={fieldCls + " w-full"}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </label>
              <label className="flex-1 flex flex-col gap-1">
                <span className="font-mono text-[8.5px] text-[#7A6555] uppercase tracking-widest">
                  Start time
                </span>
                <input
                  type="time"
                  className={fieldCls + " w-full"}
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </label>
              <label className="flex-1 flex flex-col gap-1">
                <span className="font-mono text-[8.5px] text-[#7A6555] uppercase tracking-widest">
                  End time
                </span>
                <input
                  type="time"
                  className={fieldCls + " w-full"}
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </label>
            </div>
            <button
              onClick={async () => {
                await fetch("/api/gma", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    action: "create-session",
                    organizationId,
                    startDate,
                    startTime,
                    endTime,
                  }),
                });
                await syncState();
              }}
              className="shrink-0 flex items-center gap-2 px-6 py-2 rounded-xl border border-[#F0684D]/50 bg-[#F0684D]/10 text-[#F0684D] text-sm font-semibold hover:bg-[#F0684D]/20 transition-colors whitespace-nowrap"
            >
              Create GMA
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (view === "activevote" && active) {
    return (
      <ActiveVotePage
        motion={active}
        onBack={() => setView("board")}
        onAction={(action) => void runAction(action, active.id)}
        onVote={(status) => {
          void fetch("/api/gma", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "vote",
              organizationId,
              motionId: active.id,
              value: status === "infavour" ? "for" : status,
            }),
          }).then(() => syncState());
        }}
      />
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-4">
      {/* Page title */}
      <div className="shrink-0">
        <p className="font-mono text-[0.6rem] text-[#F0684D] uppercase tracking-[0.22em]">
          General Members Assembly
        </p>
        <h1 className="text-lg font-semibold text-[#FFEDD1] tracking-tight mt-0.5">
          {presentCount}/{totalMembers} Members present
        </h1>
        <p className="text-[11px] text-[#7A6555] mt-0.5">
          {new Date().toLocaleDateString("en-NL", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* ── Active vote card + QR ── */}
      <div className="shrink-0 flex gap-4">
        <div className="flex-1 rounded-2xl border border-[#10b981]/25 bg-[#232120] p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-[#10b981] shrink-0" />
                <span className="text-[10px] font-semibold text-[#10b981] uppercase tracking-widest">
                  Active vote
                </span>
              </div>
              <h2 className="text-base font-semibold text-[#FFEDD1] mb-1">
                {active ? (
                  <>
                    "{active.title}"{" "}
                    <span className="text-[#9C8272] font-normal">by</span> "
                    {active.author}"
                  </>
                ) : (
                  "No active vote"
                )}
              </h2>
              <p className="text-[11px] text-[#9C8272] leading-relaxed line-clamp-2">
                {active
                  ? active.text
                  : "GMA voting is disabled until motions are backed by the database."}
              </p>
            </div>
            <div className="shrink-0 flex flex-col items-end gap-3">
              <button
                onClick={() => {
                  if (active) {
                    void runAction("start", active.id);
                    setView("activevote");
                  }
                }}
                disabled={!active}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#10b981]/50 bg-[#10b981]/12 text-[#10b981] text-xs font-semibold hover:bg-[#10b981]/20 transition-colors whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-40"
              >
                Start vote
                <svg
                  viewBox="0 0 16 16"
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <circle cx="8" cy="8" r="6.5" />
                  <path d="M5.5 8.5l2 2 3-3" />
                </svg>
              </button>
              <div className="text-right">
                <p className="text-[9px] text-[#7A6555] uppercase tracking-widest mb-1">
                  Signatures
                </p>
                <p className="text-2xl font-bold font-mono text-[#10b981] leading-none">
                  {active?.signaturesGot ?? 0}{" "}
                  <span className="text-[#4A3F38]">/</span>{" "}
                  {active?.signaturesNeeded ?? 0}
                </p>
              </div>
              <div className="w-32 h-1.5 rounded-full bg-[#3D3330] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#10b981] transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* QR panel */}
        <div className="shrink-0 rounded-2xl border border-[#3D3330] bg-[#232120] p-4 flex flex-col items-center justify-center gap-2.5">
          <p className="font-mono text-[8px] text-[#7A6555] uppercase tracking-widest">
            Scan to sign
          </p>
          <Link
            href={votePath}
            target="_blank"
            className="rounded-xl overflow-hidden border border-[#3D3330] p-2 bg-[#1A1919] hover:border-[#F0684D]/40 transition-colors block"
            title="Open Mobile Vote Page"
          >
            <BitJsonQrCode
              contents={fullVoteUrl}
              iconSrc="/gears_branding/asset-17.png"
              size={96}
              moduleColor="#FFFFFF"
              positionRingColor="#FFFFFF"
              positionCenterColor="#FFFFFF"
              backgroundColor="#1A1919"
            />
          </Link>
          <Link
            href={votePath}
            target="_blank"
            className="text-[9px] text-[#7A6555] hover:text-[#FFEDD1] text-center max-w-[5.5rem] leading-snug uppercase tracking-widest font-mono transition-colors"
          >
            SCAN TO SIGN
          </Link>
        </div>
      </div>

      {/* ── Bottom two panels ── */}
      <div className="flex-1 min-h-0 grid grid-cols-2 gap-4">
        {/* Pending votes */}
        <div className="rounded-2xl border border-[#3D3330] bg-[#232120] flex flex-col overflow-hidden">
          <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-[#3D3330] shrink-0">
            <div className="w-7 h-7 rounded-lg bg-[#FFD142]/10 border border-[#FFD142]/20 flex items-center justify-center shrink-0">
              <svg
                viewBox="0 0 16 16"
                className="w-3.5 h-3.5 text-[#FFD142]"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <rect x="2" y="2" width="12" height="12" rx="2" />
                <path d="M5 8h6M5 5.5h4M5 10.5h3" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-[#FFEDD1]">
              Pending votes
            </span>
            <span className="ml-auto text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-[#FFD142]/15 text-[#FFD142]">
              {allPending.length}
            </span>
            <button
              onClick={() => setShowAddVote(true)}
              className="text-[9px] font-medium px-2 py-1 rounded-lg border border-[#3D3330] text-[#9C8272] transition-colors whitespace-nowrap opacity-40 cursor-not-allowed"
            >
              + Add Vote
            </button>
          </div>
          <div className="flex-1 overflow-auto divide-y divide-[#3D3330]/50">
            {allPending.map((m, i) => (
              <button
                key={m.id}
                onClick={() => setSelectedPending(m)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#2A2724] transition-colors text-left group"
              >
                <span className="w-6 h-6 rounded-md bg-[#2A2724] group-hover:bg-[#3D3330] border border-[#3D3330] flex items-center justify-center text-[10px] font-mono text-[#7A6555] shrink-0 transition-colors">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[#FFEDD1] truncate">"{m.title}"</p>
                  <p className="text-[9px] text-[#7A6555]">by {m.author}</p>
                </div>
                <svg
                  viewBox="0 0 12 12"
                  className="w-3 h-3 text-[#4A3F38] group-hover:text-[#7A6555] shrink-0 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M4.5 2l4 4-4 4" />
                </svg>
              </button>
            ))}
          </div>
        </div>

        {/* Suggested motions */}
        <div className="rounded-2xl border border-[#3D3330] bg-[#232120] flex flex-col overflow-hidden">
          <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-[#3D3330] shrink-0">
            <div className="w-7 h-7 rounded-lg bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 flex items-center justify-center shrink-0">
              <svg
                viewBox="0 0 16 16"
                className="w-3.5 h-3.5 text-[#8b5cf6]"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M8 2v1M8 13v1M2 8h1M13 8h1M4.2 4.2l.7.7M11.1 11.1l.7.7M4.2 11.8l.7-.7M11.1 4.9l.7-.7" />
                <circle cx="8" cy="8" r="3" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-[#FFEDD1]">
              Suggested motions
            </span>
            <span className="ml-auto text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-[#8b5cf6]/15 text-[#8b5cf6]">
              {suggested.length}
            </span>
            <button
              onClick={() => setShowAdd(true)}
              className="text-[9px] font-medium px-2 py-1 rounded-lg border border-[#3D3330] text-[#9C8272] transition-colors whitespace-nowrap opacity-40 cursor-not-allowed"
            >
              + Suggest
            </button>
          </div>
          <div className="flex-1 overflow-auto divide-y divide-[#3D3330]/50">
            {suggested.map((m, i) => {
              return (
                <button
                  key={m.id}
                  onClick={() => setSelectedSuggested(m)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#2A2724] transition-colors text-left group"
                >
                  <span className="w-6 h-6 rounded-md bg-[#2A2724] group-hover:bg-[#3D3330] border border-[#3D3330] flex items-center justify-center text-[10px] font-mono text-[#7A6555] shrink-0 transition-colors">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#FFEDD1] truncate">
                      "{m.title}"
                    </p>
                    <p className="text-[9px] text-[#7A6555]">by {m.author}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="font-mono text-[8px] text-[#7A6555] uppercase tracking-widest">
                        votes
                      </span>
                      <span className="font-mono text-[10px] font-bold text-[#8b5cf6]">
                        {m.votesTotal ?? 0}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {selectedPending && (
        <PendingMotionPopup
          motion={selectedPending}
          onClose={() => setSelectedPending(null)}
          onPushToActive={(m) => {
            void runAction("push-active", m.id);
            setSelectedPending(null);
          }}
        />
      )}
      {selectedSuggested && (
        <SuggestedMotionPopup
          motion={selectedSuggested}
          onClose={() => setSelectedSuggested(null)}
          onVote={(value) => {
            void fetch("/api/gma", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "vote",
                organizationId,
                motionId: selectedSuggested.id,
                value,
              }),
            }).then(() => syncState());
          }}
        />
      )}
      {showAddVote && (
        <AddVotePopup
          onClose={() => setShowAddVote(false)}
          onAdd={(title, author, text) => {
            void fetch("/api/gma", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "suggest",
                organizationId,
                title,
                text: `${author}: ${text}`,
              }),
            }).then(() => syncState());
          }}
        />
      )}
      {showAdd && (
        <AddMotionPopup
          onClose={() => setShowAdd(false)}
          onAdd={(title, author, text) => {
            void fetch("/api/gma", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "suggest",
                organizationId,
                title,
                text: `${author}: ${text}`,
              }),
            }).then(() => syncState());
          }}
        />
      )}
    </div>
  );
}
