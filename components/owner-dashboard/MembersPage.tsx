// biome-ignore-all lint: Preserves the imported Member-Management interaction and visual design.
// biome-ignore-all assist/source/useSortedAttributes: Preserves the imported Member-Management JSX attribute order.
"use client";

import { ResponsiveChoropleth } from "@nivo/geo";
import { useRef, useState } from "react";
import { feature } from "topojson-client";
// @ts-ignore – world-atlas ships plain JSON, no TS declarations
import worldTopoRaw from "world-atlas/countries-110m.json";
import { countryForIso, isoForCountry } from "@/lib/countries";
import { avatarBg } from "./data";
import type { Member, TeamAssignment, TeamHistorySnapshot } from "./types";

const WORLD_FEATURES: any[] = (
  feature(worldTopoRaw as any, (worldTopoRaw as any).objects.countries) as any
).features;

// ─── Utilities ────────────────────────────────────────────────────────────────

const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

type DragTarget =
  | { kind: "dept"; dept: string }
  | { kind: "sublead"; dept: string }
  | { kind: "advisor" }
  | { kind: "treasurer" }
  | { kind: "unassigned" };

const PIE_COLORS = [
  "#F0684D",
  "#FFD142",
  "#4f6ef7",
  "#10b981",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#f59e0b",
];

const avatarIndex = (memberId: string): number =>
  Array.from(memberId).reduce((sum, char) => sum + char.charCodeAt(0), 0);

// Determine if a member was present at a given snapshot time.
const isInSnapshot = (
  memberId: string,
  snapshot: string | null,
  history: TeamHistorySnapshot[]
): boolean => {
  if (!snapshot) return true;
  const lifecycleEvents = history
    .filter(
      (entry) =>
        entry.memberId === memberId &&
        entry.departmentId === null &&
        entry.snapshotAt <= snapshot
    )
    .sort((a, b) => a.snapshotAt.localeCompare(b.snapshotAt));
  const latestLifecycleEvent = lifecycleEvents.at(-1);
  return latestLifecycleEvent ? !latestLifecycleEvent.removed : true;
};

// ─── SVG Pie chart ────────────────────────────────────────────────────────────

function PieChart({
  segments,
  total,
}: {
  segments: { label: string; value: number; color: string }[];
  total: number;
}) {
  const cx = 60,
    cy = 60,
    r = 52,
    ir = 28;
  let angle = -Math.PI / 2;
  const paths = segments.map((s) => {
    const sweep = (s.value / total) * Math.PI * 2;
    const x1 = cx + r * Math.cos(angle),
      y1 = cy + r * Math.sin(angle);
    angle += sweep;
    const x2 = cx + r * Math.cos(angle),
      y2 = cy + r * Math.sin(angle);
    return {
      ...s,
      d: `M ${cx} ${cy} L ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 ${sweep > Math.PI ? 1 : 0} 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z`,
    };
  });
  return (
    <svg viewBox="0 0 120 120" className="w-full h-full">
      {paths.map((p, i) => (
        <path key={i} d={p.d} fill={p.color} stroke="#232120" strokeWidth="1" />
      ))}
      <circle cx={cx} cy={cy} r={ir} fill="#232120" />
      <text
        x={cx}
        y={cy - 5}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#FFEDD1"
        fontSize="14"
        fontWeight="bold"
      >
        {total}
      </text>
      <text x={cx} y={cy + 9} textAnchor="middle" fill="#7A6555" fontSize="7">
        members
      </text>
    </svg>
  );
}

// ─── Pie Chart

type StatMetric = "Gender" | "Study" | "Nationality";

