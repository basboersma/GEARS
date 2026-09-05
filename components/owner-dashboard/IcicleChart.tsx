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
// biome-ignore-all lint/style/useAtIndex: Keeps the chart access TypeScript-safe.
import { ResponsiveIcicle } from "@nivo/icicle";
import { useState } from "react";
import { MONTHLY_SPEND } from "./data";
import type { BudgetData } from "./types";

interface Props {
  data: BudgetData;
}

const fmt = (n: number) => `€${n.toLocaleString("nl-NL")}`;

const DARK_THEME = {
  background: "transparent",
  text: { fill: "#C4A882", fontSize: 10 },
  labels: { text: { fill: "#fff", fontSize: 9, fontWeight: 700 } },
  tooltip: {
    container: {
      background: "#2A2724",
      color: "#FFEDD1",
      borderRadius: 8,
      fontSize: 12,
      border: "1px solid #3D3330",
      boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
    },
  },
};

type Period = "1M" | "6M" | "1Y";
const PERIOD_MONTHS: Record<Period, number> = { "1M": 1, "6M": 6, "1Y": 12 };

function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) {
    return "";
  }
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1],
      curr = pts[i];
    const cpx = (prev.x + curr.x) / 2;
    d += ` C ${cpx} ${prev.y} ${cpx} ${curr.y} ${curr.x} ${curr.y}`;
  }
  return d;
}

