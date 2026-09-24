// biome-ignore-all lint: Preserves the mobile vote interaction and formatting conventions.
"use client";

import { useEffect, useState } from "react";

type VoteChoice = "infavour" | "abstain" | "against" | null;
type GmaMotion = {
  id: string;
  title: string;
  text: string;
  status: string;
  votesTotal: number;
  remainingSeconds: number;
};

export function MobileVotePage({
  organizationId,
}: {
  organizationId: string;
  organizationSlug?: string;
}) {
  const [activeVote, setActiveVote] = useState<VoteChoice>(null);
  const [suggestion, setSuggestion] = useState("");
  const [motions, setMotions] = useState<GmaMotion[]>([]);

  const refresh = async () => {
    const response = await fetch(`/api/gma?organizationId=${organizationId}`, {
      cache: "no-store",
    });
    if (response.ok) {
      const data = (await response.json()) as { motions: GmaMotion[] };
      setMotions(data.motions);
    }
  };

  useEffect(() => {
    void refresh();
    const interval = window.setInterval(() => void refresh(), 5000);
    return () => window.clearInterval(interval);
  }, [organizationId]);

  const activeMotion = motions.find((motion) => motion.status === "active");
  const suggestedMotions = motions.filter(
    (motion) => motion.status === "suggested"
  );

  const castVote = async (
    motionId: string,
    value: "for" | "against" | "abstain"
  ) => {
    await fetch("/api/gma", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "vote", organizationId, motionId, value }),
    });
    await refresh();
  };

  return (
    <div className="flex h-screen w-full items-center justify-center overflow-hidden bg-[#141212]">
      <div className="flex h-full w-full max-w-[430px] flex-col overflow-hidden bg-[#1A1919] shadow-2xl">
        <section
          className="flex min-h-0 flex-col border-[#3D3330] border-b bg-[#232120] p-4"
          style={{ flex: "35 0 0%" }}
        >
          <div className="mb-2 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#10b981]" />
            <span className="font-bold text-[#10b981] text-[9px] uppercase tracking-widest">
              Active vote
            </span>
          </div>
          <h2 className="font-semibold text-[#FFEDD1] text-sm leading-snug">
            {activeMotion?.title ?? "No active vote"}
          </h2>
          <p className="mt-1 text-[#7A6555] text-[10px]">
            {activeMotion
              ? `${activeMotion.remainingSeconds}s remaining`
              : "Voting disabled"}
          </p>
          <p className="mt-2 line-clamp-2 text-[#9C8272] text-[10px] leading-relaxed">
            {activeMotion?.text ?? "The next active motion will appear here."}
          </p>
          <div className="mt-auto flex gap-2 pt-4">
            {(["infavour", "abstain", "against"] as const).map((choice) => (
              <button
                className={`flex-1 rounded-xl border py-2.5 font-semibold text-[11px] transition-all ${activeVote === choice ? "bg-white/10" : "bg-transparent"}`}
                disabled={!activeMotion}
                key={choice}
                onClick={() => {
                  setActiveVote(choice);
                  if (activeMotion)
                    void castVote(
                      activeMotion.id,
                      choice === "infavour" ? "for" : choice
                    );
                }}
                style={{
                  color:
                    choice === "infavour"
                      ? "#10b981"
                      : choice === "against"
                        ? "#F0684D"
                        : "#FFD142",
                }}
                type="button"
              >
                {choice === "infavour"
                  ? "In Favour"
                  : choice[0].toUpperCase() + choice.slice(1)}
              </button>
            ))}
          </div>
        </section>

        <section
          className="flex min-h-0 flex-col overflow-hidden border-[#3D3330] border-b bg-[#1A1919] p-4"
          style={{ flex: "35 0 0%" }}
        >
          <span className="shrink-0 font-bold text-[#8b5cf6] text-[9px] uppercase tracking-widest">
            Suggested motions
          </span>
          <div className="mt-2 flex-1 overflow-auto">
            {suggestedMotions.length === 0 ? (
              <div className="flex h-full items-center justify-center text-center text-[#7A6555] text-xs">
                No suggested motions are available.
              </div>
            ) : (
              suggestedMotions.map((motion) => (
                <div
                  className="border-[#3D3330]/50 border-b py-3"
                  key={motion.id}
                >
                  <p className="truncate text-[#FFEDD1] text-[11px]">
                    {motion.title}
                  </p>
                  <p className="mt-1 text-[#7A6555] text-[10px]">
                    {motion.votesTotal} votes cast
                  </p>
                  <div className="mt-2 flex gap-1.5">
                    {(["for", "abstain", "against"] as const).map((value) => (
                      <button
                        className="flex-1 rounded-lg border border-[#3D3330] py-1.5 text-[#9C8272] text-[9px]"
                        key={value}
                        onClick={() => void castVote(motion.id, value)}
                        type="button"
                      >
                        {value === "for"
                          ? "In favour"
                          : value[0].toUpperCase() + value.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section
          className="flex min-h-0 flex-col gap-3 bg-[#232120] p-4"
          style={{ flex: "30 0 0%" }}
        >
          <span className="shrink-0 font-bold text-[#F0684D] text-[9px] uppercase tracking-widest">
            Suggest a motion
          </span>
          <textarea
            className="min-h-0 w-full flex-1 resize-none rounded-xl border border-[#3D3330] bg-[#1A1919] px-3 py-2.5 text-[#FFEDD1] text-[11px] placeholder:text-[#4A3F38] focus:border-[#4A3F38] focus:outline-none"
            onChange={(event) => setSuggestion(event.target.value)}
            placeholder="Describe a motion"
            value={suggestion}
          />
          <button
            className="w-full shrink-0 rounded-xl border border-[#F0684D]/40 bg-[#F0684D]/10 py-3 font-semibold text-[#F0684D] text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!suggestion.trim()}
            onClick={async () => {
              await fetch("/api/gma", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  action: "suggest",
                  organizationId,
                  title: suggestion.trim(),
                  text: "",
                }),
              });
              setSuggestion("");
              await refresh();
            }}
            type="button"
          >
            Suggest Motion
          </button>
        </section>
      </div>
    </div>
  );
}
