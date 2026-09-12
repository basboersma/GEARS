// biome-ignore-all assist/source/useSortedAttributes: Preserves the imported GMA dashboard JSX attribute order.
// biome-ignore-all lint: Preserves the imported GMA dashboard interaction and formatting conventions.
"use client";

import { useState } from "react";

// ── Types ──────────────────────────────────────────────────────────────────────
interface Motion {
  id: string;
  title: string;
  author: string;
  text: string;
  signaturesNeeded: number;
  signaturesGot: number;
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
}

type VoteStatus = "infavour" | "against" | "abstain" | "notvoted";
interface SeatMember {
  id: string;
  name: string;
  status: VoteStatus;
}

// ── Mock data ──────────────────────────────────────────────────────────────────
const MOCK_ACTIVE: Motion = {
  id: "2025-06-15-001",
  title: "Budget Reallocation Q4 2026",
  author: "Liam Bakker",
  text: "Motion to reallocate €2,400 from the PR budget surplus to the Mechanical subteam for CNC tooling upgrades. The current PR underspend of 18% justifies the transfer. All receipts and estimates are attached in the linked document. The Mechanical subteam lead has confirmed the tooling will be operational within two weeks of purchase and is expected to reduce external machining costs by approximately 40% over Q1 2027.",
  signaturesNeeded: 49,
  signaturesGot: 35,
};

const MOCK_PENDING: PendingMotion[] = [
  {
    id: "p1",
    title: "Amendment to Membership Fee Structure",
    author: "Sophie Janssen",
    text: "Proposes revising the annual membership fee from €60 to €75 for active members, with a reduced rate of €35 for students. The increase reflects rising operational costs and will fund additional workshop equipment.",
  },
  {
    id: "p2",
    title: "Approval of External Sponsorship Agreement",
    author: "Emma de Vries",
    text: "Formalise the sponsorship agreement with TechPartner BV, providing €1,200 annually in exchange for logo placement on team materials and a 30-minute presentation slot at the annual showcase.",
  },
  {
    id: "p3",
    title: "Ratify Subteam Lead Elections 2026–2027",
    author: "Liam Bakker",
    text: "Formally ratify the results of the subteam lead elections held on 2026-08-30. All elected leads are listed in the attached election report.",
  },
  {
    id: "p4",
    title: "Adopt New Code of Conduct v2.1",
    author: "Daan Mulder",
    text: "Replace the current Code of Conduct (v1.4, 2022) with the updated v2.1 which adds explicit clauses on online conduct, AI-generated content attribution, and conflict-of-interest disclosures.",
  },
];

const MOCK_SUGGESTED: SuggestedMotion[] = [
  {
    id: "s1",
    title: "Increase Workshop Access Hours",
    author: "Noah Smit",
    text: "Propose extending workshop access from 18:00 to 22:00 on weekdays and full-day Saturday access to accommodate members with daytime commitments. Safety officer approval pending.",
    timeLeft: "0:12",
    urgent: false,
    votesFor: 18,
    votesAgainst: 6,
  },
  {
    id: "s2",
    title: "Purchase Shared 3D Printer Filament",
    author: "Alex van den Berg",
    text: "Bulk purchase of 10 kg PLA filament (mixed colours) at an estimated cost of €85. Current stock is depleted. Vendor quote attached.",
    timeLeft: "2:32",
    urgent: false,
    votesFor: 31,
    votesAgainst: 3,
  },
  {
    id: "s3",
    title: "Organise End-of-Year Team Event",
    author: "Sophie Janssen",
    text: "Allocate up to €300 from the social budget for an end-of-year dinner or activity. Date and venue to be decided by a poll after approval.",
    timeLeft: "4:59",
    urgent: false,
    votesFor: 22,
    votesAgainst: 11,
  },
  {
    id: "s4",
    title: "Review Social Media Policy",
    author: "Emma de Vries",
    text: "Current social media guidelines date from 2023 and do not address short-form video or AI-generated content. Propose forming a sub-committee to draft an updated policy within 60 days.",
    timeLeft: "5:00",
    urgent: true,
    votesFor: 9,
    votesAgainst: 19,
  },
];

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