function SpendingChart({ name, color }: { name: string; color: string }) {
  const [period, setPeriod] = useState<Period>("6M");
  const allData = MONTHLY_SPEND[name] ?? MONTHLY_SPEND.Total;
  const data = allData.slice(-PERIOD_MONTHS[period]);
  const maxY = Math.max(...data.map((d) => Math.max(d.budget, d.spent))) * 1.15;
  const W = 240,
    H = 120,
    PAD = { l: 34, r: 8, t: 12, b: 24 };
  const iW = W - PAD.l - PAD.r,
    iH = H - PAD.t - PAD.b;
  const toX = (i: number) => PAD.l + (i / (data.length - 1 || 1)) * iW;
  const toY = (v: number) => PAD.t + iH - (v / maxY) * iH;

  const budgetPts = data.map((d, i) => ({ x: toX(i), y: toY(d.budget) }));
  const spentPts = data.map((d, i) => ({ x: toX(i), y: toY(d.spent) }));

  const areaPath =
    spentPts.length > 1
      ? `${smoothPath(spentPts)} L ${spentPts[spentPts.length - 1].x} ${PAD.t + iH} L ${spentPts[0].x} ${PAD.t + iH} Z`
      : "";

  return (
    <div className="flex h-full flex-col">
      <div className="mb-1 flex shrink-0 items-center justify-between">
        <span className="truncate font-semibold text-[#C4A882] text-[10px] uppercase tracking-wider">
          {name}
        </span>
        <div className="flex items-center gap-0.5">
          {(["1M", "6M", "1Y"] as Period[]).map((p) => (
            <button
              className={`rounded px-1.5 py-0.5 font-semibold text-[8px] transition-colors ${period === p ? "bg-[#3D3330] text-[#FFEDD1]" : "text-[#7A6555] hover:text-[#C4A882]"}`}
              key={p}
              onClick={() => setPeriod(p)}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
      <div className="mb-1 flex shrink-0 items-center gap-3">
        <span className="flex items-center gap-1 text-[#7A6555] text-[8px]">
          <svg height="2" width="14">
            <line
              stroke={color}
              strokeDasharray="3,2"
              strokeWidth="1.5"
              x1="0"
              x2="14"
              y1="1"
              y2="1"
            />
          </svg>
          Budget
        </span>
        <span className="flex items-center gap-1 text-[#7A6555] text-[8px]">
          <svg height="2" width="14">
            <line
              stroke={color}
              strokeWidth="1.5"
              x1="0"
              x2="14"
              y1="1"
              y2="1"
            />
          </svg>
          Spent
        </span>
      </div>
      <svg className="flex-1" viewBox={`0 0 ${W} ${H}`} width="100%">
        <defs>
          <linearGradient
            id={`grad-${name.replace(/\s/g, "")}`}
            x1="0"
            x2="0"
            y1="0"
            y2="1"
          >
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((f) => {
          const y = PAD.t + iH * (1 - f);
          const val = Math.round(maxY * f);
          return (
            <g key={f}>
              <line
                stroke="#3D3330"
                strokeWidth={0.5}
                x1={PAD.l}
                x2={W - PAD.r}
                y1={y}
                y2={y}
              />
              <text
                fill="#7A6555"
                fontSize={7}
                textAnchor="end"
                x={PAD.l - 3}
                y={y + 3}
              >
                {val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
              </text>
            </g>
          );
        })}
        {areaPath && (
          <path d={areaPath} fill={`url(#grad-${name.replace(/\s/g, "")})`} />
        )}
        {budgetPts.length > 1 && (
          <path
            d={smoothPath(budgetPts)}
            fill="none"
            stroke={color}
            strokeDasharray="4,3"
            strokeOpacity={0.5}
            strokeWidth={1}
          />
        )}
        {spentPts.length > 1 && (
          <path
            d={smoothPath(spentPts)}
            fill="none"
            stroke={color}
            strokeWidth={1.5}
          />
        )}
        {spentPts.map((pt, i) => (
          <circle cx={pt.x} cy={pt.y} fill={color} key={i} r={2} />
        ))}
        {data.map((d, i) => (
          <text
            fill="#7A6555"
            fontSize={7}
            key={i}
            textAnchor="middle"
            x={toX(i)}
            y={H - 6}
          >
            {d.month}
          </text>
        ))}
      </svg>
    </div>
  );
}

function buildNivoData(data: BudgetData, drillStack: string[]) {
  if (drillStack.length === 0) {
    return {
      id: "Budget",
      children: data.departments.map((d) => ({
        id: d.name,
        value: d.budget,
        color: d.color,
      })),
    };
  }
  const dept = data.departments.find((d) => d.name === drillStack[0]);
  if (!dept) {
    return {
      id: "Budget",
      children: data.departments.map((d) => ({
        id: d.name,
        value: d.budget,
        color: d.color,
      })),
    };
  }
  if (drillStack.length === 1) {
    return {
      id: dept.name,
      color: dept.color,
      children: dept.subs.map((sub) => ({
        id: sub.name,
        value: sub.budget,
        color: `${dept.color}bb`,
        ...(sub.subs && sub.subs.length > 0
          ? {
              children: sub.subs.map((ss) => ({
                id: ss.name,
                value: ss.budget,
                color: `${dept.color}77`,
              })),
            }
          : {}),
      })),
    };
  }
  const sub = dept.subs.find((s) => s.name === drillStack[1]);
  if (!sub) {
    return {
      id: dept.name,
      color: dept.color,
      children: dept.subs.map((s) => ({
        id: s.name,
        value: s.budget,
        color: `${dept.color}bb`,
      })),
    };
  }
  return {
    id: sub.name,
    color: `${dept.color}bb`,
    children: (sub.subs ?? []).map((ss) => ({
      id: ss.name,
      value: ss.budget,
      color: `${dept.color}77`,
    })),
  };
}

export function IcicleChart({ data }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [drillStack, setDrillStack] = useState<string[]>([]);
  const [selectedNode, setSelectedNode] = useState<{
    name: string;
    color: string;
  } | null>(null);

  const totalPct =
    data.total > 0 ? Math.round((data.spent / data.total) * 100) : 0;
  const nivoData = buildNivoData(data, drillStack);

  const getDeptColor = (name: string) =>
    data.departments.find((d) => d.name === name)?.color ?? "#F0684D";

  const handleClick = (node: any) => {
    const depth: number = node.hierarchy?.depth ?? 0;
    const id: string = node.data?.id ?? "";

    if (depth === 0 && drillStack.length > 0) {
      setDrillStack((s) => s.slice(0, -1));
      setSelectedNode(null);
      return;
    }

    const deptName = drillStack[0] ?? id;
    const deptColor = getDeptColor(deptName);

    // Show spending chart for whatever was clicked (dept or sub)
    const spendName = drillStack.length === 0 ? id : id;
    setSelectedNode({ name: spendName, color: deptColor });

    if (drillStack.length === 0) {
      // Clicking a dept — drill in to show its subs
      setDrillStack([id]);
    } else if (drillStack.length === 1) {
      // Clicking a sub — drill in if it has subsubs
      const dept = data.departments.find((d) => d.name === drillStack[0]);
      const sub = dept?.subs.find((s) => s.name === id);
      if (sub?.subs && sub.subs.length > 0) {
        setDrillStack([drillStack[0], id]);
      }
    }
  };

  const breadcrumb = ["Budget", ...drillStack];

  return (
    <div className="shrink-0 overflow-hidden rounded-2xl border border-[#3D3330] bg-[#232120]">
      {/* Collapsed header — just title + summary + spend line */}
      <div
        className="flex cursor-pointer select-none items-center gap-3 px-4 py-2.5 transition-colors hover:bg-[#2E2B2A]"
        onClick={() => {
          setExpanded((e) => !e);
          if (!expanded) {
            setDrillStack([]);
            setSelectedNode(null);
          }
        }}
      >
        <span className="shrink-0 font-bold text-[#FFEDD1] text-xs">
          Budget {new Date().getFullYear()}
        </span>
        <div className="relative h-1.5 flex-1 overflow-visible rounded-full bg-[#3D3330]">
          <div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ width: `${totalPct}%`, background: "#F0684D" }}
          />
          <div
            className="absolute top-1/2 h-3 w-px -translate-y-1/2 bg-[#F0684D]"
            style={{ left: `${totalPct}%` }}
          />
        </div>
        <span className="shrink-0 text-[#C4A882] text-xs">
          {fmt(data.spent)} / {fmt(data.total)}
        </span>
        <span className="ml-1 shrink-0 text-[#7A6555] text-[10px]">
          {expanded ? "▲" : "▼"}
        </span>
      </div>

      {expanded && (
        <div className="border-[#3D3330] border-t">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1 px-3 pt-2 pb-1">
            {breadcrumb.map((crumb, i) => (
              <span className="flex items-center gap-1" key={i}>
                {i > 0 && <span className="text-[#3D3330] text-[9px]">/</span>}
                <button
                  className={`font-medium text-[9px] transition-colors ${i === breadcrumb.length - 1 ? "text-[#FFEDD1]" : "text-[#7A6555] hover:text-[#C4A882]"}`}
                  onClick={() => {
                    if (i === breadcrumb.length - 1) {
                      return;
                    }
                    setDrillStack(drillStack.slice(0, i));
                    setSelectedNode(null);
                  }}
                >
                  {crumb}
                </button>
              </span>
            ))}
            {drillStack.length > 0 && (
              <button
                className="ml-auto text-[#7A6555] text-[8px] transition-colors hover:text-[#F0684D]"
                onClick={() => {
                  setDrillStack([]);
                  setSelectedNode(null);
                }}
              >
                ↑ Back
              </button>
            )}
          </div>

          <div className="flex" style={{ height: 170 }}>
            <div className="min-w-[280px] flex-1">
              <ResponsiveIcicle
                animate={false}
                borderRadius={3}
                borderWidth={0}
                colorBy="id"
                colors={(node: any) => node.data?.color ?? "#F0684D"}
                data={nivoData}
                enableLabels
                enableZooming={false}
                gapX={2}
                gapY={2}
                identity="id"
                inheritColorFromParent={false}
                isInteractive
                label="id"
                labelSkipHeight={12}
                labelSkipWidth={32}
                labelTextColor="#fff"
                margin={{ top: 6, right: 6, bottom: 6, left: 6 }}
                onClick={handleClick}
                orientation="bottom"
                theme={DARK_THEME}
                value="value"
                valueFormat=">-.3~s"
              />
            </div>

            {selectedNode ? (
              <div className="w-56 shrink-0 border-[#3D3330] border-l px-3 py-2">
                <SpendingChart
                  color={selectedNode.color}
                  name={selectedNode.name}
                />
              </div>
            ) : (
              <div className="flex w-36 shrink-0 items-center justify-center border-[#3D3330] border-l px-3">
                <span className="text-center text-[#4A3F38] text-[10px] leading-relaxed">
                  Click a bar to see spending
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
