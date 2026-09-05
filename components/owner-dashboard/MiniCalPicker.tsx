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
  addDays,
  DAY_SHORT,
  formatDate,
  isSameDay,
  MONTH_NAMES,
  parseDate,
} from "./data";

interface Props {
  value: string; // YYYY-MM-DD
  onChange: (d: string) => void;
  onClose?: () => void;
  inline?: boolean; // render without absolute positioning
}

export function MiniCalPicker({ value, onChange, onClose, inline }: Props) {
  const today = new Date();
  const selected = value ? parseDate(value) : null;
  const [viewDate, setViewDate] = useState<Date>(() => {
    if (value) {
      const d = parseDate(value);
      d.setDate(1);
      return d;
    }
    const d = new Date(today);
    d.setDate(1);
    return d;
  });

  const prevMonth = () =>
    setViewDate((d) => {
      const r = new Date(d);
      r.setMonth(r.getMonth() - 1);
      return r;
    });
  const nextMonth = () =>
    setViewDate((d) => {
      const r = new Date(d);
      r.setMonth(r.getMonth() + 1);
      return r;
    });

  const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const startOffset = (firstDay.getDay() + 6) % 7; // Mon=0
  const gridStart = addDays(firstDay, -startOffset);
  const cells: Date[] = Array.from({ length: 42 }, (_, i) =>
    addDays(gridStart, i)
  );

  const cls = inline
    ? "bg-[#232120] border border-[#3D3330] rounded-xl p-3 w-60"
    : "absolute z-40 top-full left-0 mt-1 bg-[#232120] border border-[#3D3330] rounded-xl shadow-2xl p-3 w-60";

  return (
    <div className={cls} onClick={(e) => e.stopPropagation()}>
      <div className="mb-2 flex items-center justify-between">
        <button
          className="flex h-6 w-6 items-center justify-center rounded text-[#C4A882] text-lg hover:bg-[#232120] hover:text-[#FFEDD1]"
          onClick={prevMonth}
        >
          ‹
        </button>
        <span className="font-semibold text-[#FFEDD1] text-sm">
          {MONTH_NAMES[viewDate.getMonth()]} {viewDate.getFullYear()}
        </span>
        <button
          className="flex h-6 w-6 items-center justify-center rounded text-[#C4A882] text-lg hover:bg-[#232120] hover:text-[#FFEDD1]"
          onClick={nextMonth}
        >
          ›
        </button>
      </div>
      <div className="mb-1 grid grid-cols-7">
        {DAY_SHORT.map((d) => (
          <div
            className="py-0.5 text-center font-semibold text-[#7A6555] text-[9px]"
            key={d}
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px">
        {cells.map((d, i) => {
          const isToday = isSameDay(d, today);
          const isSel = selected && isSameDay(d, selected);
          const isCurMonth = d.getMonth() === viewDate.getMonth();
          return (
            <button
              className={[
                "mx-auto flex h-7 w-7 items-center justify-center rounded-full text-xs transition-colors",
                isSel
                  ? "bg-[#F0684D] font-semibold text-white"
                  : isToday
                    ? "bg-rose-600 font-semibold text-white"
                    : isCurMonth
                      ? "text-[#FFEDD1] hover:bg-[#232120]"
                      : "text-[#7A6555] hover:bg-[#232120]",
              ].join(" ")}
              key={i}
              onClick={() => {
                onChange(formatDate(d));
                onClose?.();
              }}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