function PieStatsWidget({ members }: { members: Member[] }) {
  const [metric, setMetric] = useState<StatMetric>("Gender");
  const [open, setOpen] = useState(false);
  const total = members.length;
  const counts: Record<string, number> = {};
  members.forEach((m) => {
    const key =
      metric === "Gender"
        ? (m.gender ?? "Unknown")
        : metric === "Study"
          ? (m.study ?? "Unknown")
          : (m.nationality ?? "Unknown");
    counts[key] = (counts[key] ?? 0) + 1;
  });
  const segments = Object.entries(counts).map(([label, value], i) => ({
    label,
    value,
    color: PIE_COLORS[i % PIE_COLORS.length],
  }));
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2 shrink-0">
        <span className="text-[10px] font-semibold text-[#7A6555] uppercase tracking-wider">
          Members
        </span>
        <div className="relative">
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#2A2724] border border-[#3D3330] text-[10px] text-[#C4A882] hover:border-[#4A3F38]"
          >
            {metric} <span className="text-[8px]">{open ? "▲" : "▼"}</span>
          </button>
          {open && (
            <div className="absolute right-0 top-full mt-1 z-50 rounded-xl border border-[#3D3330] bg-[#232120] shadow-xl overflow-hidden min-w-[100px]">
              {(["Gender", "Study", "Nationality"] as StatMetric[]).map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setMetric(m);
                    setOpen(false);
                  }}
                  className={`w-full px-3 py-1.5 text-xs text-left transition-colors ${metric === m ? "text-[#F0684D] bg-[#F0684D]/10" : "text-[#C4A882] hover:bg-white/5 hover:text-[#FFEDD1]"}`}
                >
                  {m}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 min-h-0 min-w-0">
        {total > 0 && <PieChart segments={segments} total={total} />}
      </div>
      <div className="space-y-0.5 mt-1 shrink-0 max-h-16 overflow-auto">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-1.5">
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: s.color }}
            />
            <span className="text-[9px] text-[#C4A882] flex-1 truncate">
              {s.label}
            </span>
            <span className="text-[9px] font-bold text-[#FFEDD1]">
              {s.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

//  Members-over-time chart

type HistoryRange = "1W" | "1M" | "3M" | "6M" | "1Y";

const endOfDay = (date: Date) => {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
};

const weekNumber = (date: Date) => {
  const utcDate = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const day = utcDate.getUTCDay() || 7;
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
  return Math.ceil(
    ((utcDate.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7
  );
};

const historyBuckets = (range: HistoryRange) => {
  const now = new Date();
  if (range === "1W") {
    return Array.from({ length: 7 }, (_, index) => {
      const cutoff = new Date(now);
      cutoff.setDate(now.getDate() - (6 - index));
      return {
        cutoff: index === 6 ? now : endOfDay(cutoff),
        label: cutoff.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
        }),
      };
    });
  }
  if (range === "1M") {
    return Array.from({ length: 5 }, (_, index) => {
      const cutoff = new Date(now);
      cutoff.setDate(now.getDate() - (4 - index) * 7);
      return {
        cutoff: index === 4 ? now : endOfDay(cutoff),
        label: `W${weekNumber(cutoff)}`,
      };
    });
  }

  const count = range === "3M" ? 3 : range === "6M" ? 6 : 12;
  return Array.from({ length: count }, (_, index) => {
    const monthsAgo = count - 1 - index;
    const cutoff = new Date(
      now.getFullYear(),
      now.getMonth() - monthsAgo + 1,
      0,
      23,
      59,
      59,
      999
    );
    if (index === count - 1) {
      cutoff.setTime(now.getTime());
    }
    return {
      cutoff,
      label: cutoff.toLocaleDateString("en-GB", {
        month: "short",
        year: "2-digit",
      }),
    };
  });
};

function MembersOverTimeChart({
  departmentIds,
  departments,
  deptColors,
  history,
  activeSnapshot,
  onSnapshotChange,
}: {
  departmentIds: Record<string, string>;
  departments: string[];
  deptColors: Record<string, string>;
  history: TeamHistorySnapshot[];
  activeSnapshot: string | null;
  onSnapshotChange: (snapshotAt: string | null) => void;
}) {
  const [filter, setFilter] = useState<"total" | string>("total");
  const [range, setRange] = useState<HistoryRange>("6M");
  const [filterOpen, setFilterOpen] = useState(false);

  const buckets = historyBuckets(range);
  const lifecycleEvents = history.filter(
    (entry) => entry.departmentId === null
  );
  const assignmentSnapshots = history.filter(
    (entry) => entry.departmentId !== null && !entry.removed
  );
  const values = buckets.map(({ cutoff }) => {
    if (filter === "total") {
      const joinedMemberIds = new Set(
        lifecycleEvents
          .filter(
            (entry) => !entry.removed && new Date(entry.snapshotAt) <= cutoff
          )
          .map((entry) => entry.memberId)
      );
      for (const entry of lifecycleEvents) {
        if (entry.removed && new Date(entry.snapshotAt) <= cutoff) {
          joinedMemberIds.delete(entry.memberId);
        }
      }
      return joinedMemberIds.size;
    }

    const boundary = history
      .filter(
        (entry) =>
          new Date(entry.snapshotAt) <= cutoff &&
          (entry.departmentId !== null || entry.removed)
      )
      .map((entry) => entry.snapshotAt)
      .sort()
      .at(-1);
    if (!boundary) return 0;
    return new Set(
      assignmentSnapshots
        .filter(
          (entry) =>
            entry.snapshotAt === boundary &&
            entry.departmentId === departmentIds[filter]
        )
        .map((entry) => entry.memberId)
    ).size;
  });
  const maxVal = Math.max(...values, 1);
  const W = 400,
    H = 80,
    PAD = { l: 24, r: 8, t: 8, b: 20 };
  const iW = W - PAD.l - PAD.r,
    iH = H - PAD.t - PAD.b;
  const xScale = (i: number) =>
    PAD.l + (i / Math.max(buckets.length - 1, 1)) * iW;
  const yScale = (v: number) => PAD.t + iH - (v / maxVal) * iH;

  const points = values.map((v, i) => ({
    x: xScale(i),
    y: yScale(v),
    v,
    label: buckets[i].label,
    snapshotAt: buckets[i].cutoff.toISOString(),
  }));
  const linePath = points
    .map((p, i) =>
      i === 0
        ? `M ${p.x} ${p.y}`
        : `C ${(points[i - 1].x + p.x) / 2} ${points[i - 1].y} ${(points[i - 1].x + p.x) / 2} ${p.y} ${p.x} ${p.y}`
    )
    .join(" ");
  const areaPath = points.length
    ? `${linePath} L ${points[points.length - 1].x} ${H - PAD.b} L ${points[0].x} ${H - PAD.b} Z`
    : "";
  const lineColor =
    filter === "total" ? "#F0684D" : (deptColors[filter] ?? "#F0684D");

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2 shrink-0 gap-2 flex-wrap">
        <span className="text-[10px] font-semibold text-[#7A6555] uppercase tracking-wider">
          Members Over Time
        </span>
        <div className="flex items-center gap-1.5">
          <div className="relative">
            <button
              onClick={() => setFilterOpen((o) => !o)}
              className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#2A2724] border border-[#3D3330] text-[10px] text-[#C4A882] hover:border-[#4A3F38]"
            >
              {filter === "total" ? "Total" : filter}{" "}
              <span className="text-[8px]">{filterOpen ? "▲" : "▼"}</span>
            </button>
            {filterOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 rounded-xl border border-[#3D3330] bg-[#232120] shadow-xl overflow-hidden min-w-[110px]">
                {["total", ...departments].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      setFilter(opt);
                      setFilterOpen(false);
                    }}
                    className={`w-full px-3 py-1.5 text-xs text-left flex items-center gap-1.5 transition-colors ${filter === opt ? "text-[#F0684D] bg-[#F0684D]/10" : "text-[#C4A882] hover:bg-white/5 hover:text-[#FFEDD1]"}`}
                  >
                    {opt !== "total" && (
                      <span
                        className="w-1.5 h-1.5 rounded-sm shrink-0"
                        style={{ background: deptColors[opt] ?? "#888" }}
                      />
                    )}
                    {opt === "total" ? "Total" : opt}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-0.5">
            {(["1W", "1M", "3M", "6M", "1Y"] as HistoryRange[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-1.5 py-0.5 rounded text-[8px] font-semibold transition-colors ${range === r ? "bg-[#3D3330] text-[#FFEDD1]" : "text-[#7A6555] hover:text-[#C4A882]"}`}
              >
                {r}
              </button>
            ))}
          </div>
          {activeSnapshot && (
            <button
              onClick={() => onSnapshotChange(null)}
              className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-[9px] text-amber-400 hover:bg-amber-500/30"
            >
              {activeSnapshot} ✕
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 min-h-0 min-w-0">
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="flex-1">
          <defs>
            <linearGradient id="mot-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={lineColor} stopOpacity="0.25" />
              <stop offset="100%" stopColor={lineColor} stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {[0, 0.25, 0.5, 0.75, 1].map((f) => {
            const y = PAD.t + (1 - f) * (H - PAD.t - PAD.b);
            const v = Math.round(maxVal * f);
            return (
              <g key={f}>
                <line
                  x1={PAD.l}
                  x2={W - PAD.r}
                  y1={y}
                  y2={y}
                  stroke="#3D3330"
                  strokeWidth={0.5}
                />
                <text
                  x={PAD.l - 3}
                  y={y + 3}
                  textAnchor="end"
                  fontSize={7}
                  fill="#7A6555"
                >
                  {v}
                </text>
              </g>
            );
          })}
          {points.length > 1 && <path d={areaPath} fill="url(#mot-grad)" />}
          {points.length > 1 && (
            <path
              d={linePath}
              fill="none"
              stroke={lineColor}
              strokeWidth={0.75}
            />
          )}
          {points.map((p, i) => {
            const isActive = activeSnapshot === p.snapshotAt;
            return (
              <g
                key={i}
                className="cursor-pointer"
                onClick={() => onSnapshotChange(isActive ? null : p.snapshotAt)}
              >
                <title>{`${p.label}: ${p.v} member${p.v === 1 ? "" : "s"}`}</title>
                {isActive && (
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={5}
                    fill={lineColor}
                    opacity={0.25}
                  />
                )}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isActive ? 3 : 2}
                  fill={lineColor}
                />
                <text
                  x={p.x}
                  y={H - 6}
                  textAnchor="middle"
                  fontSize={7}
                  fill={isActive ? lineColor : "#7A6555"}
                  transform={
                    buckets.length > 6 ? `rotate(-35, ${p.x}, ${H - 6})` : ""
                  }
                >
                  {p.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

// ─── Choropleth world map (zoomable + pannable via projection params) ─────────

function ChoroplethMap({
  members,
  selectedIso,
  onCountryClick,
}: {
  members: Member[];
  selectedIso: string | null;
  onCountryClick: (iso: string | null) => void;
}) {
  const counts: Record<string, number> = {};
  members.forEach((m) => {
    const iso = m.nationality ? isoForCountry(m.nationality) : null;
    if (!iso) return;
    counts[iso] = (counts[iso] ?? 0) + 1;
  });
  const data = Object.entries(counts).map(([id, value]) => ({ id, value }));
  const maxCount = Math.max(1, ...Object.values(counts));

  // Default scale chosen so full world is visible; zoom/pan via nivo projection props
  const [projScale, setProjScale] = useState(75);
  const [projTx, setProjTx] = useState(0.5);
  const [projTy, setProjTy] = useState(0.56);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const clampScale = (s: number) => Math.min(800, Math.max(30, s));

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setProjScale((s) => clampScale(s * (e.deltaY < 0 ? 1.15 : 0.87)));
  };
  const onMouseDown = (e: React.MouseEvent) => {
    dragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current || !containerRef.current) return;
    const { clientWidth: W, clientHeight: H } = containerRef.current;
    setProjTx((tx) =>
      Math.min(2, Math.max(-1, tx + (e.clientX - lastPos.current.x) / W))
    );
    setProjTy((ty) =>
      Math.min(2, Math.max(-1, ty + (e.clientY - lastPos.current.y) / H))
    );
    lastPos.current = { x: e.clientX, y: e.clientY };
  };
  const onMouseUp = () => {
    dragging.current = false;
  };
  const resetView = () => {
    setProjScale(97);
    setProjTx(0.5);
    setProjTy(0.56);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2 shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold text-[#7A6555] uppercase tracking-wider">
            Nationality
          </span>
          {selectedIso && (
            <button
              onClick={() => onCountryClick(null)}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyan-500/20 border border-cyan-500/30 text-[9px] text-cyan-400 hover:bg-cyan-500/30"
            >
              {countryForIso(selectedIso) ?? selectedIso} ✕
            </button>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setProjScale((s) => clampScale(s * 1.3))}
            className="w-5 h-5 flex items-center justify-center rounded bg-[#2A2724] border border-[#3D3330] text-[#C4A882] hover:text-[#FFEDD1] text-xs"
          >
            +
          </button>
          <button
            onClick={() => setProjScale((s) => clampScale(s * 0.77))}
            className="w-5 h-5 flex items-center justify-center rounded bg-[#2A2724] border border-[#3D3330] text-[#C4A882] hover:text-[#FFEDD1] text-xs"
          >
            −
          </button>
          <button
            onClick={resetView}
            className="px-1.5 h-5 flex items-center justify-center rounded bg-[#2A2724] border border-[#3D3330] text-[9px] text-[#7A6555] hover:text-[#FFEDD1]"
          >
            ↺
          </button>
        </div>
      </div>
      <div
        ref={containerRef}
        className="flex-1 min-h-0 min-w-0 rounded-xl overflow-hidden bg-[#111B27] cursor-grab active:cursor-grabbing select-none"
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        <ResponsiveChoropleth
          data={data}
          features={WORLD_FEATURES}
          margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
          colors={["#22D3EE", "#FFD142"]}
          domain={[0, Math.max(maxCount, 1)]}
          unknownColor="#263C52"
          label="id"
          valueFormat=".0f"
          projectionType="naturalEarth1"
          projectionScale={projScale}
          projectionTranslation={[projTx, projTy]}
          graticuleLineColor="#35506B"
          graticuleLineWidth={0.5}
          borderWidth={0.75}
          borderColor="#0B1622"
          isInteractive={true}
          onClick={(f: any) => {
            const iso = f.id as string;
            onCountryClick(selectedIso === iso ? null : iso);
          }}
          tooltip={({ feature: f }: { feature: any }) => {
            const iso = f.id as string;
            const val = counts[iso] ?? 0;
            const name =
              countryForIso(iso) ?? (f as any).properties?.name ?? iso;
            return (
              <div
                style={{
                  background: "#232120",
                  border: "1px solid #3D3330",
                  color: "#FFEDD1",
                  padding: "4px 8px",
                  borderRadius: 8,
                  fontSize: 11,
                  pointerEvents: "none",
                }}
              >
                {name}
                {val ? (
                  <>
                    :{" "}
                    <strong>
                      {val} member{val > 1 ? "s" : ""}
                    </strong>
                  </>
                ) : (
                  " — no members"
                )}
                {val ? (
                  <div style={{ fontSize: 9, color: "#7A6555", marginTop: 2 }}>
                    Click to highlight in tree
                  </div>
                ) : null}
              </div>
            );
          }}
          theme={{
            background: "transparent",
            text: { fill: "#FFEDD1", fontSize: 11 },
          }}
        />
      </div>
    </div>
  );
}

// ─── Dept picker popup ─────────────────────────────────────────────────────────

function DeptPickerPopup({
  name,
  depts,
  deptColors,
  onClose,
  onInvite,
}: {
  name: string;
  depts: string[];
  deptColors: Record<string, string>;
  onClose: () => void;
  onInvite: (depts: string[]) => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const toggle = (d: string) =>
    setSelected((p) => (p.includes(d) ? p.filter((x) => x !== d) : [...p, d]));
  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xs rounded-2xl border border-[#3D3330] bg-[#2A2724] p-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold text-[#FFEDD1] text-sm">
              Invite {name}
            </h3>
            <p className="text-[10px] text-[#7A6555]">Select departments</p>
          </div>
          <button
            onClick={onClose}
            className="text-[#7A6555] hover:text-[#FFEDD1]"
          >
            ✕
          </button>
        </div>
        <div className="space-y-1 mb-4">
          {depts.map((d) => (
            <label
              key={d}
              className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl cursor-pointer hover:bg-white/5"
            >
              <input
                type="checkbox"
                checked={selected.includes(d)}
                onChange={() => toggle(d)}
                className="accent-[#F0684D] w-3.5 h-3.5"
              />
              <span
                className="w-2 h-2 rounded-sm shrink-0"
                style={{ background: deptColors[d] ?? "#888" }}
              />
              <span className="text-xs text-[#C4A882]">{d}</span>
            </label>
          ))}
        </div>
        <button
          disabled={selected.length === 0}
          onClick={() => {
            onInvite(selected);
            onClose();
          }}
          className="w-full py-2 rounded-xl text-sm bg-[#F0684D] text-white font-semibold hover:bg-[#E05538] disabled:opacity-40 transition-colors"
        >
          Send Invite
        </button>
      </div>
    </div>
  );
}

// ─── Invite panel (right side) ────────────────────────────────────────────────

interface OutsiderInvite {
  email: string;
  note: string;
  depts: string[];
}

function InvitePanel({
  members,
  depts,
  deptColors,
  departmentIds,
  organizationId,
  onClose,
}: {
  members: Member[];
  depts: string[];
  deptColors: Record<string, string>;
  departmentIds: Record<string, string>;
  organizationId: string;
  onClose: () => void;
}) {
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [emailError, setEmailError] = useState("");
  const [deptFilter, setDeptFilter] = useState<string>("all");
  const [deptFilterOpen, setDeptFilterOpen] = useState(false);
  const [invitingMember, setInvitingMember] = useState<Member | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [sentOutsiders, setSentOutsiders] = useState<OutsiderInvite[]>([]);
  const [invitedDepts, setInvitedDepts] = useState<Record<string, string[]>>(
    {}
  );
  const [sendError, setSendError] = useState("");

  const filtered = members.filter(
    (m) => deptFilter === "all" || m.department === deptFilter
  );

  const handleEmailClick = () => {
    if (!email.trim()) {
      setEmailError("Enter an email address");
      return;
    }
    if (!isValidEmail(email)) {
      setEmailError("Enter a valid email address");
      return;
    }
    setEmailError("");
    setPendingEmail(email.trim());
  };

  return (
    <div
      className="flex flex-col h-full bg-[#1E1C1B] border-l border-[#3D3330] overflow-hidden"
      style={{ width: 296, minWidth: 296 }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#3D3330] shrink-0">
        <h2 className="text-sm font-semibold text-[#FFEDD1]">Invite Members</h2>
        <button
          onClick={onClose}
          className="text-[#7A6555] hover:text-[#FFEDD1] text-sm"
        >
          ✕
        </button>
      </div>

      {/* Email invite */}
      <div className="px-3 py-3 border-b border-[#3D3330] shrink-0 space-y-2">
        <p className="text-[9px] font-semibold text-[#7A6555] uppercase tracking-wider">
          Invite by Student Email
        </p>
        <input
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setEmailError("");
          }}
          onKeyDown={(e) => e.key === "Enter" && handleEmailClick()}
          placeholder="student@university.nl"
          className={`w-full px-2.5 py-1.5 rounded-xl bg-[#2A2724] border text-xs text-[#FFEDD1] placeholder:text-[#7A6555] focus:outline-none transition-colors ${emailError ? "border-rose-500" : "border-[#3D3330] focus:border-[#F0684D]/60"}`}
        />
        {emailError && <p className="text-[9px] text-rose-400">{emailError}</p>}
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="Personal message (optional)…"
          className="w-full px-2.5 py-1.5 rounded-xl bg-[#2A2724] border border-[#3D3330] text-xs text-[#FFEDD1] placeholder:text-[#7A6555] focus:outline-none focus:border-[#F0684D]/60 resize-none transition-colors"
        />
        <button
          onClick={handleEmailClick}
          className="w-full py-1.5 rounded-xl bg-[#F0684D] text-white text-xs font-semibold hover:bg-[#E05538] transition-colors"
        >
          Send Invite Mail
        </button>
        {sentOutsiders.length > 0 && (
          <>
            <p className="text-[9px] font-semibold text-[#7A6555] uppercase tracking-wider pt-1">
              Sent Invite Mail
            </p>
            {sentOutsiders.map((o, i) => (
              <div
                key={"sent-" + i}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-[9px] text-emerald-400 truncate block">
                    {o.email}
                  </span>
                  {o.depts.length > 0 && (
                    <span className="text-[8px] text-emerald-400/60">
                      {o.depts.join(", ")}
                    </span>
                  )}
                </div>
              </div>
            ))}
            <p className="text-[9px] font-semibold text-[#7A6555] uppercase tracking-wider pt-1">
              Pending Outsider Invite
            </p>
            {sentOutsiders.map((o, i) => (
              <div
                key={"pending-" + i}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 animate-pulse" />
                <span className="text-[9px] text-amber-400 truncate flex-1">
                  {o.email}
                </span>
                <span className="text-[8px] text-amber-400/60">awaiting</span>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Member list — dept dropdown filter (ann 15), no text search (ann 17 removed) */}
      <div className="px-3 pt-3 pb-2 shrink-0">
        <div className="relative">
          <button
            onClick={() => setDeptFilterOpen((o) => !o)}
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl bg-[#2A2724] border border-[#3D3330] text-xs text-[#C4A882] hover:border-[#4A3F38]"
          >
            <span className="flex items-center gap-1.5">
              {deptFilter !== "all" && (
                <span
                  className="w-2 h-2 rounded-sm"
                  style={{ background: deptColors[deptFilter] ?? "#888" }}
                />
              )}
              {deptFilter === "all" ? "Invite Within GEARS" : deptFilter}
            </span>
            <span className="text-[8px]">{deptFilterOpen ? "▲" : "▼"}</span>
          </button>
          {deptFilterOpen && (
            <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl border border-[#3D3330] bg-[#232120] shadow-xl overflow-hidden">
              {["all", ...depts].map((d) => (
                <button
                  key={d}
                  onClick={() => {
                    setDeptFilter(d);
                    setDeptFilterOpen(false);
                  }}
                  className={`w-full px-3 py-1.5 text-xs text-left flex items-center gap-1.5 transition-colors ${deptFilter === d ? "text-[#F0684D] bg-[#F0684D]/10" : "text-[#C4A882] hover:bg-white/5 hover:text-[#FFEDD1]"}`}
                >
                  {d !== "all" && (
                    <span
                      className="w-1.5 h-1.5 rounded-sm shrink-0"
                      style={{ background: deptColors[d] ?? "#888" }}
                    />
                  )}
                  {d === "all" ? "Invite Within GEARS" : d}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto px-3 pb-3 space-y-1.5 min-h-0">
        {filtered.map((m) => {
          const invited = invitedDepts[m.id] ?? [];
          const isInvited = invited.length > 0;
          return (
            <div
              key={m.id}
              className="flex items-center gap-2 p-2 rounded-xl bg-[#2A2724] border border-[#3D3330]"
            >
              <div
                className={`w-7 h-7 rounded-full ${avatarBg(members.findIndex((member) => member.id === m.id))} flex items-center justify-center text-white text-xs font-bold shrink-0`}
              >
                {m.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-semibold text-[#FFEDD1] truncate">
                  {m.name}
                </div>
                {isInvited ? (
                  <div className="text-[9px] text-emerald-400 truncate">
                    {invited.join(", ")}
                  </div>
                ) : (
                  <div className="text-[9px] text-[#7A6555] truncate">
                    {m.role}
                  </div>
                )}
              </div>
              <button
                onClick={() => (isInvited ? null : setInvitingMember(m))}
                className={`px-2 py-1 rounded-lg text-[10px] font-semibold border transition-colors shrink-0 ${
                  isInvited
                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 cursor-default"
                    : "bg-[#F0684D]/15 text-[#F0684D] border-[#F0684D]/25 hover:bg-[#F0684D]/25"
                }`}
              >
                {isInvited ? "Invited" : "Invite"}
              </button>
            </div>
          );
        })}
      </div>

      {sendError && (
        <div className="px-3 pb-2 shrink-0">
          <p className="text-[10px] text-rose-400">{sendError}</p>
        </div>
      )}
      {invitingMember && (
        <DeptPickerPopup
          name={invitingMember.name}
          depts={depts}
          deptColors={deptColors}
          onClose={() => setInvitingMember(null)}
          onInvite={async (ds) => {
            setSendError("");
            const res = await fetch("/api/member-department-invitations", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                organizationId,
                memberId: invitingMember.id,
                departmentIds: ds.map((d) => departmentIds[d]).filter(Boolean),
              }),
            });
            if (!res.ok) {
              const body = await res.json().catch(() => null);
              setSendError(body?.error ?? "Failed to send invitation email.");
              return;
            }
            setInvitedDepts((prev) => ({
              ...prev,
              [invitingMember.id]: [
                ...new Set([...(prev[invitingMember.id] ?? []), ...ds]),
              ],
            }));
            setInvitingMember(null);
          }}
        />
      )}
      {pendingEmail && (
        <DeptPickerPopup
          name={pendingEmail}
          depts={depts}
          deptColors={deptColors}
          onClose={() => setPendingEmail(null)}
          onInvite={async (ds) => {
            setSendError("");
            const res = await fetch("/api/organization-invitations", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                organizationId,
                email: pendingEmail,
                departmentIds: ds.map((d) => departmentIds[d]).filter(Boolean),
              }),
            });
            if (!res.ok) {
              const body = await res.json().catch(() => null);
              setSendError(body?.error ?? "Failed to send invitation email.");
              return;
            }
            setSentOutsiders((p) => [
              ...p,
              { email: pendingEmail, note, depts: ds },
            ]);
            setEmail("");
            setNote("");
            setPendingEmail(null);
          }}
        />
      )}
    </div>
  );
}

// ─── Password modal ────────────────────────────────────────────────────────────

function PwModal({
  organizationId,
  title,
  desc,
  onConfirm,
  onClose,
}: {
  organizationId: string;
  title: string;
  desc?: string;
  onConfirm: (password: string) => void;
  onClose: () => void;
}) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const attempt = async () => {
    setChecking(true);
    setErr(null);
    try {
      const response = await fetch("/api/organization-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId, password: pw }),
      });
      const result = (await response.json().catch(() => null)) as {
        valid?: boolean;
        error?: string;
      } | null;
      if (response.ok && result?.valid === true) {
        onConfirm(pw);
        onClose();
        return;
      }
      setErr(result?.error ?? "Password verification failed.");
    } catch {
      setErr("Could not contact the password verification service.");
    } finally {
      setChecking(false);
    }
  };
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xs rounded-2xl border border-[#3D3330] bg-[#2A2724] p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-[#FFEDD1] text-sm">{title}</h3>
          <button
            onClick={onClose}
            className="text-[#7A6555] hover:text-[#FFEDD1]"
          >
            ✕
          </button>
        </div>
        {desc && <p className="text-[11px] text-[#7A6555] mb-3">{desc}</p>}
        <input
          type="password"
          value={pw}
          onChange={(e) => {
            setPw(e.target.value);
            setErr(null);
          }}
          onKeyDown={(e) => e.key === "Enter" && attempt()}
          placeholder="Your password…"
          autoFocus
          className={`w-full mt-3 px-3 py-2 rounded-xl bg-[#232120] border text-sm text-[#FFEDD1] placeholder:text-[#7A6555] focus:outline-none transition-colors ${err ? "border-rose-500" : "border-[#3D3330] focus:border-[#F0684D]"}`}
        />
        {err && <p className="text-[10px] text-rose-400 mt-1">{err}</p>}
        <div className="flex gap-2 mt-4">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-xl text-sm bg-[#232120] border border-[#3D3330] text-[#C4A882] hover:bg-[#2E2B2A]"
          >
            Cancel
          </button>
          <button
            disabled={checking || !pw}
            onClick={() => attempt().catch(() => undefined)}
            className="flex-1 py-2 rounded-xl text-sm bg-[#F0684D] text-white font-semibold hover:bg-[#E05538]"
          >
            {checking ? "Checking…" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Add department modal ──────────────────────────────────────────────────────

const PRESET_COLORS = [
  "#4f6ef7",
  "#10b981",
  "#f59e0b",
  "#f43f5e",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
];

function AddDeptModal({
  onContinue,
  onClose,
}: {
  onContinue: (name: string, color: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [error, setError] = useState<string | null>(null);
  const handleContinue = () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    setError(null);
    onContinue(trimmedName, color);
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xs rounded-2xl border border-[#3D3330] bg-[#2A2724] p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[#FFEDD1] text-sm">
            Add Department
          </h3>
          <button
            onClick={onClose}
            className="text-[#7A6555] hover:text-[#FFEDD1]"
          >
            ✕
          </button>
        </div>
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError(null);
          }}
          placeholder="Department name…"
          className="w-full px-3 py-2 rounded-xl bg-[#232120] border border-[#3D3330] text-sm text-[#FFEDD1] placeholder:text-[#7A6555] focus:outline-none focus:border-[#F0684D] mb-3"
        />
        <p className="text-[10px] text-[#7A6555] mb-2">Color</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {PRESET_COLORS.map((c) => (
            <button
              disabled={false}
              key={c}
              onClick={() => setColor(c)}
              className="w-6 h-6 rounded-lg"
              style={{
                background: c,
                outline: color === c ? `2px solid ${c}` : "none",
                outlineOffset: 2,
              }}
            />
          ))}
        </div>
        {error && <p className="mb-3 text-rose-400 text-xs">{error}</p>}
        <div className="flex gap-2">
          <button
            disabled={false}
            onClick={onClose}
            className="flex-1 py-2 rounded-xl text-sm bg-[#232120] border border-[#3D3330] text-[#C4A882]"
          >
            Cancel
          </button>
          <button
            disabled={!name.trim()}
            onClick={handleContinue}
            className="flex-1 py-2 rounded-xl text-sm bg-[#F0684D] text-white font-semibold disabled:opacity-40"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Member action modal ───────────────────────────────────────────────────────

function MemberActionModal({
  member,
  allDepts,
  extraDepts,
  deptColors,
  organizationId,
  onClose,
  onRemove,
  onStrike,
  onAddToDept,
  onRemoveFromDept,
  onSetRole,
}: {
  member: Member;
  allDepts: string[];
  extraDepts: string[];
  deptColors: Record<string, string>;
  organizationId: string;
  onClose: () => void;
  onRemove: (password: string) => Promise<void>;
  onStrike: (comment: string, file: File | null) => void;
  onAddToDept: (dept: string) => void;
  onRemoveFromDept: (dept: string) => void;
  onSetRole: (department: string, role: "advisor" | "treasurer") => void;
}) {
  const [tab, setTab] = useState<"strike" | "remove" | "depts">("strike");
  const [comment, setComment] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [pw, setPw] = useState("");
  const [pwErr, setPwErr] = useState<string | null>(null);
  const [pwChecking, setPwChecking] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const allMemberDepts = extraDepts;
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-[#3D3330] bg-[#2A2724] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 pb-3 border-b border-[#3D3330]">
          <div>
            <h3 className="font-semibold text-[#FFEDD1] text-sm">
              {member.name}
            </h3>
            <p className="text-[10px] text-[#7A6555] mt-0.5">
              {member.role} · {allMemberDepts.join(", ")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#7A6555] hover:text-[#FFEDD1] ml-3"
          >
            ✕
          </button>
        </div>
        <div className="flex gap-1 p-3 pb-0">
          {[
            [
              "strike",
              "Strike",
              "bg-orange-500/20 text-orange-400 border-orange-500/30",
            ],
            [
              "remove",
              "Remove",
              "bg-rose-500/20 text-rose-400 border-rose-500/30",
            ],
            [
              "depts",
              "Departments",
              "bg-[#4f6ef7]/20 text-[#4f6ef7] border-[#4f6ef7]/30",
            ],
          ].map(([k, l, ac]) => (
            <button
              key={k}
              onClick={() => setTab(k as typeof tab)}
              className={`flex-1 py-1.5 rounded-lg text-[10px] font-semibold border transition-all ${tab === k ? ac : "bg-[#232120] border-[#3D3330] text-[#9C8272]"}`}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="p-4 pt-3 space-y-3">
          {tab === "strike" && (
            <>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder="Reason for strike…"
                className="w-full bg-[#232120] border border-[#3D3330] rounded-xl px-3 py-2 text-sm text-[#FFEDD1] placeholder:text-[#7A6555] focus:outline-none focus:border-[#F0684D] resize-none"
              />
              <div
                className={`rounded-xl border-2 border-dashed px-3 py-3 text-center cursor-pointer transition-colors ${dragOver ? "border-[#F0684D] bg-[#F0684D]/8" : "border-[#3D3330] hover:border-[#7A6555]"}`}
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const f = e.dataTransfer.files[0];
                  if (f) setFile(f);
                }}
              >
                <input
                  ref={fileRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) setFile(e.target.files[0]);
                  }}
                />
                {file ? (
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-xs text-[#FFEDD1] truncate max-w-[180px]">
                      {file.name}
                    </span>
                    <button
                      className="text-[#7A6555] hover:text-[#F0684D] text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <span className="text-[10px] text-[#7A6555]">
                    Attach evidence — drag or click
                  </span>
                )}
              </div>
              <button
                onClick={() => {
                  onStrike(comment, file);
                  onClose();
                }}
                className="w-full py-2 rounded-xl text-sm bg-orange-500 text-white hover:bg-orange-600 font-semibold"
              >
                Issue Strike
              </button>
            </>
          )}
          {tab === "remove" && (
            <>
              <p className="text-xs text-[#C4A882]">
                Enter your password to remove{" "}
                <strong className="text-[#FFEDD1]">{member.name}</strong>.
              </p>
              <input
                type="password"
                value={pw}
                onChange={(e) => {
                  setPw(e.target.value);
                  setPwErr(null);
                }}
                placeholder="Your password…"
                className={`w-full px-3 py-2 rounded-xl bg-[#232120] border text-sm text-[#FFEDD1] placeholder:text-[#7A6555] focus:outline-none transition-colors ${pwErr ? "border-rose-500" : "border-[#3D3330] focus:border-[#F0684D]"}`}
              />
              {pwErr && <p className="text-[10px] text-rose-400">{pwErr}</p>}
              <button
                onClick={async () => {
                  setPwChecking(true);
                  setPwErr(null);
                  try {
                    const response = await fetch("/api/organization-password", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        organizationId,
                        password: pw,
                      }),
                    });
                    const result = (await response
                      .json()
                      .catch(() => null)) as {
                      valid?: boolean;
                      error?: string;
                    } | null;

                    if (!response.ok || result?.valid !== true) {
                      setPwErr(
                        result?.error ??
                          "Password verification failed. Check the server response."
                      );
                      return;
                    }

                    await onRemove(pw);
                    onClose();
                  } catch {
                    setPwErr(
                      "Could not contact the password verification service."
                    );
                  } finally {
                    setPwChecking(false);
                  }
                }}
                disabled={pwChecking || !pw}
                className="w-full py-2 rounded-xl text-sm bg-rose-600 text-white hover:bg-rose-700 font-semibold disabled:opacity-50"
              >
                {pwChecking ? "Checking…" : "Remove from Team"}
              </button>
            </>
          )}
          {tab === "depts" && (
            <>
              <div className="flex flex-wrap gap-1.5">
                {allMemberDepts.map((d) => (
                  <div
                    key={d}
                    className="flex items-center gap-1 pl-2 pr-1 py-1 rounded-lg"
                    style={{
                      background: (deptColors[d] ?? "#888") + "22",
                      border: "1px solid " + (deptColors[d] ?? "#888") + "44",
                    }}
                  >
                    <span
                      className="text-[10px] font-semibold"
                      style={{ color: deptColors[d] ?? "#888" }}
                    >
                      {d}
                    </span>
                    <button
                      onClick={() => onRemoveFromDept(d)}
                      className="text-[9px] opacity-50 hover:opacity-100 hover:text-rose-400 ml-0.5"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {allDepts
                  .filter((d) => !allMemberDepts.includes(d))
                  .map((d) => (
                    <button
                      key={d}
                      onClick={() => onAddToDept(d)}
                      className="px-2 py-1 rounded-lg text-[10px] border border-[#3D3330] text-[#9C8272] hover:text-[#FFEDD1] hover:border-[#4A3F38]"
                    >
                      + {d}
                    </button>
                  ))}
              </div>
              <div className="space-y-1 border-[#3D3330] border-t pt-2">
                <div className="font-semibold text-[#7A6555] text-[9px] uppercase tracking-wider">
                  Leadership roles
                </div>
                {allDepts.map((dept) => (
                  <div className="flex items-center gap-1.5" key={dept}>
                    <span className="flex-1 truncate text-[#C4A882] text-[10px]">
                      {dept}
                    </span>
                    <button
                      className="rounded border border-cyan-500/30 px-1.5 py-0.5 text-[9px] text-cyan-400"
                      onClick={() => onSetRole(dept, "advisor")}
                    >
                      Advisor
                    </button>
                    <button
                      className="rounded border border-amber-500/30 px-1.5 py-0.5 text-[9px] text-amber-400"
                      onClick={() => onSetRole(dept, "treasurer")}
                    >
                      Treasurer
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({
  member,
  size = "md",
  crossDept = false,
}: {
  member: Member;
  size?: "sm" | "md" | "lg";
  crossDept?: boolean;
}) {
  const cls =
    size === "sm"
      ? "w-6 h-6 text-[9px]"
      : size === "lg"
        ? "w-10 h-10 text-base"
        : "w-8 h-8 text-xs";
  return (
    <div
      className={`${cls} rounded-full ${avatarBg(avatarIndex(member.id))} flex items-center justify-center text-white font-bold shrink-0 relative ${crossDept ? "ring-2 ring-[#FFD142]/60 ring-offset-1 ring-offset-[#2A2724]" : ""}`}
    >
      {member.avatar}
      {member.isSubLead && (
        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-amber-400 border border-[#232120] flex items-center justify-center text-[6px] font-black text-black">
          ★
        </span>
      )}
      <span
        className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#232120] ${member.status === "active" ? "bg-emerald-400" : "bg-[#4a5568]"}`}
      />
    </div>
  );
}

function HighlightText({ text, q }: { text: string; q: string }) {
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-[#F0684D]/40 text-[#FFEDD1] rounded px-0.5">
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  );
}

// ─── Member card ──────────────────────────────────────────────────────────────

function MemberCard({
  member,
  q,
  isDragging,
  crossDept,
  highlightedIso,
  onDragStart,
  onClick,
  onRemove,
  removeLabel,
}: {
  member: Member;
  q: string;
  isDragging: boolean;
  crossDept: boolean;
  highlightedIso: string | null;
  onDragStart: () => void;
  onClick: () => void;
  onRemove?: () => void;
  removeLabel?: string;
}) {
  const match =
    q.trim() !== "" && member.name.toLowerCase().includes(q.toLowerCase());
  const countryMatch =
    highlightedIso !== null &&
    member.nationality != null &&
    isoForCountry(member.nationality) === highlightedIso;
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onClick={onClick}
      className={`flex items-center gap-2 px-2.5 py-2 rounded-xl border cursor-pointer select-none transition-all duration-150 ${isDragging ? "opacity-30 scale-95" : "hover:border-[#4A3F38]"} ${countryMatch ? "bg-cyan-500/10 border-cyan-500/40" : crossDept ? "bg-[#FFD142]/5 border-[#FFD142]/25" : match ? "border-[#F0684D] bg-[#F0684D]/10" : highlightedIso ? "opacity-30 border-[#3D3330] bg-[#2A2724]" : "border-[#3D3330] bg-[#2A2724]"}`}
    >
      <Avatar member={member} size="sm" crossDept={crossDept} />
      <div className="flex-1 min-w-0">
        <div
          className={`text-[11px] font-semibold truncate ${match ? "text-[#F0684D]" : crossDept ? "text-[#FFD142]" : "text-[#FFEDD1]"}`}
        >
          {match ? <HighlightText text={member.name} q={q} /> : member.name}
        </div>
        <div className="text-[9px] text-[#7A6555] truncate">{member.role}</div>
      </div>
      {/* Professional strike bars (ann 4) */}
      {member.strikes > 0 && (
        <div
          className="flex items-center gap-0.5 shrink-0"
          title={`${member.strikes} strike${member.strikes > 1 ? "s" : ""}`}
        >
          {Array.from({ length: Math.min(member.strikes, 5) }).map((_, i) => (
            <span
              key={i}
              className="w-1 h-3.5 rounded-sm bg-rose-500"
              style={{ opacity: 0.65 + i * 0.07 }}
            />
          ))}
        </div>
      )}
      {onRemove && (
        <button
          aria-label={removeLabel ?? `Release ${member.name}`}
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[9px] text-[#7A6555] transition-colors hover:bg-rose-400/10 hover:text-rose-400"
          onClick={(event) => {
            event.stopPropagation();
            onRemove();
          }}
          title={removeLabel ?? `Release ${member.name}`}
          type="button"
        >
          ✕
        </button>
      )}
    </div>
  );
}

// ─── Drop slot ────────────────────────────────────────────────────────────────

function DropSlot({
  label,
  active,
  onDragOver,
  onDragLeave,
  onDrop,
  children,
}: {
  label: string;
  active: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onDragOver(e);
      }}
      onDragLeave={onDragLeave}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onDrop();
      }}
      className={`rounded-xl border-2 border-dashed transition-all min-h-[36px] p-1.5 ${active ? "border-[#F0684D] bg-[#F0684D]/10" : "border-[#3D3330]/50 hover:border-[#4A3F38]"}`}
    >
      {children ?? (
        <div
          className={`text-[10px] text-center py-1 ${active ? "text-[#F0684D]" : "text-[#4A3F38]"}`}
        >
          {active ? `Drop to assign as ${label}` : `No ${label} assigned`}
        </div>
      )}
    </div>
  );
}

// ─── Dept column ──────────────────────────────────────────────────────────────

function DeptColumn({
  organizationId,
  dept,
  color,
  members,
  subLeadId,
  q,
  draggingId,
  dragTarget,
  setDragTarget,
  memberExtraDepts,
  deptColors,
  highlightedIso,
  onDrop,
  onDropSublead,
  onDragStart,
  onMemberClick,
  onRemoveDept,
  onRemoveSubLead,
  onRemoveMemberFromDept,
}: {
  organizationId: string;
  dept: string;
  color: string;
  members: Member[];
  subLeadId: string | null;
  q: string;
  draggingId: string | null;
  dragTarget: DragTarget | null;
  setDragTarget: (t: DragTarget | null) => void;
  memberExtraDepts: Record<string, string[]>;
  deptColors: Record<string, string>;
  highlightedIso: string | null;
  onDrop: (dept: string) => void;
  onDropSublead: (dept: string) => void;
  onDragStart: (id: string) => void;
  onMemberClick: (m: Member) => void;
  onRemoveDept: (dept: string, password: string) => void;
  onRemoveSubLead: (memberId: string, dept: string) => void;
  onRemoveMemberFromDept: (memberId: string, dept: string) => void;
}) {
  const subLead = members.find((m) => m.id === subLeadId) ?? null;
  const regularMembers = members.filter((m) => m.id !== subLead?.id);
  const isDeptTarget = dragTarget?.kind === "dept" && dragTarget.dept === dept;
  const isSubTarget =
    dragTarget?.kind === "sublead" && dragTarget.dept === dept;
  const [showRemoveDept, setShowRemoveDept] = useState(false);
  const [showRemoveSublead, setShowRemoveSublead] = useState(false);
  const isCrossDept = (m: Member) => (memberExtraDepts[m.id] ?? []).length > 0;
  return (
    <>
      <div
        onDragOver={(e) => {
          if (draggingId) {
            e.preventDefault();
            setDragTarget({ kind: "dept", dept });
          }
        }}
        onDragLeave={() => {
          if (dragTarget?.kind === "dept" && dragTarget.dept === dept)
            setDragTarget(null);
        }}
        onDrop={(e) => {
          e.preventDefault();
          onDrop(dept);
        }}
        className={`flex flex-col gap-2 rounded-2xl border p-3 transition-all min-w-[190px] max-w-[230px] flex-1 ${isDeptTarget ? "border-[#F0684D] bg-[#F0684D]/5" : "border-[#3D3330] bg-[#232120]"}`}
      >
        <div className="flex items-center gap-2 pb-2 border-b border-[#3D3330]">
          <span
            className="w-2.5 h-2.5 rounded-sm shrink-0"
            style={{ background: color }}
          />
          <span className="text-xs font-bold text-[#FFEDD1] flex-1 truncate">
            {dept}
          </span>
          <span
            className="text-[9px] font-semibold px-1.5 py-0.5 rounded"
            style={{ background: color + "22", color }}
          >
            {members.length}
          </span>
          <button
            onClick={() => setShowRemoveDept(true)}
            className="w-4 h-4 flex items-center justify-center rounded text-[#4A3F38] hover:text-rose-400 hover:bg-rose-400/10 text-[10px] shrink-0"
          >
            ✕
          </button>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="text-[9px] font-semibold text-[#7A6555] uppercase tracking-wider">
              Sub-lead
            </div>
            {subLead && (
              <button
                onClick={() => setShowRemoveSublead(true)}
                className="text-[9px] text-[#4A3F38] hover:text-rose-400 transition-colors px-1"
              >
                remove
              </button>
            )}
          </div>
          <DropSlot
            label="sub-lead"
            active={isSubTarget}
            onDragOver={() => setDragTarget({ kind: "sublead", dept })}
            onDragLeave={() => {
              if (isSubTarget) setDragTarget(null);
            }}
            onDrop={() => onDropSublead(dept)}
          >
            {subLead && (
              <MemberCard
                member={subLead}
                q={q}
                isDragging={draggingId === subLead.id}
                crossDept={isCrossDept(subLead)}
                highlightedIso={highlightedIso}
                onDragStart={() => onDragStart(subLead.id)}
                onClick={() => onMemberClick(subLead)}
                onRemove={() => onRemoveSubLead(subLead.id, dept)}
                removeLabel={`Release ${subLead.name} as sub-lead of ${dept}`}
              />
            )}
          </DropSlot>
        </div>
        <div className="flex flex-col gap-1.5 flex-1">
          <div className="text-[9px] font-semibold text-[#7A6555] uppercase tracking-wider">
            Members
          </div>
          {regularMembers.map((m) => (
            <MemberCard
              key={m.id}
              member={m}
              q={q}
              isDragging={draggingId === m.id}
              crossDept={isCrossDept(m)}
              highlightedIso={highlightedIso}
              onDragStart={() => onDragStart(m.id)}
              onClick={() => onMemberClick(m)}
              onRemove={() => onRemoveMemberFromDept(m.id, dept)}
              removeLabel={`Remove ${m.name} from ${dept}`}
            />
          ))}
          {regularMembers.length === 0 && (
            <div className="text-[10px] text-[#4A3F38] text-center py-2">
              No members
            </div>
          )}
        </div>
      </div>
      {showRemoveDept && (
        <PwModal
          organizationId={organizationId}
          title={`Remove: ${dept}`}
          desc="Members will be unassigned from this department."
          onConfirm={(password) => onRemoveDept(dept, password)}
          onClose={() => setShowRemoveDept(false)}
        />
      )}
      {showRemoveSublead && (
        <PwModal
          organizationId={organizationId}
          title="Remove Sub-lead"
          desc={`Remove ${subLead?.name ?? ""} as sub-lead of ${dept}?`}
          onConfirm={() => {
            if (subLead) onRemoveSubLead(subLead.id, dept);
            setShowRemoveSublead(false);
          }}
          onClose={() => setShowRemoveSublead(false)}
        />
      )}
    </>
  );
}

function Connector() {
  return <div className="w-px h-4 bg-[#3D3330] mx-auto" />;
}

function TreasurerSlot({
  member,
  q,
  draggingId,
  dragTarget,
  setDragTarget,
  onDrop,
  onDragStart,
  onMemberClick,
}: {
  member: Member | null;
  q: string;
  draggingId: string | null;
  dragTarget: DragTarget | null;
  setDragTarget: (t: DragTarget | null) => void;
  onDrop: () => void;
  onDragStart: (id: string) => void;
  onMemberClick: (m: Member) => void;
}) {
  const active = dragTarget?.kind === "treasurer";
  return (
    <div className="flex flex-col items-center">
      <Connector />
      <div
        className={`rounded-2xl border px-3 py-2.5 transition-all w-52 ${active ? "border-[#FFD142] bg-[#FFD142]/10" : "border-[#3D3330] bg-[#232120]"}`}
        onDragOver={(e) => {
          if (draggingId) {
            e.preventDefault();
            setDragTarget({ kind: "treasurer" });
          }
        }}
        onDragLeave={() => {
          if (active) setDragTarget(null);
        }}
        onDrop={(e) => {
          e.preventDefault();
          onDrop();
        }}
      >
        <div
          className="text-[9px] font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1.5"
          style={{ color: "#FFD142" }}
        >
          <span>◆</span> Treasurer
        </div>
        {member ? (
          <MemberCard
            member={member}
            q={q}
            isDragging={draggingId === member.id}
            crossDept={false}
            highlightedIso={null}
            onDragStart={() => onDragStart(member.id)}
            onClick={() => onMemberClick(member)}
          />
        ) : (
          <div
            className={`text-[10px] text-center py-1.5 border-2 border-dashed rounded-xl ${active ? "border-[#FFD142] text-[#FFD142]" : "border-[#3D3330] text-[#4A3F38]"}`}
          >
            {active ? "Drop to assign treasurer" : "Drop a member here"}
          </div>
        )}
      </div>
    </div>
  );
}

function LeadershipTree({
  advisor,
  lead,
  treasurer,
  draggingId,
  dragTarget,
  onDragStart,
  onDropRole,
  onRoleClick,
  onReleaseRole,
  setDragTarget,
}: {
  advisor: Member | null;
  lead: Member | null;
  treasurer: Member | null;
  draggingId: string | null;
  dragTarget: DragTarget | null;
  onDragStart: (id: string) => void;
  onDropRole: (role: "advisor" | "treasurer") => void;
  onRoleClick: (member: Member, role: "advisor" | "treasurer") => void;
  onReleaseRole: (
    memberId: string,
    role: "advisor" | "treasurer",
    removeBackingAssignment?: boolean
  ) => void;
  setDragTarget: (target: DragTarget | null) => void;
}) {
  const roleCard = (
    member: Member | null,
    role: "advisor" | "treasurer",
    label: string
  ) => {
    const active = dragTarget?.kind === role;
    return (
      <div
        className={`w-52 rounded-2xl border px-3 py-2.5 ${active ? "border-[#FFD142] bg-[#FFD142]/10" : "border-[#3D3330] bg-[#232120]"}`}
        onDragOver={(event) => {
          if (draggingId) {
            event.preventDefault();
            setDragTarget({ kind: role });
          }
        }}
        onDragLeave={() => {
          if (active) setDragTarget(null);
        }}
        onDrop={(event) => {
          event.preventDefault();
          onDropRole(role);
        }}
      >
        <div className="mb-1.5 font-semibold text-[#7A6555] text-[9px] uppercase tracking-wider">
          {label}
        </div>
        {member ? (
          <MemberCard
            member={member}
            q=""
            isDragging={draggingId === member.id}
            crossDept={false}
            highlightedIso={null}
            onDragStart={() => onDragStart(member.id)}
            onClick={() => onRoleClick(member, role)}
            onRemove={() => onReleaseRole(member.id, role, true)}
            removeLabel={`Release ${member.name} as ${label.toLowerCase()}`}
          />
        ) : (
          <div className="py-1.5 text-center text-[#4A3F38] text-[10px]">
            {active
              ? `Drop to assign ${label.toLowerCase()}`
              : `No ${label.toLowerCase()} assigned`}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-end gap-3">
        <div className="flex flex-col items-center gap-1">
          <div className="h-5 w-px bg-[#3D3330]" />
          {roleCard(treasurer, "treasurer", "Treasurer")}
        </div>
        <div className="mb-[52px] h-px w-8 bg-[#3D3330]" />
        <div className="flex flex-col items-center gap-1">
          <div className="w-52 rounded-2xl border border-[#F0684D]/50 bg-[#F0684D]/10 px-3 py-2.5">
            <div className="mb-1.5 font-semibold text-[#F0684D] text-[9px] uppercase tracking-wider">
              Lead
            </div>
            {lead ? (
              <MemberCard
                member={lead}
                q=""
                isDragging={false}
                crossDept={false}
                highlightedIso={null}
                onDragStart={() => onDragStart(lead.id)}
                onClick={() => undefined}
              />
            ) : (
              <div className="py-1.5 text-center text-[#4A3F38] text-[10px]">
                No owner assigned
              </div>
            )}
          </div>
          <div className="h-5 w-px bg-[#3D3330]" />
        </div>
        <div className="mb-[52px] h-px w-8 bg-[#3D3330]" />
        <div className="flex flex-col items-center gap-1">
          <div className="h-5 w-px bg-[#3D3330]" />
          {roleCard(advisor, "advisor", "Advisor")}
        </div>
      </div>
      <div className="h-5 w-px bg-[#3D3330]" />
    </div>
  );
}

function NonAssignedMembers({
  members,
  q,
  draggingId,
  active,
  highlightedIso,
  onDragStart,
  onDrop,
  onMemberClick,
  setDragTarget,
}: {
  members: Member[];
  q: string;
  draggingId: string | null;
  active: boolean;
  highlightedIso: string | null;
  onDragStart: (id: string) => void;
  onDrop: () => void;
  onMemberClick: (member: Member) => void;
  setDragTarget: (target: DragTarget | null) => void;
}) {
  return (
    <div
      className={`flex min-w-[190px] max-w-[230px] flex-1 flex-col gap-2 rounded-2xl border p-3 transition-all ${active ? "border-[#F0684D] bg-[#F0684D]/5" : "border-[#3D3330] bg-[#232120]"}`}
      onDragLeave={() => {
        if (active) setDragTarget(null);
      }}
      onDragOver={(event) => {
        if (draggingId) {
          event.preventDefault();
          setDragTarget({ kind: "unassigned" });
        }
      }}
      onDrop={(event) => {
        event.preventDefault();
        onDrop();
      }}
    >
      <div className="flex items-center gap-2 border-[#3D3330] border-b pb-2">
        <span className="h-2.5 w-2.5 shrink-0 rounded-sm bg-[#7A6555]" />
        <span className="flex-1 truncate font-bold text-[#FFEDD1] text-xs">
          Non Assigned Members
        </span>
        <span className="rounded bg-[#7A6555]/20 px-1.5 py-0.5 font-semibold text-[9px] text-[#9C8272]">
          {members.length}
        </span>
      </div>
      <div className="flex min-h-14 flex-col gap-1.5">
        {members.map((member) => (
          <MemberCard
            crossDept={false}
            highlightedIso={highlightedIso}
            isDragging={draggingId === member.id}
            key={member.id}
            member={member}
            onClick={() => onMemberClick(member)}
            onDragStart={() => onDragStart(member.id)}
            q={q}
          />
        ))}
        {members.length === 0 && (
          <div className="py-3 text-center text-[#4A3F38] text-[10px]">
            {active ? "Drop to unassign member" : "No unassigned members"}
          </div>
        )}
      </div>
    </div>
  );
}

function LeadershipActionModal({
  member,
  role,
  onClose,
  onRelease,
  onRemove,
}: {
  member: Member;
  role: "advisor" | "treasurer";
  onClose: () => void;
  onRelease: () => void;
  onRemove: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xs rounded-2xl border border-[#3D3330] bg-[#2A2724] p-5 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-[#FFEDD1] text-sm">
              {member.name}
            </h3>
            <p className="mt-0.5 text-[#7A6555] text-[11px] capitalize">
              {role}
            </p>
          </div>
          <button
            className="text-[#7A6555] hover:text-[#FFEDD1]"
            onClick={onClose}
            type="button"
          >
            ✕
          </button>
        </div>
        <div className="space-y-2">
          <button
            className="w-full rounded-xl bg-[#F0684D] py-2 font-semibold text-sm text-white hover:bg-[#E05538]"
            onClick={onRelease}
            type="button"
          >
            Release from Power
          </button>
          <button
            className="w-full rounded-xl bg-rose-600 py-2 font-semibold text-sm text-white hover:bg-rose-700"
            onClick={onRemove}
            type="button"
          >
            Remove from Team
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function MembersPage({
  initialDepartmentIds,
  initialOrganizationId,
  organizationSlug,
  initialMembers,
  initialDepartments,
  initialTeams,
  teamHistory,
  leadMemberId,
}: {
  initialMembers: Member[];
  initialDepartments: string[];
  initialDepartmentIds: Record<string, string>;
  initialOrganizationId: string;
  organizationSlug: string;
  initialTeams: TeamAssignment[];
  teamHistory: TeamHistorySnapshot[];
  leadMemberId: string | null;
}) {
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [departments, setDepartments] = useState<string[]>(initialDepartments);
  const [departmentIds, setDepartmentIds] = useState(initialDepartmentIds);
  const [teams, setTeams] = useState<TeamAssignment[]>(initialTeams);
  const [deptColors, setDeptColors] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      initialDepartments.map((department, index) => [
        department,
        PRESET_COLORS[index % PRESET_COLORS.length],
      ])
    )
  );
  const [subLeads, setSubLeads] = useState<Record<string, string | null>>({});
  const [q, setQ] = useState("");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragTarget, setDragTarget] = useState<DragTarget | null>(null);
  const [addingDept, setAddingDept] = useState(false);
  const [pendingDepartment, setPendingDepartment] = useState<{
    name: string;
    color: string;
  } | null>(null);
  const [actionMember, setActionMember] = useState<Member | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [historySnapshot, setHistorySnapshot] = useState<string | null>(null);
  const [selectedCountryIso, setSelectedCountryIso] = useState<string | null>(
    null
  );
  const [pendingTeamSave, setPendingTeamSave] = useState<
    TeamAssignment[] | null
  >(null);
  const [teamSaveError, setTeamSaveError] = useState<string | null>(null);
  const [leadershipAction, setLeadershipAction] = useState<{
    member: Member;
    role: "advisor" | "treasurer";
  } | null>(null);
  const [pendingMemberRemoval, setPendingMemberRemoval] =
    useState<Member | null>(null);

  // When a snapshot is active, only show members who had joined by that month
  const visibleMembers = historySnapshot
    ? members.filter((m) => isInSnapshot(m.id, historySnapshot, teamHistory))
    : members;
  const historicalTeams = historySnapshot
    ? (() => {
        const snapshotAt = teamHistory
          .filter(
            (entry) =>
              entry.snapshotAt <= historySnapshot &&
              (entry.departmentId !== null || entry.removed)
          )
          .map((entry) => entry.snapshotAt)
          .sort()
          .at(-1);
        return snapshotAt
          ? teamHistory.filter((entry) => entry.snapshotAt === snapshotAt)
          : [];
      })()
    : teams;

  const membersByDept = (dept: string) =>
    visibleMembers.filter((m) =>
      historicalTeams.some(
        (team) =>
          team.departmentId === departmentIds[dept] && team.memberId === m.id
      )
    );
  const unassignedMembers = visibleMembers.filter(
    (member) =>
      !historicalTeams.some(
        (assignment) =>
          assignment.memberId === member.id && assignment.departmentId !== null
      )
  );
  const assignedDepartmentsByMember = Object.fromEntries(
    members.map((member) => [
      member.id,
      teams
        .filter((assignment) => assignment.memberId === member.id)
        .map(
          (assignment) =>
            Object.entries(departmentIds).find(
              ([, id]) => id === assignment.departmentId
            )?.[0]
        )
        .filter((department): department is string => Boolean(department)),
    ])
  );

  const persistTeams = async (
    nextTeams: TeamAssignment[],
    password?: string
  ) => {
    if (historySnapshot) {
      setTeamSaveError("Return to the current view before changing teams.");
      return;
    }
    const currentDepartmentIds = new Set(Object.values(departmentIds));
    const validTeams = nextTeams.filter((team) =>
      currentDepartmentIds.has(team.departmentId)
    );
    if (!password) {
      setPendingTeamSave(validTeams);
      return;
    }
    setTeamSaveError(null);
    const response = await fetch("/api/organization-teams", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organizationId: initialOrganizationId,
        password,
        assignments: validTeams.map(
          ({ departmentId, memberId, isSubLead, isAdvisor, isTreasurer }) => ({
            departmentId,
            memberId,
            isSubLead,
            isAdvisor,
            isTreasurer,
          })
        ),
      }),
    });
    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      setTeamSaveError(result?.error ?? "Unable to save member tree changes.");
      return;
    }
    setTeams(validTeams);
    setPendingTeamSave(null);
  };

  const setTeamRole = (
    memberId: string,
    department: string,
    role: "advisor" | "treasurer"
  ) => {
    const departmentId = departmentIds[department];
    if (!departmentId) return;
    const nextTeams = teams
      .filter(
        (team) =>
          !(
            team[role === "advisor" ? "isAdvisor" : "isTreasurer"] &&
            team.memberId !== memberId
          )
      )
      .map((team) =>
        team.memberId === memberId && team.departmentId === departmentId
          ? {
              ...team,
              [role === "advisor" ? "isAdvisor" : "isTreasurer"]: true,
            }
          : team
      );
    const existing = nextTeams.find(
      (team) => team.memberId === memberId && team.departmentId === departmentId
    );
    persistTeams(
      existing
        ? nextTeams
        : [
            ...nextTeams,
            {
              id: crypto.randomUUID(),
              departmentId,
              memberId,
              isSubLead: false,
              isAdvisor: role === "advisor",
              isTreasurer: role === "treasurer",
            },
          ]
    ).catch(() => undefined);
  };

  const roleMember = (role: "isAdvisor" | "isTreasurer") => {
    const assignment = historicalTeams.find((team) => team[role]);
    return assignment
      ? (members.find((member) => member.id === assignment.memberId) ?? null)
      : null;
  };

  const handleDropRole = (role: "advisor" | "treasurer") => {
    if (!draggingId) return;
    const memberId = draggingId;
    const departmentId =
      teams.find((team) => team.memberId === memberId)?.departmentId ??
      Object.values(departmentIds)[0];
    if (!departmentId) return;
    const roleKey = role === "advisor" ? "isAdvisor" : "isTreasurer";
    const nextTeams = teams
      .filter((team) => !(team[roleKey] && team.memberId !== memberId))
      .map((team) =>
        team.memberId === memberId && team.departmentId === departmentId
          ? { ...team, [roleKey]: true }
          : team
      );
    if (
      !nextTeams.some(
        (team) =>
          team.memberId === memberId && team.departmentId === departmentId
      )
    ) {
      nextTeams.push({
        id: crypto.randomUUID(),
        departmentId,
        memberId,
        isSubLead: false,
        isAdvisor: role === "advisor",
        isTreasurer: role === "treasurer",
      });
    }
    persistTeams(nextTeams).catch(() => undefined);
    setDraggingId(null);
    setDragTarget(null);
  };

  const handleDrop = (targetDept: string) => {
    if (!draggingId) return;
    const departmentId = departmentIds[targetDept];
    setMembers((prev) =>
      prev.map((m) =>
        m.id === draggingId
          ? { ...m, department: targetDept, team: targetDept }
          : m
      )
    );
    if (departmentId) {
      const nextTeams = [
        ...teams.filter(
          (team) =>
            !(
              team.memberId === draggingId && team.departmentId !== departmentId
            )
        ),
      ];
      const existing = nextTeams.find(
        (team) =>
          team.memberId === draggingId && team.departmentId === departmentId
      );
      persistTeams(
        existing
          ? nextTeams.map((team) =>
              team.id === existing.id ? { ...team, isSubLead: false } : team
            )
          : [
              ...nextTeams,
              {
                id: crypto.randomUUID(),
                departmentId,
                memberId: draggingId,
                isSubLead: false,
                isAdvisor: false,
                isTreasurer: false,
              },
            ]
      ).catch(() => undefined);
    }
    setDraggingId(null);
    setDragTarget(null);
  };
  const handleDropSublead = (dept: string) => {
    if (!draggingId) return;
    const departmentId = departmentIds[dept];
    if (!departmentId) return;
    const memberId = draggingId;
    const nextTeams = teams
      .filter(
        (team) =>
          !(team.memberId === memberId && team.departmentId !== departmentId) &&
          !(team.departmentId === departmentId && team.isSubLead)
      )
      .map((team) =>
        team.memberId === memberId && team.departmentId === departmentId
          ? { ...team, isSubLead: true }
          : team
      );
    if (
      !nextTeams.some(
        (team) =>
          team.memberId === memberId && team.departmentId === departmentId
      )
    ) {
      nextTeams.push({
        id: crypto.randomUUID(),
        departmentId,
        memberId,
        isSubLead: true,
        isAdvisor: false,
        isTreasurer: false,
      });
    }
    persistTeams(nextTeams).catch(() => undefined);
    setDraggingId(null);
    setDragTarget(null);
  };
  const handleDropUnassigned = () => {
    if (!draggingId) return;
    persistTeams(teams.filter((team) => team.memberId !== draggingId)).catch(
      () => undefined
    );
    setDraggingId(null);
    setDragTarget(null);
  };
  const releaseTeamRole = (
    memberId: string,
    role: "advisor" | "treasurer",
    removeBackingAssignment = false
  ) => {
    const roleKey = role === "advisor" ? "isAdvisor" : "isTreasurer";
    const roleAssignmentIds = new Set(
      teams
        .filter((team) => team.memberId === memberId && team[roleKey])
        .map((team) => team.id)
    );
    const released = teams.map((team) =>
      roleAssignmentIds.has(team.id) ? { ...team, [roleKey]: false } : team
    );
    const nextTeams = removeBackingAssignment
      ? released.filter(
          (team) =>
            !(
              roleAssignmentIds.has(team.id) &&
              !team.isSubLead &&
              !team.isAdvisor &&
              !team.isTreasurer
            )
        )
      : released;
    persistTeams(nextTeams).catch(() => undefined);
  };
  const releaseSubLead = (memberId: string, dept: string) => {
    const departmentId = departmentIds[dept];
    persistTeams(
      teams.map((team) =>
        team.memberId === memberId && team.departmentId === departmentId
          ? { ...team, isSubLead: false }
          : team
      )
    ).catch(() => undefined);
  };
  const removeMemberFromDepartment = (memberId: string, dept: string) => {
    const departmentId = departmentIds[dept];
    const target = teams.find(
      (team) => team.memberId === memberId && team.departmentId === departmentId
    );
    if (!target) return;
    const otherAssignments = teams.filter(
      (team) => team.memberId === memberId && team.id !== target.id
    );
    if ((target.isAdvisor || target.isTreasurer) && !otherAssignments[0]) {
      setTeamSaveError(
        "Release the member's advisor or treasurer role before removing their final department."
      );
      return;
    }
    const nextTeams = teams
      .filter((team) => team.id !== target.id)
      .map((team) =>
        team.id === otherAssignments[0]?.id
          ? {
              ...team,
              isAdvisor: team.isAdvisor || target.isAdvisor,
              isTreasurer: team.isTreasurer || target.isTreasurer,
            }
          : team
      );
    persistTeams(nextTeams).catch(() => undefined);
  };
  const addMemberToDepartment = (memberId: string, dept: string) => {
    const departmentId = departmentIds[dept];
    if (
      !departmentId ||
      teams.some(
        (team) =>
          team.memberId === memberId && team.departmentId === departmentId
      )
    ) {
      return;
    }
    persistTeams([
      ...teams,
      {
        id: crypto.randomUUID(),
        departmentId,
        memberId,
        isSubLead: false,
        isAdvisor: false,
        isTreasurer: false,
      },
    ]).catch(() => undefined);
  };
  const removeMemberFromOrganization = async (
    memberId: string,
    password: string
  ) => {
    const response = await fetch(`/api/organization-members/${memberId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organizationId: initialOrganizationId,
        password,
      }),
    });
    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      setTeamSaveError(result?.error ?? "Unable to remove member.");
      return;
    }
    setMembers((current) => current.filter((member) => member.id !== memberId));
    setTeams((current) => current.filter((team) => team.memberId !== memberId));
    setActionMember(null);
    setPendingMemberRemoval(null);
  };
  const removeDepartment = async (department: string, password: string) => {
    const departmentId = departmentIds[department];
    if (!departmentId) return;
    const response = await fetch(
      `/api/organization-departments?slug=${encodeURIComponent(organizationSlug)}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ departmentId, password }),
      }
    );
    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      setTeamSaveError(result?.error ?? "Unable to remove department.");
      return;
    }
    setDepartments((current) => current.filter((item) => item !== department));
    setTeams((current) =>
      current.filter((team) => team.departmentId !== departmentId)
    );
    setDepartmentIds((current) => {
      const next = { ...current };
      delete next[department];
      return next;
    });
  };
  const stopDrag = () => {
    setDraggingId(null);
    setDragTarget(null);
  };

  return (
    <div
      className="flex flex-col h-full"
      onMouseUp={stopDrag}
      onDragEnd={stopDrag}
    >
      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-3 shrink-0">
        <button
          onClick={() => setAddingDept(true)}
          className="px-3 py-2 rounded-xl bg-[#2A2724] border border-[#3D3330] text-xs text-[#9C8272] hover:text-[#FFEDD1] hover:border-[#4A3F38] transition-colors"
        >
          + Add Department
        </button>
        <div className="flex-1" />
        <div className="relative">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search members…"
            className="pl-8 pr-8 py-2 rounded-xl bg-[#2A2724] border border-[#3D3330] text-sm text-[#FFEDD1] placeholder:text-[#7A6555] focus:outline-none focus:border-[#F0684D]/60 transition-colors w-48"
          />
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#7A6555] text-sm">
            ⌕
          </span>
          {q && (
            <button
              onClick={() => setQ("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7A6555] hover:text-[#FFEDD1] text-xs"
            >
              ✕
            </button>
          )}
        </div>
        <button
          onClick={() => setShowInvite((o) => !o)}
          className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-colors ${showInvite ? "bg-[#F0684D] text-white border-[#F0684D]" : "bg-[#2A2724] border-[#3D3330] text-[#FFEDD1] hover:border-[#4A3F38]"}`}
        >
          Invite Members
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 flex overflow-hidden rounded-2xl border border-[#3D3330]">
        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#1E1C1B] min-w-0">
          {/* Stats row: pie (fixed) | line chart (flex-1) | choropleth (fixed) */}
          <div
            className="shrink-0 flex gap-3 p-3 border-b border-[#3D3330]"
            style={{ height: 286 }}
          >
            <div
              className="shrink-0 rounded-xl bg-[#232120] border border-[#3D3330] p-3 flex flex-col"
              style={{ width: 218 }}
            >
              <PieStatsWidget members={visibleMembers} />
            </div>
            <div className="flex-1 min-w-0 rounded-xl bg-[#232120] border border-[#3D3330] p-3 flex flex-col">
              <MembersOverTimeChart
                departmentIds={departmentIds}
                departments={departments}
                deptColors={deptColors}
                history={teamHistory}
                activeSnapshot={historySnapshot}
                onSnapshotChange={setHistorySnapshot}
              />
            </div>
            <div
              className="shrink-0 rounded-xl bg-[#232120] border border-[#3D3330] p-3 flex flex-col"
              style={{ width: 312 }}
            >
              <ChoroplethMap
                members={visibleMembers}
                selectedIso={selectedCountryIso}
                onCountryClick={setSelectedCountryIso}
              />
            </div>
          </div>

          {/* Snapshot banner */}
          {historySnapshot && (
            <div className="flex items-center gap-2 px-4 py-1.5 bg-amber-500/10 border-b border-amber-500/25 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-[10px] text-amber-400 font-semibold">
                Viewing org snapshot: {historySnapshot}
              </span>
              <span className="text-[9px] text-amber-400/60 flex-1">
                — showing {visibleMembers.length} members who had joined by this
                month
              </span>
              <button
                onClick={() => setHistorySnapshot(null)}
                className="text-amber-400 hover:text-amber-300 text-[10px]"
              >
                ✕ Show current
              </button>
            </div>
          )}

          {/* Org tree */}
          <div className="flex-1 overflow-auto min-h-0">
            {teamSaveError && (
              <div className="mx-auto mb-2 max-w-xl rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-rose-300 text-xs">
                {teamSaveError}
              </div>
            )}
            <div className="flex flex-col items-center min-w-max pb-8 pt-10">
              <LeadershipTree
                advisor={roleMember("isAdvisor")}
                dragTarget={dragTarget}
                draggingId={draggingId}
                lead={
                  members.find((member) => member.id === leadMemberId) ?? null
                }
                onDragStart={setDraggingId}
                onDropRole={handleDropRole}
                onReleaseRole={(memberId, role) =>
                  releaseTeamRole(memberId, role)
                }
                onRoleClick={(member, role) =>
                  setLeadershipAction({ member, role })
                }
                setDragTarget={setDragTarget}
                treasurer={roleMember("isTreasurer")}
              />
              <div className="relative flex gap-3 items-start">
                {departments.length > 1 && (
                  <div
                    className="absolute top-0 h-px bg-[#3D3330]"
                    style={{
                      left: "calc(50% / " + departments.length + ")",
                      right: "calc(50% / " + departments.length + ")",
                    }}
                  />
                )}
                {departments.map((dept) => (
                  <div key={dept} className="flex flex-col items-center">
                    <div className="w-px h-4 bg-[#3D3330]" />
                    <DeptColumn
                      organizationId={initialOrganizationId}
                      dept={dept}
                      color={deptColors[dept] ?? "#888"}
                      members={membersByDept(dept)}
                      subLeadId={
                        historicalTeams.find(
                          (team) =>
                            team.departmentId === departmentIds[dept] &&
                            team.isSubLead
                        )?.memberId ??
                        subLeads[dept] ??
                        null
                      }
                      q={q}
                      draggingId={draggingId}
                      dragTarget={dragTarget}
                      setDragTarget={setDragTarget}
                      memberExtraDepts={assignedDepartmentsByMember}
                      deptColors={deptColors}
                      highlightedIso={selectedCountryIso}
                      onDrop={handleDrop}
                      onDropSublead={handleDropSublead}
                      onDragStart={setDraggingId}
                      onMemberClick={setActionMember}
                      onRemoveDept={(d, password) =>
                        removeDepartment(d, password).catch(() => undefined)
                      }
                      onRemoveSubLead={releaseSubLead}
                      onRemoveMemberFromDept={removeMemberFromDepartment}
                    />
                  </div>
                ))}
                <div className="flex flex-col items-center">
                  <div className="h-4 w-px bg-[#3D3330]" />
                  <NonAssignedMembers
                    active={dragTarget?.kind === "unassigned"}
                    draggingId={draggingId}
                    highlightedIso={selectedCountryIso}
                    members={unassignedMembers}
                    onDragStart={setDraggingId}
                    onDrop={handleDropUnassigned}
                    onMemberClick={setActionMember}
                    q={q}
                    setDragTarget={setDragTarget}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right invite panel */}
        {showInvite && (
          <InvitePanel
            departmentIds={departmentIds}
            depts={departments.filter(
              (department) => departmentIds[department]
            )}
            deptColors={deptColors}
            members={members}
            onClose={() => setShowInvite(false)}
            organizationId={initialOrganizationId}
          />
        )}
      </div>

      {addingDept && (
        <AddDeptModal
          onContinue={(name, color) => {
            setPendingDepartment({ name, color });
            setAddingDept(false);
          }}
          onClose={() => {
            setAddingDept(false);
          }}
        />
      )}
      {pendingDepartment && (
        <PwModal
          organizationId={initialOrganizationId}
          title="Add Department"
          desc="Enter your password to add a department."
          onConfirm={(password) => {
            fetch(
              `/api/organization-departments?slug=${encodeURIComponent(organizationSlug)}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  name: pendingDepartment.name,
                  password,
                }),
              }
            )
              .then(async (response) => {
                const result = (await response.json().catch(() => null)) as {
                  department?: { id: string; name: string };
                  error?: string;
                } | null;
                if (!response.ok || !result?.department) {
                  setTeamSaveError(
                    result?.error ?? "Unable to add department."
                  );
                  return;
                }
                setDepartments((current) => [
                  ...current,
                  result.department!.name,
                ]);
                setDepartmentIds((current) => ({
                  ...current,
                  [result.department!.name]: result.department!.id,
                }));
                setDeptColors((current) => ({
                  ...current,
                  [result.department!.name]: pendingDepartment.color,
                }));
                setPendingDepartment(null);
              })
              .catch(() => setTeamSaveError("Unable to add department."));
          }}
          onClose={() => setPendingDepartment(null)}
        />
      )}
      {pendingTeamSave && (
        <PwModal
          organizationId={initialOrganizationId}
          title="Update member tree"
          desc="Enter your password to continue."
          onConfirm={(password) => {
            persistTeams(pendingTeamSave, password).catch(() => undefined);
          }}
          onClose={() => setPendingTeamSave(null)}
        />
      )}
      {leadershipAction && (
        <LeadershipActionModal
          member={leadershipAction.member}
          onClose={() => setLeadershipAction(null)}
          onRelease={() => {
            releaseTeamRole(
              leadershipAction.member.id,
              leadershipAction.role,
              true
            );
            setLeadershipAction(null);
          }}
          onRemove={() => {
            setPendingMemberRemoval(leadershipAction.member);
            setLeadershipAction(null);
          }}
          role={leadershipAction.role}
        />
      )}
      {pendingMemberRemoval && (
        <PwModal
          desc={`Remove ${pendingMemberRemoval.name} from this organization?`}
          onClose={() => setPendingMemberRemoval(null)}
          onConfirm={(password) => {
            if (password) {
              removeMemberFromOrganization(
                pendingMemberRemoval.id,
                password
              ).catch(() => undefined);
            }
          }}
          organizationId={initialOrganizationId}
          title="Remove from Team"
        />
      )}
      {actionMember && (
        <MemberActionModal
          member={actionMember}
          allDepts={departments}
          extraDepts={assignedDepartmentsByMember[actionMember.id] ?? []}
          deptColors={deptColors}
          organizationId={initialOrganizationId}
          onClose={() => setActionMember(null)}
          onRemove={(password) =>
            removeMemberFromOrganization(actionMember.id, password)
          }
          onStrike={() =>
            setMembers((p) =>
              p.map((m) =>
                m.id === actionMember.id ? { ...m, strikes: m.strikes + 1 } : m
              )
            )
          }
          onAddToDept={(dept) => addMemberToDepartment(actionMember.id, dept)}
          onRemoveFromDept={(dept) =>
            removeMemberFromDepartment(actionMember.id, dept)
          }
          onSetRole={(dept, role) => setTeamRole(actionMember.id, dept, role)}
        />
      )}
    </div>
  );
}
