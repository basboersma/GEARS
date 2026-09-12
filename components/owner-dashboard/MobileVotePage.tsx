// biome-ignore-all assist/source/useSortedAttributes: Preserves the imported mobile vote JSX attribute order.
// biome-ignore-all lint: Preserves the imported mobile vote interaction and formatting conventions.
"use client";

import { useState } from "react";

interface ActiveVote {
  title: string;
  author: string;
  text: string;
}

interface SuggestedItem {
  id: string;
  title: string;
  author: string;
}

type VoteChoice = "infavour" | "abstain" | "against" | null;

const MOCK_ACTIVE: ActiveVote = {
  title: "Budget Reallocation Q4 2026",
  author: "Liam Bakker",
  text: "Motion to reallocate €2,400 from the PR budget surplus to the Mechanical subteam for CNC tooling upgrades.",
};

const MOCK_SUGGESTED: SuggestedItem[] = [
  { id: "s1", title: "Increase Workshop Access Hours", author: "Noah Smit" },
  {
    id: "s2",
    title: "Purchase Shared 3D Printer Filament",
    author: "Alex van den Berg",
  },
  {
    id: "s3",
    title: "Organise End-of-Year Team Event",
    author: "Sophie Janssen",
  },
  { id: "s4", title: "Review Social Media Policy", author: "Emma de Vries" },
];

const VOTE_BUTTONS: {
  key: VoteChoice & string;
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
  const [suggestedVotes, setSuggestedVotes] = useState<
    Record<string, VoteChoice>
  >({});
  const [suggestion, setSuggestion] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [suggestions, setSuggestions] =
    useState<SuggestedItem[]>(MOCK_SUGGESTED);

  const handleSuggest = () => {
    if (!suggestion.trim()) return;
    setSuggestions((prev) => [
      ...prev,
      { id: crypto.randomUUID(), title: suggestion.trim(), author: "You" },
    ]);
    setSuggestion("");
    setSubmitted(true);
  };

  return (
    // Full-screen on mobile, phone-shaped on desktop
    <div className="flex h-screen w-full items-center justify-center overflow-hidden bg-[#141212]">
      <div className="flex h-full w-full max-w-[430px] flex-col overflow-hidden bg-[#1A1919] shadow-2xl">
        {/* ── Top 35%: Active vote ── */}
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
              "{MOCK_ACTIVE.title}"
            </h2>
            <p className="mb-2 text-[#7A6555] text-[10px]">
              by {MOCK_ACTIVE.author}
            </p>
            <p className="line-clamp-2 text-[#9C8272] text-[10px] leading-relaxed">
              {MOCK_ACTIVE.text}
            </p>
          </div>

          {/* Vote buttons */}
          <div className="mt-auto flex shrink-0 gap-2 px-4 pb-4">
            {VOTE_BUTTONS.map(({ key, label, color, border, bg }) => {
              const chosen = activeVote === key;
              return (
                <button
                  className={`flex-1 rounded-xl border py-2.5 font-semibold text-[11px] transition-all ${border} ${chosen ? bg : "bg-transparent"}`}
                  key={key}
                  onClick={() =>
                    setActiveVote(chosen ? null : (key as VoteChoice))
                  }
                  style={{ color }}
                  type="button"
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Middle 30%: Suggested motions ── */}
        <div
          className="flex flex-col overflow-hidden border-[#3D3330] border-b bg-[#1A1919]"
          style={{ flex: "30 0 0%", minHeight: 0 }}
        >
          <div className="shrink-0 border-[#3D3330]/50 border-b px-4 py-2">
            <span className="font-bold text-[#8b5cf6] text-[9px] uppercase tracking-widest">
              Suggested motions
            </span>
          </div>
          <div className="flex-1 divide-y divide-[#3D3330]/40 overflow-auto">
            {suggestions.map((m) => (
              <div className="px-3 py-2" key={m.id}>
                <p className="mb-1.5 truncate font-medium text-[#FFEDD1] text-[11px]">
                  "{m.title}"
                </p>
                <div className="flex gap-1.5">
                  {VOTE_BUTTONS.map(({ key, label, color, border, bg }) => {
                    const chosen = suggestedVotes[m.id] === key;
                    return (
                      <button
                        className={`flex-1 rounded-lg border py-1 font-semibold text-[9px] transition-all ${border} ${chosen ? bg : "bg-transparent"}`}
                        key={key}
                        onClick={() =>
                          setSuggestedVotes((v) => ({
                            ...v,
                            [m.id]: chosen ? null : (key as VoteChoice),
                          }))
                        }
                        style={{ color }}
                        type="button"
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Bottom 35%: Suggest motion ── */}
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
            className="w-full flex-1 min-h-0 resize-none rounded-xl border border-[#3D3330] bg-[#1A1919] px-3 py-2.5 text-[#FFEDD1] text-[11px] placeholder:text-[#4A3F38] transition-colors focus:border-[#4A3F38] focus:outline-none"
            onChange={(e) => {
              setSuggestion(e.target.value);
              setSubmitted(false);
            }}
            placeholder="Describe your motion…"
            value={suggestion}
          />
          {submitted && (
            <p className="shrink-0 text-[#10b981] text-[10px]">
              ✓ Motion submitted
            </p>
          )}
          <button
            className="w-full shrink-0 rounded-xl border border-[#F0684D]/40 bg-[#F0684D]/10 py-3 font-semibold text-[#F0684D] text-xs transition-colors hover:bg-[#F0684D]/20 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!suggestion.trim()}
            onClick={handleSuggest}
            type="button"
          >
            Suggest Motion
          </button>
        </div>
      </div>
    </div>
  );
}
