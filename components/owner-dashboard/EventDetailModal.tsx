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
import {
  avatarBg,
  DAY_FULL,
  FILES,
  MEMBERS,
  MONTH_NAMES,
  memberIdx,
  parseDate,
} from "./data";
import { ModalHeader, ModalShell } from "./shared";
import type { CalEvent, InviteStatus } from "./types";

const STATUS_CLS: Record<InviteStatus, string> = {
  accepted: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
  pending: "bg-amber-500/20  text-amber-400  border-amber-500/40",
  declined: "bg-rose-500/20   text-rose-400   border-rose-500/40",
};
const STATUS_DOT: Record<InviteStatus, string> = {
  accepted: "bg-emerald-400",
  pending: "bg-amber-400",
  declined: "bg-rose-400",
};
const TYPE_COLOR: Record<CalEvent["type"], string> = {
  event: "#10b981",
  meeting: "#4f6ef7",
};
const FILE_ICON: Record<string, string> = {
  pdf: "📄",
  doc: "📝",
  sheet: "📊",
  slide: "📑",
  other: "📁",
};

function fmtDateTime(date: string, time: string) {
  const d = parseDate(date);
  const dayName = DAY_FULL[(d.getDay() + 6) % 7];
  return `${dayName}, ${d.getDate()} ${MONTH_NAMES[d.getMonth()]} · ${time}`;
}

interface Props {
  event: CalEvent;
  onEdit: () => void;
  onClose: () => void;
}

export function EventDetailModal({ event, onEdit, onClose }: Props) {
  const typeColor = TYPE_COLOR[event.type];

  return (
    <ModalShell onClose={onClose} width="max-w-lg">
      <ModalHeader onClose={onClose} title="" />

      <div className="flex-1 space-y-4 overflow-auto px-5 pb-5">
        {/* Title + badges */}
        <div className="flex items-start gap-3 pt-1">
          <div
            className="mt-1 h-3 w-3 shrink-0 rounded-full"
            style={{ background: typeColor }}
          />
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-[#FFEDD1] text-lg leading-tight">
              {event.title}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span
                className="rounded-full px-2 py-0.5 font-medium text-xs capitalize"
                style={{
                  background: `${typeColor}22`,
                  color: typeColor,
                  border: `1px solid ${typeColor}44`,
                }}
              >
                {event.type}
              </span>
              {event.repeat && (
                <span className="text-[#7A6555] text-xs">
                  🔁 Every {event.repeat.every} {event.repeat.unit}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Time */}
        <div className="flex items-center gap-2 text-[#C4A882] text-sm">
          <span>🕐</span>
          <span>
            {fmtDateTime(event.date, event.startTime)} – {event.endTime}
          </span>
        </div>
        {event.location && (
          <div className="flex items-center gap-2 text-[#C4A882] text-sm">
            <span>📍</span>
            <span>{event.location}</span>
          </div>
        )}
        {event.description && (
          <p className="rounded-xl bg-[#232120] px-3 py-2.5 text-[#C4A882] text-sm">
            {event.description}
          </p>
        )}

        {/* Invitees */}
        {event.invitees.length > 0 && (
          <div>
            <div className="mb-2 font-semibold text-[#7A6555] text-xs uppercase tracking-wider">
              Invitees ({event.invitees.length})
            </div>
            <div className="flex flex-wrap gap-2">
              {event.invitees.map((inv) => {
                const m = MEMBERS.find((x) => x.id === inv.memberId);
                if (!m) {
                  return null;
                }
                const mi = memberIdx(m.id);
                return (
                  <div
                    className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${STATUS_CLS[inv.status]}`}
                    key={inv.memberId}
                    title={`${m.name}: ${inv.status}`}
                  >
                    <span
                      className={`h-4 w-4 rounded-full ${avatarBg(mi)} flex shrink-0 items-center justify-center font-bold text-[8px] text-white`}
                    >
                      {m.avatar}
                    </span>
                    <span>{m.name.split(" ")[0]}</span>
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_DOT[inv.status]}`}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Discussion points */}
        {event.type === "meeting" && event.discussionPoints.length > 0 && (
          <div>
            <div className="mb-2 font-semibold text-[#7A6555] text-xs uppercase tracking-wider">
              Discussion Points
            </div>
            <div className="space-y-2">
              {event.discussionPoints.map((dp, i) => (
                <div
                  className="rounded-xl border border-[#3D3330] bg-[#232120] p-3"
                  key={dp.id}
                >
                  <div className="mb-1 flex items-center gap-2">
                    <span className="font-mono text-[#7A6555] text-xs">
                      {i + 1}.
                    </span>
                    <span className="font-medium text-[#FFEDD1] text-sm">
                      {dp.title}
                    </span>
                  </div>
                  {dp.notes && (
                    <p className="mb-2 pl-5 text-[#C4A882] text-xs">
                      {dp.notes}
                    </p>
                  )}
                  {dp.votingEnabled && (
                    <div className="grid grid-cols-3 gap-2 pl-5">
                      {(["for", "abstain", "against"] as const).map((g) => {
                        const cls =
                          g === "for"
                            ? "text-emerald-400"
                            : g === "against"
                              ? "text-rose-400"
                              : "text-amber-400";
                        return (
                          <div className="text-center" key={g}>
                            <div
                              className={`font-bold text-xs capitalize ${cls}`}
                            >
                              {g}
                            </div>
                            <div className="text-[#C4A882] text-[10px]">
                              {dp.votes[g]
                                .map(
                                  (id) =>
                                    MEMBERS.find(
                                      (m) => m.id === id
                                    )?.name.split(" ")[0]
                                )
                                .join(", ") || "—"}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Linked files */}
        {(event.linkedFiles.length > 0 || event.localFiles.length > 0) && (
          <div>
            <div className="mb-2 font-semibold text-[#7A6555] text-xs uppercase tracking-wider">
              Files
            </div>
            <div className="space-y-1">
              {event.linkedFiles.map((fid) => {
                const f = FILES.find((x) => x.id === fid);
                if (!f) {
                  return null;
                }
                const ext = f.name.split(".").pop() as string;
                return (
                  <a
                    className="flex items-center gap-2 rounded-lg border border-[#3D3330] bg-[#232120] p-2 transition-colors hover:border-[#F0684D]/40"
                    href={f.url}
                    key={fid}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <span className="text-sm">
                      {FILE_ICON[ext] ?? FILE_ICON.other}
                    </span>
                    <span className="truncate text-[#FFEDD1] text-xs">
                      {f.name}
                    </span>
                  </a>
                );
              })}
              {event.localFiles.map((name, i) => (
                <div
                  className="flex items-center gap-2 rounded-lg border border-[#3D3330] bg-[#232120] p-2"
                  key={i}
                >
                  <span className="text-sm">📎</span>
                  <span className="truncate text-[#FFEDD1] text-xs">
                    {name}
                  </span>
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
          Close
        </button>
        <button
          className="flex-1 rounded-xl bg-[#F0684D] py-2 font-medium text-sm text-white transition-colors hover:bg-[#E05538]"
          onClick={onEdit}
        >
          ✏️ Edit
        </button>
      </div>
    </ModalShell>
  );
}
