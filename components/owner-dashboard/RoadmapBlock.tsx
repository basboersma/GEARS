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
import { useCallback, useEffect, useRef, useState } from "react";
import {
  addDays,
  DEPARTMENTS,
  DEPT_COLORS,
  diffDays,
  formatDate,
  INIT_ROADMAP,
  MONTH_NAMES,
  parseDate,
} from "./data";
import { MiniCalPicker } from "./MiniCalPicker";
import { Field, Inp, ModalHeader, ModalShell, Sel } from "./shared";
import type { RoadmapItem } from "./types";

const DEPT_COL_W = 110;
const ROW_H = 26;
const ROW_GAP = 4;
const HEADER_H = 32;

type SpanLabel = "1M" | "3M" | "6M" | "1Y";
const SPAN_MONTHS: Record<SpanLabel, number> = {
  "1M": 1,
  "3M": 3,
  "6M": 6,
  "1Y": 12,
};

function assignRows(items: RoadmapItem[]): (RoadmapItem & { row: number })[] {
  const sorted = [...items].sort((a, b) =>
    a.startDate.localeCompare(b.startDate)
  );
  const rowEnds: string[] = [];
  return sorted.map((item) => {
    const r = rowEnds.findIndex((end) => end < item.startDate);
    if (r === -1) {
      rowEnds.push(item.endDate);
      return { ...item, row: rowEnds.length - 1 };
    }
    rowEnds[r] = item.endDate;
    return { ...item, row: r };
  });
}

interface FormProps {
  initial?: RoadmapItem;
  onSave: (item: RoadmapItem) => void;
  onDelete?: () => void;
  onClose: () => void;
}
function RoadmapForm({ initial, onSave, onDelete, onClose }: FormProps) {
  const today = formatDate(new Date());
  const blank: RoadmapItem = {
    id: Date.now().toString(),
    title: "",
    department: "Mechanical",
    startDate: today,
    endDate: today,
    color: DEPT_COLORS.Mechanical,
    progress: 0,
  };
  const [item, setItem] = useState<RoadmapItem>(initial ?? blank);
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);
  const set = (p: Partial<RoadmapItem>) =>
    setItem((prev) => ({ ...prev, ...p }));
  const fmtBtn = (d: string) =>
    d
      ? parseDate(d).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
        })
      : "Select date";
  return (
    <ModalShell onClose={onClose} width="max-w-md">
      <ModalHeader
        onClose={onClose}
        title={initial ? "Edit Item" : "Add Item"}
      />
      <div className="flex-1 space-y-4 overflow-auto p-5">
        <Field label="Title">
          <Inp
            onChange={(v) => set({ title: v })}
            placeholder="Item title…"
            value={item.title}
          />
        </Field>
        <Field label="Department">
          <Sel
            onChange={(v) =>
              set({
                department: v,
                color: DEPT_COLORS[v] ?? DEPT_COLORS.Mechanical,
              })
            }
            value={item.department}
          >
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Sel>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Start date">
            <div className="relative">
              <button
                className="w-full rounded-lg border border-[#3D3330] bg-[#232120] px-3 py-2 text-left text-[#FFEDD1] text-sm transition-colors hover:border-[#F0684D]/40"
                onClick={() => {
                  setShowStart(!showStart);
                  setShowEnd(false);
                }}
              >
                {fmtBtn(item.startDate)}
              </button>
              {showStart && (
                <MiniCalPicker
                  onChange={(v) => {
                    set({ startDate: v });
                    setShowStart(false);
                  }}
                  onClose={() => setShowStart(false)}
                  value={item.startDate}
                />
              )}
            </div>
          </Field>
          <Field label="End date">
            <div className="relative">
              <button
                className="w-full rounded-lg border border-[#3D3330] bg-[#232120] px-3 py-2 text-left text-[#FFEDD1] text-sm transition-colors hover:border-[#F0684D]/40"
                onClick={() => {
                  setShowEnd(!showEnd);
                  setShowStart(false);
                }}
              >
                {fmtBtn(item.endDate)}
              </button>
              {showEnd && (
                <MiniCalPicker
                  onChange={(v) => {
                    set({ endDate: v });
                    setShowEnd(false);
                  }}
                  onClose={() => setShowEnd(false)}
                  value={item.endDate}
                />
              )}
            </div>
          </Field>
        </div>
        <Field label={`Progress: ${item.progress}%`}>
          <input
            className="w-full accent-[#F0684D]"
            max={100}
            min={0}
            onChange={(e) => set({ progress: Number(e.target.value) })}
            type="range"
            value={item.progress}
          />
        </Field>
        <div className="flex items-center gap-2 text-[#C4A882] text-sm">
          <span
            className="h-3 w-3 rounded-full"
            style={{ background: item.color }}
          />
          <span>{item.department}</span>
        </div>
      </div>
      <div className="flex shrink-0 gap-2 border-[#3D3330] border-t px-5 py-4">
        {onDelete && (
          <button
            className="rounded-xl border border-[#F0684D]/25 bg-[#F0684D]/10 px-4 py-2 text-[#F0684D] text-sm transition-colors hover:bg-[#F0684D]/20"
            onClick={onDelete}
          >
            Delete
          </button>
        )}
        <button
          className="flex-1 rounded-xl border border-[#3D3330] bg-[#232120] py-2 text-[#C4A882] text-sm transition-colors hover:bg-[#2E2B2A]"
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          className="flex-1 rounded-xl bg-[#F0684D] py-2 font-medium text-sm text-white transition-colors hover:bg-[#E05538]"
          onClick={() => {
            if (item.title.trim()) {
              onSave(item);
            }
          }}
        >
          {initial ? "Save" : "Add"}
        </button>
      </div>
    </ModalShell>
  );
}

