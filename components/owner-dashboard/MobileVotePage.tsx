// biome-ignore-all assist/source/useSortedAttributes: Preserves the imported mobile vote JSX attribute order.
// biome-ignore-all lint: Preserves the imported mobile vote interaction and formatting conventions.
"use client";

import { useState } from "react";

type VoteChoice = "infavour" | "abstain" | "against" | null;

const VOTE_BUTTONS: {
  key: Exclude<VoteChoice, null>;
  label: string;
  color: string;
  border: string;
  bg: string;
}[] = [
  {
    key: "infavour",
    label: "In Favour",
    color: "#10b981",
    border: "border-[#10b981]/50",
    bg: "bg-[#10b981]/12",
  },
  {
    key: "abstain",
    label: "Abstain",
    color: "#FFD142",
    border: "border-[#FFD142]/50",
    bg: "bg-[#FFD142]/12",
  },
  {
    key: "against",
    label: "Against",
    color: "#F0684D",
    border: "border-[#F0684D]/50",
    bg: "bg-[#F0684D]/12",
  },
];

export function MobileVotePage({
  organizationSlug,
}: {
  organizationSlug?: string;
}) {
  const [activeVote, setActiveVote] = useState<VoteChoice>(null);
  const [suggestion, setSuggestion] = useState("");
  const hasActiveVote = false;
  void organizationSlug;

  return (
    <div className="flex h-screen w-full items-center justify-center overflow-hidden bg-[#141212]">
      <div className="flex h-full w-full max-w-[430px] flex-col overflow-hidden bg-[#1A1919] shadow-2xl">
        <div
          className="flex flex-col border-[#3D3330] border-b bg-[#232120]"
          style={{ flex: "35 0 0%", minHeight: 0 }}
        >
          <div className="shrink-0 px-4 pt-4 pb-2">
            <div className="mb-2 flex items-center gap-1.5">
              <span className="h-2 w-2 shrink-0 rounded-full bg-[#10b981]" />
              <span className="font-bold text-[#10b981] text-[9px] uppercase tracking-widest">
                Active vote
              </span>
            </div>
            <h2 className="mb-0.5 font-semibold text-[#FFEDD1] text-sm leading-snug">
              No active vote
            </h2>
            <p className="mb-2 text-[#7A6555] text-[10px]">Voting disabled</p>
            <p className="line-clamp-2 text-[#9C8272] text-[10px] leading-relaxed">
              GMA voting is disabled until motions are backed by the database.
            </p>
          </div>

          <div className="mt-auto flex shrink-0 gap-2 px-4 pb-4">
            {VOTE_BUTTONS.map(({ key, label, color, border, bg }) => {
              const chosen = activeVote === key;
              return (
                <button
                  className={`flex-1 rounded-xl border py-2.5 font-semibold text-[11px] transition-all ${border} ${chosen ? bg : "bg-transparent"} disabled:cursor-not-allowed disabled:opacity-40`}
                  disabled={!hasActiveVote}
                  key={key}
                  onClick={() => setActiveVote(key)}
                  style={{ color }}
                  type="button"
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div
          className="flex flex-col overflow-hidden border-[#3D3330] border-b bg-[#1A1919]"
          style={{ flex: "30 0 0%", minHeight: 0 }}
        >
          <div className="shrink-0 border-[#3D3330]/50 border-b px-4 py-2">
            <span className="font-bold text-[#8b5cf6] text-[9px] uppercase tracking-widest">
              Suggested motions
            </span>
          </div>
          <div className="flex flex-1 items-center justify-center px-6 text-center text-[#7A6555] text-xs">
            No suggested motions are available.
          </div>
        </div>

        <div
          className="flex flex-col gap-3 bg-[#232120] px-4 py-4"
          style={{ flex: "35 0 0%", minHeight: 0 }}
        >
          <div className="shrink-0">
            <span className="font-bold text-[#F0684D] text-[9px] uppercase tracking-widest">
              Suggest a motion
            </span>
          </div>
          <textarea
            className="w-full flex-1 min-h-0 resize-none rounded-xl border border-[#3D3330] bg-[#1A1919] px-3 py-2.5 text-[#FFEDD1] text-[11px] placeholder:text-[#4A3F38] transition-colors focus:border-[#4A3F38] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            disabled
            onChange={(event) => setSuggestion(event.target.value)}
            placeholder="Motion suggestions are unavailable until database support is added."
            value={suggestion}
          />
          <button
            className="w-full shrink-0 rounded-xl border border-[#F0684D]/40 bg-[#F0684D]/10 py-3 font-semibold text-[#F0684D] text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40"
            disabled
            type="button"
          >
            Suggest Motion
          </button>
        </div>
      </div>
    </div>
  );
}
