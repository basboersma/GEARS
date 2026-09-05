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
  avatarBg,
  DAY_SHORT,
  formatDate,
  getMonday,
  HEADER_H,
  HOUR_H,
  HOURS,
  INIT_EVENTS,
  isSameDay,
  MEMBERS,
  MONTH_NAMES,
  ORDERS,
  TIME_COL_W,
} from "./data";
import { EventDetailModal } from "./EventDetailModal";
import { EventFormModal } from "./EventFormModal";
import { RoadmapBlock } from "./RoadmapBlock";
import type { CalEvent, CalView, InviteStatus, Order } from "./types";

const STATUS_DOT: Record<InviteStatus, string> = {
  accepted: "bg-emerald-400",
  pending: "bg-amber-400",
  declined: "bg-rose-400",
};

interface DragState {
  type: "move" | "resize-bottom" | "resize-top";
  eventId: string;
  offsetRows: number;
  initialDate: string;
  initialStart: string;
  initialEnd: string;
}
interface MonthDrag {
  eventId: string;
  targetDate: string;
}
interface Ghost {
  date: string;
  startTime: string;
  endTime: string;
}

function timeToFrac(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h - HOURS[0] + m / 60;
}
function fracToTime(frac: number): string {
  const clamped = Math.max(0, Math.min(HOURS.length - 0.5, frac));
  const total = Math.round(clamped * 60);
  const h = Math.floor(total / 60) + HOURS[0];
  const m = total % 60;
  return `${String(Math.min(23, h)).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function OrderPopup({ order, onClose }: { order: Order; onClose: () => void }) {
  const total = order.items.reduce((s, i) => s + i.qty * i.price, 0);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm animate-slide-up rounded-2xl border border-[#3D3330] bg-[#2A2724] p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-[#FFEDD1]">{order.title}</h2>
            <div className="text-[#7A6555] text-xs">
              {order.date} · {order.startTime}
            </div>
          </div>
          <button
            className="text-[#7A6555] text-sm hover:text-[#FFEDD1]"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <div className="mb-4 space-y-2">
          {order.items.map((item, i) => (
            <div className="flex items-center justify-between text-sm" key={i}>
              <span className="text-[#C4A882]">{item.name}</span>
              <div className="flex items-center gap-3">
                <span className="text-[#7A6555] text-xs">×{item.qty}</span>
                <span className="font-medium text-[#FFEDD1]">
                  €{item.qty * item.price}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between border-[#3D3330] border-t pt-3">
          <span className="text-[#C4A882] text-sm">Total</span>
          <span className="font-bold text-[#FFEDD1]">€{total}</span>
        </div>
      </div>
    </div>
  );
}

function HoverTooltip({
  event,
  x,
  y,
}: {
  event: CalEvent;
  x: number;
  y: number;
}) {
  const statusCount = (s: InviteStatus) =>
    event.invitees.filter((i) => i.status === s).length;
  return (
    <div
      className="pointer-events-none fixed z-[200] animate-fade-in"
      style={{
        left: Math.min(x + 14, window.innerWidth - 220),
        top: Math.max(8, y - 8),
      }}
    >
      <div className="w-52 rounded-xl border border-[#3D3330] bg-[#2A2724] p-3 text-xs shadow-xl">
        <div className="mb-1.5 flex items-center gap-2">
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ background: event.color }}
          />
          <span className="truncate font-semibold text-[#FFEDD1]">
            {event.title}
          </span>
        </div>
        <div className="space-y-0.5 text-[#C4A882]">
          <div>
            {event.startTime} – {event.endTime}
          </div>
          {event.location && <div>{event.location}</div>}
          {event.invitees.length > 0 && (
            <div className="mt-1 flex gap-2">
              {statusCount("accepted") > 0 && (
                <span className="text-emerald-600">
                  ✓{statusCount("accepted")}
                </span>
              )}
              {statusCount("pending") > 0 && (
                <span className="text-amber-600">
                  ?{statusCount("pending")}
                </span>
              )}
              {statusCount("declined") > 0 && (
                <span className="text-[#F0684D]">
                  ✗{statusCount("declined")}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SyncModal({ onClose }: { onClose: () => void }) {
  const [id, setId] = useState("");
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm animate-slide-up rounded-2xl border border-[#3D3330] bg-[#2A2724] p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-[#FFEDD1]">Sync Google Calendar</h2>
          <button
            className="text-[#7A6555] text-sm hover:text-[#FFEDD1]"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <input
          className="mb-3 w-full rounded-lg border border-[#3D3330] bg-[#232120] px-3 py-2 text-[#FFEDD1] text-sm placeholder:text-[#7A6555] focus:border-[#F0684D] focus:outline-none"
          onChange={(e) => setId(e.target.value)}
          placeholder="calendar@group.calendar.google.com"
          value={id}
        />
        <div className="flex gap-2">
          <button
            className="flex-1 rounded-xl border border-[#3D3330] bg-[#232120] py-2 text-[#C4A882] text-sm hover:bg-[#2E2B2A]"
            onClick={onClose}
          >
            Cancel
          </button>
          <button className="flex-1 rounded-xl bg-[#F0684D] py-2 text-sm text-white hover:bg-[#E05538]">
            Connect
          </button>
        </div>
      </div>
    </div>
  );
}

export function CalendarBlock() {
  const [mode, setMode] = useState<"agenda" | "roadmap">("agenda");
  const [view, setView] = useState<CalView>("week");
  const [viewDate, setViewDate] = useState<Date>(() => getMonday(new Date()));
  const [events, setEvents] = useState<CalEvent[]>(INIT_EVENTS);
  const [search, setSearch] = useState("");
  const [personFilter, setPersonFilter] = useState<string | null>(null);
  const [showSync, setShowSync] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<CalEvent | null>(null);
  const [detail, setDetail] = useState<CalEvent | null>(null);
  const [orderPopup, setOrderPopup] = useState<Order | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [ghost, setGhost] = useState<Ghost | null>(null);
  const [monthDrag, setMonthDrag] = useState<MonthDrag | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(
    null
  );
  const gridRef = useRef<HTMLDivElement>(null);
  const eventIdsRef = useRef<Set<string>>(new Set());

  // Document-level hover tracking
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (dragState) {
        setHoveredId(null);
        setTooltipPos(null);
        return;
      }
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const closest = el?.closest("[data-event-id]");
      const id = closest?.getAttribute("data-event-id") ?? null;
      if (id && eventIdsRef.current.has(id)) {
        setHoveredId(id);
        setTooltipPos({ x: e.clientX, y: e.clientY });
      } else {
        setHoveredId(null);
        setTooltipPos(null);
      }
    };
    document.addEventListener("mousemove", onMove);
    return () => document.removeEventListener("mousemove", onMove);
  }, [dragState]);

  eventIdsRef.current = new Set(events.map((e) => e.id));

  const viewDates: Date[] = (() => {
    if (view === "day") {
      return [viewDate];
    }
    if (view === "week") {
      const mon = getMonday(viewDate);
      return Array.from({ length: 7 }, (_, i) => addDays(mon, i));
    }
    const y = viewDate.getFullYear(),
      m = viewDate.getMonth();
    return Array.from(
      { length: new Date(y, m + 1, 0).getDate() },
      (_, i) => new Date(y, m, i + 1)
    );
  })();
  const numCols = viewDates.length;

  const navTitle = (() => {
    if (view === "day") {
      return viewDate.toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });
    }
    if (view === "week") {
      const mon = getMonday(viewDate),
        sun = addDays(mon, 6);
      return `${mon.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${sun.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;
    }
    return `${MONTH_NAMES[viewDate.getMonth()]} ${viewDate.getFullYear()}`;
  })();

  const navigate = (dir: 1 | -1) =>
    setViewDate((d) => {
      if (view === "day") {
        return addDays(d, dir);
      }
      if (view === "week") {
        return addDays(d, dir * 7);
      }
      const r = new Date(d);
      r.setMonth(r.getMonth() + dir);
      return r;
    });

  const goToday = () => {
    const today = new Date();
    setViewDate(view === "week" ? getMonday(today) : today);
  };

  const filteredEvents = events.filter((ev) => {
    if (search && !ev.title.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (personFilter && !ev.invitees.some((i) => i.memberId === personFilter)) {
      return false;
    }
    return true;
  });
  const eventsForDate = (d: Date) =>
    filteredEvents.filter((ev) => ev.date === formatDate(d));
  const ordersForDate = (d: Date) =>
    ORDERS.filter((o) => o.date === formatDate(d));

  const startDrag = useCallback((e: React.MouseEvent, ev: CalEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setHoveredId(null);
    setTooltipPos(null);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragState({
      type: "move",
      eventId: ev.id,
      offsetRows: (e.clientY - rect.top) / HOUR_H,
      initialDate: ev.date,
      initialStart: ev.startTime,
      initialEnd: ev.endTime,
    });
    setGhost({ date: ev.date, startTime: ev.startTime, endTime: ev.endTime });
  }, []);

  const startResizeBottom = useCallback((e: React.MouseEvent, ev: CalEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragState({
      type: "resize-bottom",
      eventId: ev.id,
      offsetRows: 0,
      initialDate: ev.date,
      initialStart: ev.startTime,
      initialEnd: ev.endTime,
    });
    setGhost({ date: ev.date, startTime: ev.startTime, endTime: ev.endTime });
  }, []);

  const startResizeTop = useCallback((e: React.MouseEvent, ev: CalEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragState({
      type: "resize-top",
      eventId: ev.id,
      offsetRows: 0,
      initialDate: ev.date,
      initialStart: ev.startTime,
      initialEnd: ev.endTime,
    });
    setGhost({ date: ev.date, startTime: ev.startTime, endTime: ev.endTime });
  }, []);

  useEffect(() => {
    if (!dragState) {
      return;
    }
    const onMove = (e: MouseEvent) => {
      if (!gridRef.current) {
        return;
      }
      const rect = gridRef.current.getBoundingClientRect();
      const scrollTop = gridRef.current.scrollTop;
      const colW = (rect.width - TIME_COL_W) / numCols;

      if (dragState.type === "move") {
        const relX = e.clientX - rect.left - TIME_COL_W;
        const colIdx = Math.max(
          0,
          Math.min(numCols - 1, Math.floor(relX / colW))
        );
        const targetDate = viewDates[colIdx] ?? viewDates[0];
        const relY = e.clientY - rect.top + scrollTop - HEADER_H;
        const rawRow = relY / HOUR_H - dragState.offsetRows;
        const snapped = Math.round(rawRow * 2) / 2;
        const clamped = Math.max(0, Math.min(HOURS.length - 2, snapped));
        const startTime = fracToTime(clamped);
        const [sh, sm] = dragState.initialStart.split(":").map(Number);
        const [eh, em] = dragState.initialEnd.split(":").map(Number);
        const durMins = eh * 60 + em - (sh * 60 + sm);
        const [nsh, nsm] = startTime.split(":").map(Number);
        const endMins = nsh * 60 + nsm + durMins;
        const endTime = `${String(Math.min(23, Math.floor(endMins / 60))).padStart(2, "0")}:${String(endMins % 60).padStart(2, "0")}`;
        setGhost({ date: formatDate(targetDate), startTime, endTime });
      } else if (dragState.type === "resize-bottom") {
        const relY = e.clientY - rect.top + scrollTop - HEADER_H;
        const endFrac = Math.round((relY / HOUR_H) * 2) / 2;
        // endFrac is relative to HOURS[0]; compare against start position in same scale
        if (endFrac > timeToFrac(dragState.initialStart) + 0.5) {
          setGhost((g) =>
            g ? { ...g, endTime: fracToTime(Math.max(0, endFrac)) } : null
          );
        }
      } else if (dragState.type === "resize-top") {
        const relY = e.clientY - rect.top + scrollTop - HEADER_H;
        const startFrac = Math.round((relY / HOUR_H) * 2) / 2;
        if (startFrac < timeToFrac(dragState.initialEnd) - 0.5) {
          setGhost((g) =>
            g ? { ...g, startTime: fracToTime(Math.max(0, startFrac)) } : null
          );
        }
      }
    };
    const onUp = () => {
      if (ghost) {
        setEvents((prev) =>
          prev.map((ev) =>
            ev.id === dragState.eventId
              ? {
                  ...ev,
                  date: ghost.date,
                  startTime: ghost.startTime,
                  endTime: ghost.endTime,
                  endDate: ghost.date,
                }
              : ev
          )
        );
      }
      setDragState(null);
      setGhost(null);
      setHoveredId(null);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, [dragState, ghost, numCols, viewDates]);

  const startMonthDrag = useCallback((e: React.MouseEvent, ev: CalEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMonthDrag({ eventId: ev.id, targetDate: ev.date });
  }, []);

  useEffect(() => {
    if (!monthDrag) {
      return;
    }
    const onUp = () => {
      if (monthDrag.targetDate) {
        setEvents((prev) =>
          prev.map((ev) =>
            ev.id === monthDrag.eventId
              ? {
                  ...ev,
                  date: monthDrag.targetDate,
                  endDate: monthDrag.targetDate,
                }
              : ev
          )
        );
      }
      setMonthDrag(null);
    };
    document.addEventListener("mouseup", onUp);
    return () => document.removeEventListener("mouseup", onUp);
  }, [monthDrag]);

  const saveEvent = (ev: CalEvent) => {
    setEvents((prev) =>
      prev.some((e) => e.id === ev.id)
        ? prev.map((e) => (e.id === ev.id ? ev : e))
        : [...prev, ev]
    );
    setEditing(null);
    setCreating(false);
    if (detail?.id === ev.id) {
      setDetail(ev);
    }
  };

  const suggestions = search
    ? MEMBERS.filter(
        (m) =>
          m.name.toLowerCase().includes(search.toLowerCase()) && !personFilter
      )
    : [];

  const renderWeekDayGrid = () => {
    const today = new Date();
    const HANDLE = 7;
    return (
      <div
        className="flex min-h-0 flex-1 overflow-auto rounded-xl border border-[#3D3330] bg-[#2A2724]"
        ref={gridRef}
      >
        {/* Time column */}
        <div
          className="sticky left-0 z-10 shrink-0 border-[#3D3330] border-r bg-[#232120]"
          style={{
            width: TIME_COL_W,
            alignSelf: "flex-start",
            minHeight: "100%",
          }}
        >
          <div
            className="border-[#3D3330] border-b"
            style={{ height: HEADER_H }}
          />
          {HOURS.map((h) => (
            <div
              className="flex items-start justify-end border-[#3D3330]/30 border-b pr-2"
              key={h}
              style={{ height: HOUR_H }}
            >
              <span className="-mt-1.5 text-[#5A4A3E] text-[9px]">{h}:00</span>
            </div>
          ))}
        </div>
        {/* Day columns */}
        <div className="flex flex-1 bg-[#2A2724]">
          {viewDates.map((d, colIdx) => {
            const isToday = isSameDay(d, today);
            const colEvs = eventsForDate(d);
            const colOrders = ordersForDate(d);
            const dateStr = formatDate(d);
            return (
              <div
                className="min-w-[64px] flex-1 border-[#3D3330] border-r last:border-r-0"
                key={colIdx}
              >
                <div
                  className={`sticky top-0 z-10 flex flex-col items-center justify-center border-[#3D3330] border-b ${isToday ? "bg-[#F0684D]/10" : "bg-[#2A2724]"}`}
                  style={{ height: HEADER_H }}
                >
                  <span className="text-[#5A4A3E] text-[9px]">
                    {DAY_SHORT[colIdx % 7]}
                  </span>
                  <span
                    className={`font-semibold text-xs ${isToday ? "text-[#F0684D]" : "text-[#C4A882]"}`}
                  >
                    {d.getDate()}
                  </span>
                </div>
                <div className="relative">
                  {HOURS.map((h) => (
                    <div
                      className="border-[#3D3330]/20 border-b"
                      key={h}
                      style={{ height: HOUR_H }}
                    />
                  ))}
                  {isToday &&
                    (() => {
                      const now = new Date();
                      const frac =
                        now.getHours() - HOURS[0] + now.getMinutes() / 60;
                      if (frac < 0 || frac > HOURS.length) {
                        return null;
                      }
                      return (
                        <div
                          className="pointer-events-none absolute right-0 left-0 z-20 flex items-center"
                          style={{ top: frac * HOUR_H }}
                        >
                          <div className="-ml-1 h-2 w-2 rounded-full bg-[#F0684D]" />
                          <div className="h-px flex-1 bg-[#F0684D]/50" />
                        </div>
                      );
                    })()}

                  {colEvs.map((ev) => {
                    const isDragging = dragState?.eventId === ev.id;
                    const disp =
                      isDragging && ghost
                        ? {
                            ...ev,
                            startTime: ghost.startTime,
                            endTime: ghost.endTime,
                          }
                        : ev;
                    const top = timeToFrac(disp.startTime) * HOUR_H;
                    const [sh, sm] = disp.startTime.split(":").map(Number);
                    const [eh, em] = disp.endTime.split(":").map(Number);
                    const height = Math.max(
                      22,
                      ((eh * 60 + em - (sh * 60 + sm)) / 60) * HOUR_H - 2
                    );
                    return (
                      <div
                        className="absolute inset-x-0.5 select-none rounded-md"
                        data-event-id={ev.id}
                        key={ev.id}
                        style={{
                          top,
                          height,
                          opacity: isDragging ? 0.5 : 1,
                          background: `${ev.color}20`,
                          borderLeft: `3px solid ${ev.color}`,
                          zIndex: 2,
                        }}
                      >
                        <div
                          className="absolute right-0 left-0 z-10 cursor-n-resize hover:bg-black/5"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            if (!dragState) {
                              startResizeTop(e, ev);
                            }
                          }}
                          style={{ height: HANDLE, top: 0 }}
                        />
                        <div
                          className="absolute right-0 left-0 cursor-grab overflow-hidden px-1.5 active:cursor-grabbing"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!dragState) {
                              setDetail(ev);
                            }
                          }}
                          onMouseDown={(e) => {
                            if (!dragState) {
                              startDrag(e, ev);
                            }
                          }}
                          style={{ top: HANDLE, bottom: HANDLE }}
                        >
                          <div
                            className="mt-0.5 truncate font-bold text-[9px] leading-tight"
                            style={{ color: ev.color }}
                          >
                            {ev.title}
                          </div>
                          <div
                            className="text-[8px] opacity-60"
                            style={{ color: ev.color }}
                          >
                            {disp.startTime}–{disp.endTime}
                          </div>
                          {ev.invitees.length > 0 && (
                            <div className="mt-0.5 flex flex-wrap gap-0.5">
                              {ev.invitees.slice(0, 6).map((inv) => (
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[inv.status]}`}
                                  key={inv.memberId}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                        <div
                          className="absolute right-0 left-0 z-10 cursor-s-resize hover:bg-black/5"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            if (!dragState) {
                              startResizeBottom(e, ev);
                            }
                          }}
                          style={{ height: HANDLE, bottom: 0 }}
                        />
                      </div>
                    );
                  })}

                  {colOrders.map((ord) => {
                    const top = timeToFrac(ord.startTime) * HOUR_H;
                    const [sh, sm] = ord.startTime.split(":").map(Number);
                    const [eh, em] = ord.endTime.split(":").map(Number);
                    const height = Math.max(
                      20,
                      ((eh * 60 + em - (sh * 60 + sm)) / 60) * HOUR_H - 2
                    );
                    return (
                      <div
                        className="absolute inset-x-0.5 cursor-pointer select-none rounded-md transition-opacity hover:opacity-80"
                        key={ord.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setOrderPopup(ord);
                        }}
                        style={{
                          top,
                          height,
                          background: "#FFD14233",
                          borderLeft: "3px solid #FFD142",
                          zIndex: 3,
                        }}
                      >
                        <div className="px-1.5 pt-0.5">
                          <div className="truncate font-bold text-[9px] text-amber-700">
                            {ord.title}
                          </div>
                          <div className="text-[8px] text-amber-600/70">
                            {ord.items.length} items
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {dragState?.type === "move" &&
                    ghost?.date === dateStr &&
                    (() => {
                      const [sh, sm] = ghost.startTime.split(":").map(Number);
                      const [eh, em] = ghost.endTime.split(":").map(Number);
                      const top = timeToFrac(ghost.startTime) * HOUR_H;
                      const height = Math.max(
                        22,
                        ((eh * 60 + em - (sh * 60 + sm)) / 60) * HOUR_H - 2
                      );
                      const origEv = events.find(
                        (e) => e.id === dragState.eventId
                      );
                      return (
                        <div
                          className="pointer-events-none absolute inset-x-0.5 z-10 rounded-md border-2 border-dashed"
                          style={{
                            top,
                            height,
                            background: `${origEv?.color}10`,
                            borderColor: `${origEv?.color}60`,
                          }}
                        />
                      );
                    })()}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderMonthGrid = () => {
    const today = new Date();
    const y = viewDate.getFullYear(),
      mo = viewDate.getMonth();
    const first = new Date(y, mo, 1);
    const offset = (first.getDay() + 6) % 7;
    const gridStart = addDays(first, -offset);
    const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
    const weeks = Array.from({ length: 6 }, (_, i) =>
      cells.slice(i * 7, (i + 1) * 7)
    );
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-[#3D3330]">
        <div className="grid grid-cols-7 border-[#3D3330] border-b bg-[#232120]">
          {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
            <div
              className="border-[#3D3330] border-r py-1.5 text-center font-semibold text-[#7A6555] text-[10px] last:border-0"
              key={d}
            >
              {d}
            </div>
          ))}
        </div>
        <div className="flex-1 overflow-auto bg-[#2A2724]">
          {weeks.map((week, wi) => (
            <div
              className="grid grid-cols-7 border-[#3D3330] border-b last:border-0"
              key={wi}
              style={{ minHeight: 72 }}
            >
              {week.map((d, di) => {
                const isCurMo = d.getMonth() === mo;
                const isToday = isSameDay(d, today);
                const dayEvs = eventsForDate(d);
                const dayOrds = ordersForDate(d);
                const dateStr = formatDate(d);
                const isTarget = monthDrag?.targetDate === dateStr;
                return (
                  <div
                    className={`border-[#3D3330] border-r p-1 transition-colors last:border-0 ${isCurMo ? "" : "opacity-30"} ${isTarget ? "bg-[#F0684D]/5" : ""}`}
                    key={di}
                    onMouseEnter={() =>
                      monthDrag &&
                      setMonthDrag((prev) =>
                        prev ? { ...prev, targetDate: dateStr } : null
                      )
                    }
                  >
                    <div
                      className={`mb-0.5 flex h-5 w-5 items-center justify-center rounded-full font-semibold text-[10px] ${isToday ? "bg-[#F0684D] text-white" : "text-[#C4A882]"}`}
                    >
                      {d.getDate()}
                    </div>
                    {dayOrds.map((ord) => (
                      <div
                        className="mb-0.5 w-full cursor-pointer truncate rounded px-1 py-0.5 text-[9px] hover:opacity-80"
                        key={ord.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setOrderPopup(ord);
                        }}
                        style={{ background: "#FFD14222", color: "#b45309" }}
                      >
                        {ord.title}
                      </div>
                    ))}
                    {dayEvs.slice(0, 2).map((ev) => (
                      <button
                        className={`mb-0.5 w-full select-none truncate rounded px-1 py-0.5 text-left font-medium text-[9px] ${monthDrag?.eventId === ev.id ? "opacity-30" : "hover:opacity-80"}`}
                        key={ev.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setDetail(ev);
                        }}
                        onMouseDown={(e) => startMonthDrag(e, ev)}
                        style={{ background: `${ev.color}22`, color: ev.color }}
                      >
                        {ev.startTime} {ev.title}
                      </button>
                    ))}
                    {dayEvs.length > 2 && (
                      <div className="text-[#7A6555] text-[8px]">
                        +{dayEvs.length - 2} more
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col gap-2">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center gap-2">
        <div className="flex shrink-0 rounded-lg border border-[#3D3330] bg-[#232120] p-0.5">
          {(["agenda", "roadmap"] as const).map((m) => (
            <button
              className={`rounded-md px-2.5 py-1 font-medium text-xs capitalize transition-colors ${mode === m ? "bg-[#F0684D] text-white" : "text-[#7A6555] hover:text-[#FFEDD1]"}`}
              key={m}
              onClick={() => setMode(m)}
            >
              {m === "agenda" ? "Agenda" : "Roadmap"}
            </button>
          ))}
        </div>

        {mode === "agenda" && (
          <>
            <button
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#3D3330] bg-[#232120] text-[#7A6555] text-xs hover:text-[#FFEDD1]"
              onClick={() => setShowSync(true)}
              title="Sync Google Calendar"
            >
              Sync
            </button>
            <div className="relative flex-1">
              <input
                className="w-full rounded-lg border border-[#3D3330] bg-[#232120] py-1.5 pr-3 pl-3 text-[#FFEDD1] text-xs transition-colors placeholder:text-[#7A6555] focus:border-[#F0684D] focus:outline-none"
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search events or members…"
                value={search}
              />
              {suggestions.length > 0 && (
                <div className="absolute top-full right-0 left-0 z-20 mt-0.5 overflow-hidden rounded-xl border border-[#3D3330] bg-[#2A2724] shadow-xl">
                  {suggestions.map((m, i) => (
                    <button
                      className="flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors hover:bg-[#232120]"
                      key={m.id}
                      onClick={() => {
                        setPersonFilter(m.id);
                        setSearch("");
                      }}
                    >
                      <span
                        className={`h-5 w-5 rounded-full ${avatarBg(i)} flex items-center justify-center font-bold text-[9px] text-white`}
                      >
                        {m.avatar}
                      </span>
                      <span className="text-[#FFEDD1]">{m.name}</span>
                      <span className="ml-auto text-[#7A6555]">{m.team}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {personFilter &&
              (() => {
                const m = MEMBERS.find((x) => x.id === personFilter);
                return m ? (
                  <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-[#F0684D]/25 bg-[#F0684D]/10 px-2 py-1 text-[#F0684D] text-xs">
                    <span>{m.name.split(" ")[0]}</span>
                    <button
                      className="hover:text-[#FFEDD1]"
                      onClick={() => setPersonFilter(null)}
                    >
                      ✕
                    </button>
                  </div>
                ) : null;
              })()}
            <div className="flex shrink-0 rounded-lg border border-[#3D3330] bg-[#232120] p-0.5">
              {(["day", "week", "month"] as CalView[]).map((v) => (
                <button
                  className={`rounded-md px-2.5 py-1 font-medium text-xs capitalize transition-colors ${view === v ? "bg-[#F0684D] text-white" : "text-[#7A6555] hover:text-[#FFEDD1]"}`}
                  key={v}
                  onClick={() => setView(v)}
                >
                  {v}
                </button>
              ))}
            </div>
          </>
        )}

        <button
          className="shrink-0 rounded-lg bg-[#F0684D] px-2.5 py-1.5 font-semibold text-white text-xs transition-colors hover:bg-[#E05538]"
          onClick={() => setCreating(true)}
        >
          + New
        </button>
      </div>

      {/* Navigation */}
      {mode === "agenda" && (
        <div className="flex shrink-0 items-center gap-2">
          <button
            className="flex h-6 w-6 items-center justify-center rounded-lg text-[#7A6555] text-sm hover:bg-[#2E2B2A] hover:text-[#FFEDD1]"
            onClick={() => navigate(-1)}
          >
            ‹
          </button>
          <span className="flex-1 text-center font-medium text-[#C4A882] text-xs">
            {navTitle}
          </span>
          <button
            className="flex h-6 w-6 items-center justify-center rounded-lg text-[#7A6555] text-sm hover:bg-[#2E2B2A] hover:text-[#FFEDD1]"
            onClick={() => navigate(1)}
          >
            ›
          </button>
          <button
            className="rounded-md border border-[#3D3330] bg-[#232120] px-2 py-0.5 font-semibold text-[#C4A882] text-[10px] transition-colors hover:border-[#F0684D]/40 hover:text-[#F0684D]"
            onClick={goToday}
          >
            Today
          </button>
        </div>
      )}

      {mode === "roadmap" ? (
        <RoadmapBlock />
      ) : view === "month" ? (
        renderMonthGrid()
      ) : (
        renderWeekDayGrid()
      )}

      {mode === "agenda" &&
        hoveredId &&
        !dragState &&
        tooltipPos &&
        (() => {
          const ev = events.find((e) => e.id === hoveredId);
          return ev ? (
            <HoverTooltip event={ev} x={tooltipPos.x} y={tooltipPos.y} />
          ) : null;
        })()}

      {showSync && <SyncModal onClose={() => setShowSync(false)} />}
      {creating && (
        <EventFormModal onClose={() => setCreating(false)} onSave={saveEvent} />
      )}
      {editing && (
        <EventFormModal
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={saveEvent}
        />
      )}
      {detail && !editing && (
        <EventDetailModal
          event={detail}
          onClose={() => setDetail(null)}
          onEdit={() => {
            setEditing(detail);
            setDetail(null);
          }}
        />
      )}
      {orderPopup && (
        <OrderPopup onClose={() => setOrderPopup(null)} order={orderPopup} />
      )}
    </div>
  );
}