// ── Random QR code ─────────────────────────────────────────────────────────────
function QRCode({
  size = 80,
  color = "#10b981",
}: {
  size?: number;
  color?: string;
}) {
  const cells = 21;
  const cell = size / cells;
  const bits: boolean[] = Array.from({ length: cells * cells }, (_, i) => {
    const x = i % cells,
      y = Math.floor(i / cells);
    if (
      (x < 7 && y < 7) ||
      (x >= cells - 7 && y < 7) ||
      (x < 7 && y >= cells - 7)
    )
      return true;
    const h = Math.imul(i ^ 0xdeadbeef, 0x9e3779b9) >>> 0;
    return (h & 1) === 1;
  });
  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      style={{ imageRendering: "pixelated" }}
    >
      <rect width={size} height={size} fill="#1A1919" />
      {bits.map((on, i) =>
        on ? (
          <rect
            key={i}
            x={(i % cells) * cell}
            y={Math.floor(i / cells) * cell}
            width={cell}
            height={cell}
            fill={color}
          />
        ) : null
      )}
    </svg>
  );
}

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
}: {
  motion: Motion;
  onBack: () => void;
}) {
  const [seats, setSeats] = useState<SeatMember[]>(INIT_SEATS);
  const [timerSec, setTimerSec] = useState(299);
  const [running, setRunning] = useState(false);
  const [adminVote, setAdminVote] = useState<VoteStatus | null>(null);
  const [ended, setEnded] = useState(false);

  const castVote = (status: VoteStatus) => {
    setAdminVote(status);
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
              onClick={() => setTimerSec((s) => s + 60)}
              className="h-8 px-3 rounded-lg border border-[#3D3330] bg-[#232120] text-[#9C8272] hover:text-[#FFEDD1] hover:border-[#4A3F38] text-[11px] font-medium transition-colors whitespace-nowrap"
            >
              Add more time
            </button>
            <button
              onClick={() => setRunning((r) => !r)}
              className="h-8 px-3 rounded-lg border border-[#3D3330] bg-[#232120] text-[#9C8272] hover:text-[#FFEDD1] hover:border-[#4A3F38] text-[11px] font-medium transition-colors whitespace-nowrap"
            >
              {running ? "Pause" : "Continue"}
            </button>
            <button
              onClick={() => setTimerSec((s) => Math.max(0, s - 60))}
              className="h-8 px-3 rounded-lg border border-[#3D3330] bg-[#232120] text-[#9C8272] hover:text-[#FFEDD1] hover:border-[#4A3F38] text-[11px] font-medium transition-colors whitespace-nowrap"
            >
              Remove time
            </button>
            <button
              onClick={() => setEnded(true)}
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
}: {
  motion: SuggestedMotion;
  onClose: () => void;
}) {
  const [min, sec] = motion.timeLeft.split(":").map(Number);
  const totalSec = min * 60 + sec;
  const timeColor =
    totalSec <= 30 ? "#F0684D" : totalSec <= 150 ? "#FFD142" : "#10b981";
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
        <div className="flex items-center justify-between pt-4 border-t border-[#3D3330]">
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-[#7A6555] uppercase tracking-widest">
              Time left
            </span>
            <span
              className="text-base font-mono font-bold"
              style={{ color: timeColor }}
            >
              {motion.timeLeft}
            </span>
            {motion.urgent && (
              <svg
                viewBox="0 0 16 16"
                className="w-3.5 h-3.5"
                fill="none"
                stroke="#F0684D"
                strokeWidth="1.5"
              >
                <circle cx="8" cy="8" r="6.5" />
                <path d="M8 5v3.5M8 11h.01" />
              </svg>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold border border-[#8b5cf6]/40 bg-[#8b5cf6]/10 text-[#8b5cf6] hover:bg-[#8b5cf6]/20 transition-colors"
          >
            Close
          </button>
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
export function GMAPage() {
  // ── GMA creation gate ──
  const [gmaCreated, setGmaCreated] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [pwdInput, setPwdInput] = useState("");
  const [pwdError, setPwdError] = useState(false);

  const [active, setActive] = useState<Motion>(MOCK_ACTIVE);
  const [pending, setPending] = useState<PendingMotion[]>(MOCK_PENDING);
  // Motions displaced from active are kept separately so pending is never mutated by additions
  const [returned, setReturned] = useState<PendingMotion[]>([]);
  const [suggested, setSuggested] = useState<SuggestedMotion[]>(MOCK_SUGGESTED);
  const [view, setView] = useState<"board" | "activevote">("board");
  const [showAdd, setShowAdd] = useState(false);
  const [showAddVote, setShowAddVote] = useState(false);
  const [selectedSuggested, setSelectedSuggested] =
    useState<SuggestedMotion | null>(null);
  const [selectedPending, setSelectedPending] = useState<PendingMotion | null>(
    null
  );
  const membersPresent = 46;
  const totalMembers = 47;

  // Active motion must never appear in the pending list
  const allPending = [...returned, ...pending].filter(
    (m) => m.id !== active.id
  );

  const pct = Math.min(
    (active.signaturesGot / active.signaturesNeeded) * 100,
    100
  );

  const fieldCls =
    "rounded-lg bg-[#1A1919] border border-[#3D3330] px-3 py-2 text-xs text-[#FFEDD1] placeholder:text-[#4A3F38] focus:outline-none focus:border-[#4A3F38] transition-colors";

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
              onClick={() => setShowPwdModal(true)}
              className="shrink-0 flex items-center gap-2 px-6 py-2 rounded-xl border border-[#F0684D]/50 bg-[#F0684D]/10 text-[#F0684D] text-sm font-semibold hover:bg-[#F0684D]/20 transition-colors whitespace-nowrap"
            >
              🔒 Create GMA
            </button>
          </div>
        </div>

        {showPwdModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
            onClick={() => {
              setShowPwdModal(false);
              setPwdError(false);
              setPwdInput("");
            }}
          >
            <div
              className="bg-[#232120] rounded-2xl border border-[#3D3330] shadow-2xl p-6 max-w-xs w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-sm font-semibold text-[#FFEDD1] mb-1">
                Administrator password
              </h3>
              <p className="text-[11px] text-[#7A6555] mb-4">
                Enter the password to unlock and create this GMA session.
              </p>
              <input
                type="password"
                className={fieldCls + " w-full mb-2"}
                placeholder="Password"
                value={pwdInput}
                onChange={(e) => {
                  setPwdInput(e.target.value);
                  setPwdError(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (pwdInput === "Password123") {
                      setGmaCreated(true);
                      setShowPwdModal(false);
                    } else setPwdError(true);
                  }
                }}
              />
              {pwdError && (
                <p className="text-[10px] text-[#F0684D] mb-2">
                  Incorrect password. Try again.
                </p>
              )}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => {
                    setShowPwdModal(false);
                    setPwdError(false);
                    setPwdInput("");
                  }}
                  className="flex-1 py-2 rounded-xl text-xs border border-[#3D3330] text-[#9C8272] hover:text-[#FFEDD1] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (pwdInput === "Password123") {
                      setGmaCreated(true);
                      setShowPwdModal(false);
                    } else setPwdError(true);
                  }}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold border border-[#F0684D]/40 bg-[#F0684D]/10 text-[#F0684D] hover:bg-[#F0684D]/20 transition-colors"
                >
                  Unlock
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (view === "activevote") {
    return <ActiveVotePage motion={active} onBack={() => setView("board")} />;
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-4">
      {/* Page title */}
      <div className="shrink-0">
        <p className="font-mono text-[0.6rem] text-[#F0684D] uppercase tracking-[0.22em]">
          General Members Assembly
        </p>
        <h1 className="text-lg font-semibold text-[#FFEDD1] tracking-tight mt-0.5">
          {membersPresent}/{totalMembers} Members
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
                "{active.title}"{" "}
                <span className="text-[#9C8272] font-normal">by</span> "
                {active.author}"
              </h2>
              <p className="text-[11px] text-[#9C8272] leading-relaxed line-clamp-2">
                {active.text}
              </p>
            </div>
            <div className="shrink-0 flex flex-col items-end gap-3">
              <button
                onClick={() => setView("activevote")}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#10b981]/50 bg-[#10b981]/12 text-[#10b981] text-xs font-semibold hover:bg-[#10b981]/20 transition-colors whitespace-nowrap"
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
                  {active.signaturesGot}{" "}
                  <span className="text-[#4A3F38]">/</span>{" "}
                  {active.signaturesNeeded}
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
          <div className="rounded-xl overflow-hidden border border-[#3D3330] p-2 bg-[#1A1919]">
            <QRCode size={84} />
          </div>
          <p className="text-[9px] text-[#4A3F38] text-center max-w-[5.5rem] leading-snug uppercase tracking-widest font-mono">
            SCAN TO SIGN
          </p>
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
              className="text-[9px] font-medium px-2 py-1 rounded-lg border border-[#3D3330] text-[#9C8272] hover:text-[#FFEDD1] hover:border-[#4A3F38] transition-colors whitespace-nowrap"
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
              className="text-[9px] font-medium px-2 py-1 rounded-lg border border-[#3D3330] text-[#9C8272] hover:text-[#FFEDD1] hover:border-[#4A3F38] transition-colors whitespace-nowrap"
            >
              + Suggest
            </button>
          </div>
          <div className="flex-1 overflow-auto divide-y divide-[#3D3330]/50">
            {suggested.map((m, i) => {
              const [min, sec] = m.timeLeft.split(":").map(Number);
              const totalSec = min * 60 + sec;
              const timeColor =
                totalSec <= 30
                  ? "#F0684D"
                  : totalSec <= 150
                    ? "#FFD142"
                    : "#10b981";
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
                        against
                      </span>
                      <span className="font-mono text-[10px] font-bold text-[#F0684D]">
                        {m.votesAgainst}/{totalMembers}
                      </span>
                    </div>
                    <span
                      className="text-sm font-mono font-semibold"
                      style={{ color: timeColor }}
                    >
                      {m.timeLeft}
                    </span>
                    {m.urgent && (
                      <svg
                        viewBox="0 0 16 16"
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="#F0684D"
                        strokeWidth="1.5"
                      >
                        <circle cx="8" cy="8" r="6.5" />
                        <path d="M8 5v3.5M8 11h.01" />
                      </svg>
                    )}
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
            const displaced = {
              id: crypto.randomUUID(),
              title: active.title,
              author: active.author,
              text: active.text,
            };
            setActive((a) => ({
              ...a,
              id: m.id,
              title: m.title,
              author: m.author,
              text: m.text,
            }));
            // Remove m from whichever list it lives in
            setPending((p) => p.filter((x) => x.id !== m.id));
            setReturned((r) => [displaced, ...r.filter((x) => x.id !== m.id)]);
            setSelectedPending(null);
          }}
        />
      )}
      {selectedSuggested && (
        <SuggestedMotionPopup
          motion={selectedSuggested}
          onClose={() => setSelectedSuggested(null)}
        />
      )}
      {showAddVote && (
        <AddVotePopup
          onClose={() => setShowAddVote(false)}
          onAdd={(title, author, text) => {
            setPending((p) => [
              ...p,
              { id: crypto.randomUUID(), title, author, text },
            ]);
          }}
        />
      )}
      {showAdd && (
        <AddMotionPopup
          onClose={() => setShowAdd(false)}
          onAdd={(title, author, text) => {
            setSuggested((prev) => [
              ...prev,
              {
                id: crypto.randomUUID(),
                title,
                author,
                text,
                timeLeft: "10:00",
                urgent: false,
                votesFor: 0,
                votesAgainst: 0,
              },
            ]);
          }}
        />
      )}
    </div>
  );
}