interface DragState {
  type: "move" | "resize-left" | "resize-right";
  id: string;
  startX: number;
  initialStart: string;
  initialEnd: string;
}

export function RoadmapBlock() {
  const [items, setItems] = useState<RoadmapItem[]>(INIT_ROADMAP);
  const [viewStart, setViewStart] = useState<Date>(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [span, setSpan] = useState<SpanLabel>("1M");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<RoadmapItem | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [deptOrder, setDeptOrder] = useState<string[]>(DEPARTMENTS);
  const [rowDragging, setRowDragging] = useState<string | null>(null);
  const [rowDragOver, setRowDragOver] = useState<string | null>(null);
  const [dayWidth, setDayWidth] = useState(36);
  const scrollRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const spanMonths = SPAN_MONTHS[span];
  const viewEnd = (() => {
    const d = new Date(viewStart);
    d.setMonth(d.getMonth() + spanMonths);
    d.setDate(d.getDate() - 1);
    return d;
  })();
  const viewStartStr = formatDate(viewStart);
  const viewEndStr = formatDate(viewEnd);

  const totalDays = diffDays(viewStartStr, viewEndStr) + 1;
  const dayLabels = Array.from({ length: totalDays }, (_, i) =>
    addDays(viewStart, i)
  );

  useEffect(() => {
    if (!scrollRef.current) {
      return;
    }
    const obs = new ResizeObserver(() => {
      if (scrollRef.current) {
        setDayWidth(
          Math.max(
            span === "1M" ? 24 : span === "3M" ? 10 : 5,
            (scrollRef.current.clientWidth - DEPT_COL_W) / totalDays
          )
        );
      }
    });
    obs.observe(scrollRef.current);
    return () => obs.disconnect();
  }, [totalDays, span]);

  const goToday = () => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    setViewStart(d);
  };

  const nav = (dir: 1 | -1) =>
    setViewStart((d) => {
      const r = new Date(d);
      r.setMonth(r.getMonth() + dir * spanMonths);
      r.setDate(1);
      return r;
    });

  const dateToX = useCallback(
    (dateStr: string): number => {
      return diffDays(viewStartStr, dateStr) * dayWidth;
    },
    [dayWidth, viewStartStr]
  );

  const pxToDays = (px: number) => Math.round(px / dayWidth);
  const shiftDate = (dateStr: string, days: number): string =>
    formatDate(addDays(parseDate(dateStr), days));

  const saveItem = (item: RoadmapItem) => {
    setItems((prev) =>
      prev.some((x) => x.id === item.id)
        ? prev.map((x) => (x.id === item.id ? item : x))
        : [...prev, item]
    );
    setCreating(false);
    setEditing(null);
  };
  const deleteItem = (id: string) => {
    setItems((prev) => prev.filter((x) => x.id !== id));
    setEditing(null);
  };

  useEffect(() => {
    if (!drag) {
      return;
    }
    const onMove = (e: MouseEvent) => {
      const dx = e.clientX - drag.startX;
      const days = pxToDays(dx);
      if (days === 0) {
        return;
      }
      if (drag.type === "move") {
        setItems((prev) =>
          prev.map((x) =>
            x.id !== drag.id
              ? x
              : {
                  ...x,
                  startDate: shiftDate(drag.initialStart, days),
                  endDate: shiftDate(drag.initialEnd, days),
                }
          )
        );
      } else if (drag.type === "resize-left") {
        const newStart = shiftDate(drag.initialStart, days);
        if (newStart < drag.initialEnd) {
          setItems((prev) =>
            prev.map((x) =>
              x.id !== drag.id ? x : { ...x, startDate: newStart }
            )
          );
        }
      } else {
        const newEnd = shiftDate(drag.initialEnd, days);
        if (newEnd > drag.initialStart) {
          setItems((prev) =>
            prev.map((x) => (x.id !== drag.id ? x : { ...x, endDate: newEnd }))
          );
        }
      }
    };
    const onUp = () => setDrag(null);
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, [drag, pxToDays, shiftDate]);

  const handleRowDrop = (targetDept: string) => {
    if (!rowDragging || rowDragging === targetDept) {
      return;
    }
    setDeptOrder((prev) => {
      const next = prev.filter((d) => d !== rowDragging);
      const idx = next.indexOf(targetDept);
      next.splice(idx, 0, rowDragging);
      return next;
    });
    setRowDragging(null);
    setRowDragOver(null);
  };

  const deptItems = deptOrder.map((dept) => ({
    dept,
    color: DEPT_COLORS[dept],
    rows: assignRows(
      items.filter(
        (x) =>
          x.department === dept &&
          x.startDate <= viewEndStr &&
          x.endDate >= viewStartStr
      )
    ),
  }));

  // Compute month boundary positions for markers
  const monthBoundaries: { x: number; label: string }[] = [];
  if (span !== "1M") {
    let cur = new Date(viewStart);
    while (cur <= viewEnd) {
      const y = cur.getFullYear(),
        m = cur.getMonth();
      const dayOffset = diffDays(viewStartStr, formatDate(cur));
      monthBoundaries.push({
        x: dayOffset * dayWidth,
        label: `${MONTH_NAMES[m].slice(0, 3)}${span === "1Y" ? ` '${String(y).slice(2)}` : ""}`,
      });
      cur = new Date(y, m + 1, 1);
    }
  }

  const renderHeaderCells = () => {
    if (span === "1M") {
      return dayLabels.map((d, i) => {
        const today = new Date();
        const isToday =
          d.getFullYear() === today.getFullYear() &&
          d.getMonth() === today.getMonth() &&
          d.getDate() === today.getDate();
        return (
          <div
            className={`flex shrink-0 flex-col items-center justify-center border-[#3D3330]/40 border-r last:border-0 ${isToday ? "bg-[#F0684D]/10" : ""}`}
            key={i}
            style={{ width: dayWidth }}
          >
            <span
              className={`font-semibold text-[9px] ${isToday ? "text-[#F0684D]" : "text-[#7A6555]"}`}
            >
              {d.getDate()}
            </span>
            {dayWidth > 20 && (
              <span className="text-[#5A4A3E] text-[8px]">
                {["M", "T", "W", "T", "F", "S", "S"][(d.getDay() + 6) % 7]}
              </span>
            )}
          </div>
        );
      });
    }
    const months: { label: string; days: number }[] = [];
    let cur = new Date(viewStart);
    while (cur <= viewEnd) {
      const y = cur.getFullYear(),
        m = cur.getMonth();
      const monthEnd = new Date(y, m + 1, 0);
      const end = monthEnd < viewEnd ? monthEnd : viewEnd;
      const days = diffDays(formatDate(cur), formatDate(end)) + 1;
      months.push({
        label: `${MONTH_NAMES[m].slice(0, 3)}${span === "1Y" ? ` '${String(y).slice(2)}` : ""}`,
        days,
      });
      cur = new Date(y, m + 1, 1);
    }
    return months.map((mo, i) => (
      <div
        className="flex shrink-0 items-center justify-center border-[#3D3330]/60 border-r last:border-0"
        key={i}
        style={{ width: mo.days * dayWidth }}
      >
        <span className="font-semibold text-[#C4A882] text-[10px]">
          {mo.label}
        </span>
      </div>
    ));
  };

  const navLabel =
    span === "1M"
      ? `${MONTH_NAMES[viewStart.getMonth()]} ${viewStart.getFullYear()}`
      : `${MONTH_NAMES[viewStart.getMonth()]} – ${MONTH_NAMES[viewEnd.getMonth()]} ${viewEnd.getFullYear()}`;

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="mb-2 flex shrink-0 flex-wrap items-center gap-2">
        <button
          className="flex h-6 w-6 items-center justify-center rounded-lg text-[#7A6555] text-sm hover:bg-[#2E2B2A] hover:text-[#FFEDD1]"
          onClick={() => nav(-1)}
        >
          ‹
        </button>
        <span className="min-w-0 font-semibold text-[#FFEDD1] text-sm">
          {navLabel}
        </span>
        <button
          className="flex h-6 w-6 items-center justify-center rounded-lg text-[#7A6555] text-sm hover:bg-[#2E2B2A] hover:text-[#FFEDD1]"
          onClick={() => nav(1)}
        >
          ›
        </button>
        <button
          className="rounded-md border border-[#3D3330] bg-[#232120] px-2 py-0.5 font-semibold text-[#C4A882] text-[10px] transition-colors hover:border-[#F0684D]/40 hover:text-[#F0684D]"
          onClick={goToday}
        >
          Today
        </button>
        {/* Span selector */}
        <div className="flex rounded-lg border border-[#3D3330] bg-[#232120] p-0.5">
          {(["1M", "3M", "6M", "1Y"] as SpanLabel[]).map((s) => (
            <button
              className={`rounded-md px-2 py-0.5 font-semibold text-[10px] transition-colors ${span === s ? "bg-[#F0684D] text-white" : "text-[#7A6555] hover:text-[#FFEDD1]"}`}
              key={s}
              onClick={() => setSpan(s)}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <div className="flex flex-wrap gap-2">
          {DEPARTMENTS.map((d) => (
            <div
              className="flex items-center gap-1 text-[#C4A882] text-[10px]"
              key={d}
            >
              <span
                className="h-2 w-2 rounded-sm"
                style={{ background: DEPT_COLORS[d] }}
              />
              {d}
            </div>
          ))}
        </div>
        <button
          className="rounded-lg bg-[#F0684D] px-3 py-1.5 font-semibold text-white text-xs transition-colors hover:bg-[#E05538]"
          onClick={() => setCreating(true)}
        >
          + Add
        </button>
      </div>

      {/* Gantt grid — single scroll container */}
      <div
        className="min-h-0 flex-1 overflow-auto rounded-xl border border-[#3D3330]"
        ref={scrollRef}
      >
        <div
          ref={gridRef}
          style={{ minWidth: DEPT_COL_W + totalDays * dayWidth }}
        >
          {/* Sticky header row */}
          <div
            className="sticky top-0 z-20 flex border-[#3D3330] border-b bg-[#232120]"
            style={{ height: HEADER_H }}
          >
            {/* Corner cell - sticky left AND top */}
            <div
              className="sticky left-0 z-30 shrink-0 border-[#3D3330] border-r bg-[#232120]"
              style={{ width: DEPT_COL_W }}
            />
            {/* Date/month header cells */}
            <div className="flex" style={{ minWidth: totalDays * dayWidth }}>
              {renderHeaderCells()}
            </div>
          </div>

          {/* Today line */}
          {(() => {
            const today = new Date();
            const todayStr = formatDate(today);
            if (todayStr >= viewStartStr && todayStr <= viewEndStr) {
              const x = DEPT_COL_W + dateToX(todayStr) + dayWidth / 2;
              return (
                <div
                  className="pointer-events-none absolute top-0 bottom-0 z-10"
                  style={{ left: x, width: 1.5, background: "#F0684D60" }}
                />
              );
            }
          })()}

          {/* Department rows */}
          {deptItems.map(({ dept, color, rows }) => {
            const numRows = Math.max(
              1,
              rows.length > 0 ? Math.max(...rows.map((r) => r.row)) + 1 : 1
            );
            const h = numRows * (ROW_H + ROW_GAP) + ROW_GAP;
            const isDragTarget = rowDragOver === dept;
            return (
              <div
                className="relative flex border-[#3D3330] border-b"
                key={dept}
                style={{
                  height: h,
                  outline: isDragTarget ? "2px solid #F0684D40" : "none",
                  outlineOffset: -1,
                }}
              >
                {/* Sticky dept label */}
                <div
                  className="sticky left-0 z-10 flex shrink-0 cursor-grab select-none items-center justify-center gap-1.5 border-[#3D3330] border-r bg-[#232120]"
                  draggable
                  onDragEnd={() => {
                    setRowDragging(null);
                    setRowDragOver(null);
                  }}
                  onDragLeave={() => setRowDragOver(null)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setRowDragOver(dept);
                  }}
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = "move";
                    setRowDragging(dept);
                  }}
                  onDrop={() => handleRowDrop(dept)}
                  style={{
                    width: DEPT_COL_W,
                    opacity: rowDragging === dept ? 0.4 : 1,
                  }}
                >
                  <span className="select-none text-[#3D3330] text-[10px]">
                    ⠿
                  </span>
                  <span
                    className="truncate rounded px-2 py-0.5 font-bold text-[10px]"
                    style={{ background: `${color}22`, color }}
                  >
                    {dept}
                  </span>
                </div>
                {/* Timeline area */}
                <div
                  className="relative flex-1"
                  style={{
                    background: `${color}08`,
                    minWidth: totalDays * dayWidth,
                  }}
                >
                  {/* Month boundary lines */}
                  {span !== "1M" &&
                    monthBoundaries.slice(1).map((mb, i) => (
                      <div
                        className="pointer-events-none absolute top-0 bottom-0"
                        key={i}
                        style={{
                          left: mb.x,
                          width: 1,
                          background: "#3D3330",
                        }}
                      />
                    ))}
                  {/* Day grid lines */}
                  <div className="pointer-events-none absolute inset-0 flex">
                    {dayLabels.map((_, i) => (
                      <div
                        className="shrink-0 border-[#3D3330]/20 border-r"
                        key={i}
                        style={{ width: dayWidth }}
                      />
                    ))}
                  </div>
                  {rows.map((item) => {
                    const clampStart =
                      item.startDate < viewStartStr
                        ? viewStartStr
                        : item.startDate;
                    const clampEnd =
                      item.endDate > viewEndStr ? viewEndStr : item.endDate;
                    const x = dateToX(clampStart);
                    const w = Math.max(
                      dayWidth - 2,
                      (diffDays(clampStart, clampEnd) + 1) * dayWidth - 2
                    );
                    const y = ROW_GAP + item.row * (ROW_H + ROW_GAP);
                    return (
                      <div
                        className="group absolute cursor-grab select-none rounded active:cursor-grabbing"
                        key={item.id}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          setEditing(item);
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDrag({
                            type: "move",
                            id: item.id,
                            startX: e.clientX,
                            initialStart: item.startDate,
                            initialEnd: item.endDate,
                          });
                        }}
                        style={{
                          left: x + 1,
                          top: y,
                          width: w,
                          height: ROW_H,
                          background: color,
                          opacity: 0.92,
                        }}
                      >
                        <div
                          className="absolute top-0 bottom-0 left-0 z-10 w-2 cursor-ew-resize rounded-l hover:bg-black/20"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setDrag({
                              type: "resize-left",
                              id: item.id,
                              startX: e.clientX,
                              initialStart: item.startDate,
                              initialEnd: item.endDate,
                            });
                          }}
                        />
                        <div className="relative flex h-full items-center gap-1.5 overflow-hidden px-2">
                          {item.progress > 0 && (
                            <div
                              className="absolute bottom-0 left-0 h-1 rounded-bl"
                              style={{
                                width: `${item.progress}%`,
                                background: "rgba(255,255,255,0.45)",
                              }}
                            />
                          )}
                          <span className="z-10 truncate font-semibold text-[10px] text-white leading-tight">
                            {item.title}
                          </span>
                          {item.progress > 0 && span === "1M" && (
                            <span className="z-10 shrink-0 text-[9px] text-white/70">
                              {item.progress}%
                            </span>
                          )}
                        </div>
                        <div
                          className="absolute top-0 right-0 bottom-0 z-10 w-2 cursor-ew-resize rounded-r hover:bg-black/20"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setDrag({
                              type: "resize-right",
                              id: item.id,
                              startX: e.clientX,
                              initialStart: item.startDate,
                              initialEnd: item.endDate,
                            });
                          }}
                        />
                      </div>
                    );
                  })}
                  {rows.length === 0 && (
                    <div className="absolute inset-0 flex items-center pl-3">
                      <span className="text-[#4A3F38] text-[10px]">
                        No items this period
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {creating && (
        <RoadmapForm onClose={() => setCreating(false)} onSave={saveItem} />
      )}
      {editing && (
        <RoadmapForm
          initial={editing}
          onClose={() => setEditing(null)}
          onDelete={() => deleteItem(editing.id)}
          onSave={saveItem}
        />
      )}
    </div>
  );
}
