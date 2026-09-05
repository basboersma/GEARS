// biome-ignore-all lint/a11y/noLabelWithoutControl: Preserves the reference ordering dashboard interaction design.
// biome-ignore-all lint/a11y/noNoninteractiveElementInteractions: Preserves the reference ordering dashboard interaction design.
// biome-ignore-all lint/a11y/noStaticElementInteractions: Preserves the reference ordering dashboard interaction design.
// biome-ignore-all lint/a11y/noSvgWithoutTitle: Preserves the reference ordering dashboard visual assets.
// biome-ignore-all lint/a11y/useButtonType: Preserves the reference ordering dashboard controls.
// biome-ignore-all lint/a11y/useKeyWithClickEvents: Preserves the reference ordering dashboard interaction design.
// biome-ignore-all lint/complexity/noExcessiveCognitiveComplexity: Preserves the reference ordering dashboard component structure.
// biome-ignore-all lint/complexity/noForEach: Preserves the reference ordering dashboard data flow.
// biome-ignore-all lint/correctness/useExhaustiveDependencies: Preserves the reference ordering dashboard interaction timing.
// biome-ignore-all lint/suspicious/noArrayIndexKey: Preserves the reference ordering dashboard list rendering.
// biome-ignore-all lint/suspicious/noExplicitAny: Preserves the reference ordering dashboard chart contract.
// biome-ignore-all lint/style/noNestedTernary: Preserves the reference ordering dashboard visual state expressions.
// biome-ignore-all lint/style/useFilenamingConvention: Preserves the reference ordering dashboard source names.
// biome-ignore-all lint/style/useAtIndex: Preserves the reference ordering dashboard array access.
// biome-ignore-all lint/style/useBlockStatements: Preserves the reference ordering dashboard component structure.
// biome-ignore-all lint/style/useTemplate: Preserves the reference ordering dashboard color expressions.
// biome-ignore-all lint/suspicious/noEmptyBlockStatements: Preserves the reference ordering dashboard placeholder callback.
// biome-ignore-all lint/complexity/useLiteralKeys: Preserves the reference ordering dashboard data access.
// biome-ignore-all lint/correctness/noUnusedFunctionParameters: Preserves the reference ordering dashboard component API.
"use client";

import { useState } from "react";
import { DEPT_COLORS, MONTHLY_SPEND } from "./data";
import type { BudgetData } from "./types";

// ── Local types ────────────────────────────────────────────────────────────────
type Tab = "submit" | "overview" | "incoming" | "past" | "recurring";
type OrderStatus =
  | "pending"
  | "ordered"
  | "arrived"
  | "action_needed"
  | "denied";
type ItemStatus = "pending" | "ordered" | "arrived" | "denied";
type Period = "1M" | "6M" | "1Y";

interface OrderItem {
  id: string;
  link: string;
  description: string;
  pricePerPiece: number;
  quantity: number;
  orderType: string;
  urgency: string;
  comments: string;
  status: ItemStatus;
  requiresPhoto: boolean;
  requiresInvoice: boolean;
  photoUploaded: boolean;
  invoiceUploaded: boolean;
}

interface OrderRecord {
  id: string;
  name: string;
  department: string;
  submittedBy: string;
  approvedBy: string;
  submittedAt: string;
  monthLabel: string;
  status: OrderStatus;
  items: OrderItem[];
  isPast: boolean;
}

interface FormRow {
  id: string;
  link: string;
  pricePerPiece: string;
  quantity: string;
  orderType: string;
  urgency: string;
  comments: string;
}

interface RecurringOrder {
  id: string;
  name: string;
  department: string;
  intervalDays: string;
  rows: FormRow[];
  enabled: boolean;
  paused: boolean;
}

// ── Constants ──────────────────────────────────────────────────────────────────
const ORDER_TYPES = ["Hardware", "Electronic", "Software", "Social"] as const;
const URGENCIES = ["1 day", "2 days", "3 days", "7 days"] as const;
const DEPT_LIST = [
  "Mechanical",
  "PR",
  "Board",
  "Software",
  "Finance",
  "Design",
];
const PERIOD_MONTHS: Record<Period, number> = { "1M": 1, "6M": 6, "1Y": 12 };
const ROW_COUNT = 15;

const STATUS_COLOR: Record<OrderStatus, string> = {
  pending: "#FFD142",
  ordered: "#4f6ef7",
  arrived: "#10b981",
  action_needed: "#F0684D",
  denied: "#f43f5e",
};
const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pending",
  ordered: "Ordered",
  arrived: "Arrived",
  action_needed: "Action Needed",
  denied: "Denied",
};
const ITEM_STATUS_COLOR: Record<ItemStatus, string> = {
  pending: "#FFD142",
  ordered: "#4f6ef7",
  arrived: "#10b981",
  denied: "#f43f5e",
};

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  `€${n.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const calcTotal = (items: Array<{ pricePerPiece: number; quantity: number }>) =>
  items.reduce((s, i) => s + i.pricePerPiece * i.quantity, 0);
const rowsTotal = (rows: FormRow[]) =>
  rows.reduce(
    (s, r) =>
      s +
      (Number.parseFloat(r.pricePerPiece) || 0) *
        (Number.parseInt(r.quantity, 10) || 0),
    0
  );
const mkRow = (): FormRow => ({
  id: crypto.randomUUID(),
  link: "",
  pricePerPiece: "",
  quantity: "",
  orderType: "",
  urgency: "",
  comments: "",
});

// ── Mock data ──────────────────────────────────────────────────────────────────
const MOCK_ORDERS: OrderRecord[] = [
  {
    id: "ol1",
    name: "September Hardware Batch",
    department: "Mechanical",
    submittedBy: "Alex van den Berg",
    approvedBy: "Liam Bakker",
    submittedAt: "2026-09-01",
    monthLabel: "Sep",
    status: "action_needed",
    isPast: false,
    items: [
      {
        id: "i1",
        link: "https://shop.rs.com/bolts",
        description: "Steel bolts M8 (100×)",
        pricePerPiece: 12,
        quantity: 2,
        orderType: "Hardware",
        urgency: "3 days",
        comments: "",
        status: "ordered",
        requiresPhoto: true,
        requiresInvoice: true,
        photoUploaded: false,
        invoiceUploaded: true,
      },
      {
        id: "i2",
        link: "https://shop.rs.com/bearing",
        description: "Bearing 6204 double-sealed",
        pricePerPiece: 8,
        quantity: 5,
        orderType: "Hardware",
        urgency: "7 days",
        comments: "Double-sealed preferred",
        status: "arrived",
        requiresPhoto: true,
        requiresInvoice: false,
        photoUploaded: true,
        invoiceUploaded: false,
      },
      {
        id: "i3",
        link: "https://shop.rs.com/wire",
        description: "Welding wire 1 kg",
        pricePerPiece: 24,
        quantity: 1,
        orderType: "Hardware",
        urgency: "7 days",
        comments: "",
        status: "pending",
        requiresPhoto: false,
        requiresInvoice: true,
        photoUploaded: false,
        invoiceUploaded: false,
      },
    ],
  },
  {
    id: "ol2",
    name: "PR Materials Q4",
    department: "PR",
    submittedBy: "Sophie Janssen",
    approvedBy: "Liam Bakker",
    submittedAt: "2026-09-04",
    monthLabel: "Sep",
    status: "ordered",
    isPast: false,
    items: [
      {
        id: "i4",
        link: "https://print.example.com/flyers",
        description: "Flyers A5 (500×)",
        pricePerPiece: 45,
        quantity: 1,
        orderType: "Social",
        urgency: "3 days",
        comments: "",
        status: "ordered",
        requiresPhoto: false,
        requiresInvoice: true,
        photoUploaded: false,
        invoiceUploaded: false,
      },
      {
        id: "i5",
        link: "https://print.example.com/banner",
        description: "Roll-up banner 200 cm",
        pricePerPiece: 85,
        quantity: 2,
        orderType: "Social",
        urgency: "7 days",
        comments: "Both double-sided",
        status: "ordered",
        requiresPhoto: false,
        requiresInvoice: true,
        photoUploaded: false,
        invoiceUploaded: false,
      },
    ],
  },
  {
    id: "ol3",
    name: "Software Licenses Oct",
    department: "Software",
    submittedBy: "Daan Mulder",
    approvedBy: "",
    submittedAt: "2026-09-05",
    monthLabel: "Sep",
    status: "pending",
    isPast: false,
    items: [
      {
        id: "i6",
        link: "https://jetbrains.com/all",
        description: "JetBrains All Products Pack",
        pricePerPiece: 50,
        quantity: 3,
        orderType: "Software",
        urgency: "7 days",
        comments: "",
        status: "pending",
        requiresPhoto: false,
        requiresInvoice: true,
        photoUploaded: false,
        invoiceUploaded: false,
      },
      {
        id: "i7",
        link: "https://github.com/pricing",
        description: "GitHub Pro seats (×5)",
        pricePerPiece: 4,
        quantity: 5,
        orderType: "Software",
        urgency: "7 days",
        comments: "",
        status: "pending",
        requiresPhoto: false,
        requiresInvoice: true,
        photoUploaded: false,
        invoiceUploaded: false,
      },
    ],
  },
  {
    id: "ol4",
    name: "Design Software Aug",
    department: "Design",
    submittedBy: "Emma de Vries",
    approvedBy: "Liam Bakker",
    submittedAt: "2026-08-15",
    monthLabel: "Aug",
    status: "arrived",
    isPast: true,
    items: [
      {
        id: "i8",
        link: "https://figma.com/pricing",
        description: "Figma Organisation annual",
        pricePerPiece: 500,
        quantity: 1,
        orderType: "Software",
        urgency: "7 days",
        comments: "",
        status: "arrived",
        requiresPhoto: false,
        requiresInvoice: true,
        photoUploaded: false,
        invoiceUploaded: true,
      },
      {
        id: "i9",
        link: "https://adobe.com/creativecloud",
        description: "Adobe Creative Cloud team",
        pricePerPiece: 400,
        quantity: 1,
        orderType: "Software",
        urgency: "7 days",
        comments: "",
        status: "arrived",
        requiresPhoto: false,
        requiresInvoice: true,
        photoUploaded: false,
        invoiceUploaded: true,
      },
    ],
  },
  {
    id: "ol5",
    name: "Finance Audit Tools Jul",
    department: "Finance",
    submittedBy: "Noah Smit",
    approvedBy: "Liam Bakker",
    submittedAt: "2026-07-20",
    monthLabel: "Jul",
    status: "denied",
    isPast: true,
    items: [
      {
        id: "i10",
        link: "https://auditboard.com/pricing",
        description: "AuditBoard licence (annual)",
        pricePerPiece: 1200,
        quantity: 1,
        orderType: "Software",
        urgency: "7 days",
        comments: "Annual renewal",
        status: "denied",
        requiresPhoto: false,
        requiresInvoice: false,
        photoUploaded: false,
        invoiceUploaded: false,
      },
    ],
  },
  {
    id: "ol6",
    name: "Arm Electronics Batch",
    department: "Mechanical",
    submittedBy: "Alex van den Berg",
    approvedBy: "Liam Bakker",
    submittedAt: "2026-08-10",
    monthLabel: "Aug",
    status: "arrived",
    isPast: true,
    items: [
      {
        id: "i11",
        link: "https://rs-online.com/motor",
        description: "Stepper motor NEMA 17",
        pricePerPiece: 22,
        quantity: 4,
        orderType: "Electronic",
        urgency: "3 days",
        comments: "",
        status: "arrived",
        requiresPhoto: true,
        requiresInvoice: true,
        photoUploaded: true,
        invoiceUploaded: true,
      },
      {
        id: "i12",
        link: "https://rs-online.com/driver",
        description: "Motor driver A4988",
        pricePerPiece: 6,
        quantity: 4,
        orderType: "Electronic",
        urgency: "3 days",
        comments: "",
        status: "arrived",
        requiresPhoto: false,
        requiresInvoice: true,
        photoUploaded: false,
        invoiceUploaded: true,
      },
    ],
  },
];

const INIT_RECURRING: RecurringOrder[] = [
  {
    id: "rec1",
    name: "Monthly Cleaning Supplies",
    department: "Board",
    intervalDays: "30",
    enabled: true,
    paused: false,
    rows: [
      {
        id: "rr1",
        link: "https://example.com/cleaning",
        pricePerPiece: "15",
        quantity: "3",
        orderType: "Hardware",
        urgency: "7 days",
        comments: "Monthly restock",
      },
    ],
  },
];

// ── Field styles ───────────────────────────────────────────────────────────────
const fieldCls =
  "h-8 w-full rounded border border-[#3D3330] bg-[#1A1919] px-2 text-[11px] text-[#FFEDD1] outline-none transition-colors placeholder:text-[#4A3F38] focus:border-[#FFD142]/60 focus:ring-1 focus:ring-[#FFD142]/20";
const selectCls = `${fieldCls} cursor-pointer appearance-none bg-[url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%237A6555' stroke-width='1.5'%3E%3Cpath d='M4 6.5 8 10.5l4-4'/%3E%3C/svg%3E")] bg-[length:12px_12px] bg-[position:right_0.4rem_center] bg-no-repeat pr-6`;

// ── Smooth path ────────────────────────────────────────────────────────────────
function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1],
      curr = pts[i];
    const cpx = (prev.x + curr.x) / 2;
    d += ` C ${cpx} ${prev.y} ${cpx} ${curr.y} ${curr.x} ${curr.y}`;
  }
  return d;
}

// ── Budget Bar ─────────────────────────────────────────────────────────────────
function BudgetBar({
  data,
  orderAmount,
  recurringAmount,
  showOrder,
}: {
  data: BudgetData;
  orderAmount: number;
  recurringAmount: number;
  showOrder: boolean;
}) {
  const spentPct = Math.min((data.spent / data.total) * 100, 100);
  const rem = 100 - spentPct;
  const orderPct = Math.min((orderAmount / data.total) * 100, rem);
  const recurPct = Math.min(
    (recurringAmount / data.total) * 100,
    rem - orderPct
  );

  return (
    <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-[#3D3330] bg-[#232120] px-4 py-2.5">
      <span className="shrink-0 font-bold text-[#FFEDD1] text-xs">
        Budget {new Date().getFullYear()}
      </span>
      <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-[#3D3330]">
        <div
          className="absolute inset-y-0 left-0"
          style={{ width: `${spentPct}%`, background: "#F0684D" }}
        />
        {showOrder && orderAmount > 0 && (
          <div
            className="absolute inset-y-0"
            style={{
              left: `${spentPct}%`,
              width: `${orderPct}%`,
              background: "#FFD142",
            }}
          />
        )}
        {recurringAmount > 0 && (
          <div
            className="absolute inset-y-0"
            style={{
              left: `${spentPct + (showOrder ? orderPct : 0)}%`,
              width: `${recurPct}%`,
              background: "#8b5cf6",
              opacity: 0.8,
            }}
          />
        )}
      </div>
      <span className="flex shrink-0 items-center gap-1 text-[#C4A882] text-xs">
        {fmt(data.spent)}
        {showOrder && orderAmount > 0 && (
          <span className="text-[#FFD142]">+{fmt(orderAmount)}</span>
        )}
        {recurringAmount > 0 && (
          <span className="text-[#8b5cf6]">+{fmt(recurringAmount)}</span>
        )}
        <span>/ {fmt(data.total)}</span>
      </span>
    </div>
  );
}

// ── Spending Chart ─────────────────────────────────────────────────────────────
function SpendingChart({
  name,
  color,
  pendingByMonth,
  recurringByMonth,
  onPointClick,
  ordersForMonth,
  title,
  period,
  onPeriodChange,
}: {
  name: string;
  color: string;
  pendingByMonth?: Record<string, number>;
  recurringByMonth?: Record<string, number>;
  onPointClick: (month: string) => void;
  ordersForMonth: (month: string) => OrderRecord[];
  title: string;
  period: Period;
  onPeriodChange: (p: Period) => void;
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const allData = MONTHLY_SPEND[name] ?? MONTHLY_SPEND.Total;
  const data = allData.slice(-PERIOD_MONTHS[period]);

  const pendingAmt = data.map((d) => pendingByMonth?.[d.month] ?? 0);
  const recurAmt = data.map((d) => recurringByMonth?.[d.month] ?? 0);
  const maxY =
    Math.max(
      ...data.map((d, i) =>
        Math.max(d.budget, d.spent + pendingAmt[i] + recurAmt[i])
      )
    ) * 1.2 || 1;

  const W = 800,
    H = 100;
  const PAD = { l: 38, r: 12, t: 14, b: 26 };
  const iW = W - PAD.l - PAD.r,
    iH = H - PAD.t - PAD.b;
  const toX = (i: number) => PAD.l + (i / Math.max(data.length - 1, 1)) * iW;
  const toY = (v: number) => PAD.t + iH - (v / maxY) * iH;

  const budgetPts = data.map((d, i) => ({ x: toX(i), y: toY(d.budget) }));
  const spentPts = data.map((d, i) => ({ x: toX(i), y: toY(d.spent) }));
  const pendingPts = data.map((d, i) => ({
    x: toX(i),
    y: toY(d.spent + pendingAmt[i]),
  }));
  const recurPts = data.map((d, i) => ({
    x: toX(i),
    y: toY(d.spent + pendingAmt[i] + recurAmt[i]),
  }));

  const area = (pts: { x: number; y: number }[]) =>
    pts.length > 1
      ? `${smoothPath(pts)} L ${pts[pts.length - 1].x} ${PAD.t + iH} L ${pts[0].x} ${PAD.t + iH} Z`
      : "";

  const hasPending = pendingAmt.some((a) => a > 0);
  const hasRecur = recurAmt.some((a) => a > 0);
  const xPct = hoveredIdx !== null ? `${(toX(hoveredIdx) / W) * 100}%` : "0%";
  const hoveredOrders =
    hoveredIdx !== null ? ordersForMonth(data[hoveredIdx].month) : [];

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-[#C4A882] text-[10px] uppercase tracking-wider">
            {title}
          </span>
          <div className="flex items-center gap-2.5 text-[#7A6555] text-[8px]">
            <span className="flex items-center gap-1">
              <svg height="2" width="12">
                <line
                  stroke={color}
                  strokeDasharray="3,2"
                  strokeWidth="1.5"
                  x1="0"
                  x2="12"
                  y1="1"
                  y2="1"
                />
              </svg>
              Budget
            </span>
            <span className="flex items-center gap-1">
              <svg height="2" width="12">
                <line
                  stroke={color}
                  strokeWidth="1.5"
                  x1="0"
                  x2="12"
                  y1="1"
                  y2="1"
                />
              </svg>
              Spent
            </span>
            <span className="flex items-center gap-1">
              <svg height="2" width="12">
                <line
                  stroke="#FFD142"
                  strokeWidth="1.5"
                  x1="0"
                  x2="12"
                  y1="1"
                  y2="1"
                />
              </svg>
              Pending
            </span>
            <span className="flex items-center gap-1">
              <svg height="2" width="12">
                <line
                  stroke="#8b5cf6"
                  strokeWidth="1.5"
                  x1="0"
                  x2="12"
                  y1="1"
                  y2="1"
                />
              </svg>
              Recurring
            </span>
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          {(["1M", "6M", "1Y"] as Period[]).map((p) => (
            <button
              className={`rounded px-1.5 py-0.5 font-semibold text-[8px] transition-colors ${period === p ? "bg-[#3D3330] text-[#FFEDD1]" : "text-[#7A6555] hover:text-[#C4A882]"}`}
              key={p}
              onClick={() => onPeriodChange(p)}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
      <div className="relative w-full" style={{ height: H }}>
        <svg
          height="100%"
          onMouseLeave={() => setHoveredIdx(null)}
          preserveAspectRatio="none"
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
        >
          <defs>
            <linearGradient
              id={`ga-${name.replace(/\s/g, "")}`}
              x1="0"
              x2="0"
              y1="0"
              y2="1"
            >
              <stop offset="0%" stopColor={color} stopOpacity="0.22" />
              <stop offset="100%" stopColor={color} stopOpacity="0.02" />
            </linearGradient>
            <linearGradient
              id={`gp-${name.replace(/\s/g, "")}`}
              x1="0"
              x2="0"
              y1="0"
              y2="1"
            >
              <stop offset="0%" stopColor="#FFD142" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#FFD142" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient
              id={`gr-${name.replace(/\s/g, "")}`}
              x1="0"
              x2="0"
              y1="0"
              y2="1"
            >
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.02" />
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
          {hasRecur && (
            <path
              d={area(recurPts)}
              fill={`url(#gr-${name.replace(/\s/g, "")})`}
            />
          )}
          {hasPending && (
            <path
              d={area(pendingPts)}
              fill={`url(#gp-${name.replace(/\s/g, "")})`}
            />
          )}
          <path
            d={area(spentPts)}
            fill={`url(#ga-${name.replace(/\s/g, "")})`}
          />
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
          {hasPending && pendingPts.length > 1 && (
            <path
              d={smoothPath(pendingPts)}
              fill="none"
              stroke="#FFD142"
              strokeDasharray="3,2"
              strokeOpacity={0.8}
              strokeWidth={1}
            />
          )}
          {hasRecur && recurPts.length > 1 && (
            <path
              d={smoothPath(recurPts)}
              fill="none"
              stroke="#8b5cf6"
              strokeDasharray="2,2"
              strokeOpacity={0.7}
              strokeWidth={1}
            />
          )}
          {data.map((d, i) => (
            <g key={i}>
              <rect
                className="cursor-pointer"
                fill="transparent"
                height={H}
                onClick={() => onPointClick(d.month)}
                onMouseEnter={() => setHoveredIdx(i)}
                width={24}
                x={toX(i) - 12}
                y={0}
              />
              <circle
                className="pointer-events-none"
                cx={toX(i)}
                cy={spentPts[i].y}
                fill={color}
                r={hoveredIdx === i ? 4 : 2.5}
              />
              {pendingAmt[i] > 0 && (
                <circle
                  className="pointer-events-none"
                  cx={toX(i)}
                  cy={pendingPts[i].y}
                  fill="#FFD142"
                  r={hoveredIdx === i ? 3.5 : 2}
                />
              )}
              {recurAmt[i] > 0 && (
                <circle
                  className="pointer-events-none"
                  cx={toX(i)}
                  cy={recurPts[i].y}
                  fill="#8b5cf6"
                  r={hoveredIdx === i ? 3 : 1.5}
                />
              )}
              <text
                fill="#7A6555"
                fontSize={7}
                textAnchor="middle"
                x={toX(i)}
                y={H - 6}
              >
                {d.month}
              </text>
            </g>
          ))}
        </svg>
        {hoveredIdx !== null && (
          <div
            className="pointer-events-none absolute top-0 z-20"
            style={{ left: xPct, transform: "translateX(-50%)" }}
          >
            <div className="whitespace-nowrap rounded-lg border border-[#3D3330] bg-[#2A2724] px-2.5 py-2 text-[10px] shadow-xl">
              {hoveredOrders.length > 0 ? (
                hoveredOrders.map((o) => (
                  <div className="text-[#FFEDD1] leading-snug" key={o.id}>
                    {o.name} — {fmt(calcTotal(o.items))}
                  </div>
                ))
              ) : (
                <div className="text-[#FFEDD1]">
                  {data[hoveredIdx].month}: {fmt(data[hoveredIdx].spent)}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Meta fields ────────────────────────────────────────────────────────────────
function MetaFields({
  approvedBy,
  submittedBy,
  onApprovedByChange,
  onSubmittedByChange,
  submittedByReadOnly,
}: {
  approvedBy: string;
  submittedBy: string;
  onApprovedByChange?: (v: string) => void;
  onSubmittedByChange?: (v: string) => void;
  submittedByReadOnly?: boolean;
}) {
  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <span className="whitespace-nowrap font-mono text-[#7A6555] text-[8.5px] uppercase tracking-wider">
          Approved by
        </span>
        <input
          className="h-6 w-40 rounded border border-[#3D3330] bg-[#1A1919] px-2 text-[#FFEDD1] text-[10px] outline-none transition-colors placeholder:text-[#4A3F38] focus:border-[#FFD142]/60"
          onChange={(e) => onApprovedByChange?.(e.target.value)}
          placeholder="—"
          value={approvedBy}
        />
      </div>
      <div className="flex items-center gap-2">
        <span className="whitespace-nowrap font-mono text-[#7A6555] text-[8.5px] uppercase tracking-wider">
          Submitted by
        </span>
        {submittedByReadOnly ? (
          <span className="w-40 truncate text-right font-medium text-[#C4A882] text-[10px]">
            {submittedBy || "—"}
          </span>
        ) : (
          <input
            className="h-6 w-40 rounded border border-[#3D3330] bg-[#1A1919] px-2 text-[#FFEDD1] text-[10px] outline-none transition-colors placeholder:text-[#4A3F38] focus:border-[#FFD142]/60"
            onChange={(e) => onSubmittedByChange?.(e.target.value)}
            placeholder="Your name"
            value={submittedBy}
          />
        )}
      </div>
    </div>
  );
}

// ── Order Form (Submit / Incoming / Recurring) ─────────────────────────────────
const FORM_GRID =
  "grid grid-cols-[1.75rem_minmax(9rem,1.5fr)_4.5rem_3.5rem_6.5rem_5.5rem_minmax(7rem,1fr)] gap-1.5";

function OrderForm({
  onTotalChange,
  onDeptChange,
  initialData,
  incomingSubmitter,
  recurringMode,
  initialIntervalDays,
  onIntervalChange,
  onSubmit,
}: {
  onTotalChange: (n: number) => void;
  onDeptChange?: (d: string) => void;
  initialData?: OrderRecord;
  incomingSubmitter?: string;
  recurringMode?: boolean;
  initialIntervalDays?: string;
  onIntervalChange?: (v: string) => void;
  onSubmit?: () => void;
}) {
  const isIncoming = incomingSubmitter !== undefined;

  const [rows, setRows] = useState<FormRow[]>(() => {
    if (initialData) {
      const filled = initialData.items.map((item) => ({
        id: item.id,
        link: item.link,
        pricePerPiece: String(item.pricePerPiece),
        quantity: String(item.quantity),
        orderType: item.orderType,
        urgency: item.urgency,
        comments: item.comments,
      }));
      while (filled.length < ROW_COUNT) filled.push(mkRow());
      return filled;
    }
    return Array.from({ length: ROW_COUNT }, mkRow);
  });
  const [orderName, setOrderName] = useState(initialData?.name ?? "");
  const [department, setDepartment] = useState(initialData?.department ?? "");
  const [approvedBy, setApprovedBy] = useState(initialData?.approvedBy ?? "");
  const [submittedBy, setSubmittedBy] = useState(
    isIncoming ? (incomingSubmitter ?? "") : ""
  );
  const [intervalDays, setIntervalDays] = useState(initialIntervalDays ?? "");

  function updateRow(i: number, patch: Partial<FormRow>) {
    setRows((r) => {
      const next = r.map((row, idx) =>
        idx === i ? { ...row, ...patch } : row
      );
      onTotalChange(rowsTotal(next));
      return next;
    });
  }

  function handleDept(d: string) {
    setDepartment(d);
    onDeptChange?.(d);
  }

  function handleClear() {
    const empty = Array.from({ length: ROW_COUNT }, mkRow);
    setRows(empty);
    setOrderName("");
    setDepartment("");
    onTotalChange(0);
    onDeptChange?.("");
  }

  const total = rowsTotal(rows);

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[#F0684D] text-[0.6rem] uppercase tracking-[0.22em]">
            Form PR-25
          </p>
          <h2 className="mt-0.5 font-semibold text-[#FFEDD1] text-base tracking-tight">
            {recurringMode
              ? "Recurring Order"
              : isIncoming
                ? "Incoming Order Review"
                : "Order Requisition Sheet"}
          </h2>
        </div>
        <MetaFields
          approvedBy={approvedBy}
          onApprovedByChange={setApprovedBy}
          onSubmittedByChange={isIncoming ? undefined : setSubmittedBy}
          submittedBy={isIncoming ? (incomingSubmitter ?? "") : submittedBy}
          submittedByReadOnly={isIncoming}
        />
      </div>

      {/* Meta selects */}
      <div
        className={`mb-3 grid gap-3 ${recurringMode ? "grid-cols-3" : "grid-cols-2"}`}
      >
        <label className="flex flex-col gap-1">
          <span className="font-mono text-[#7A6555] text-[8.5px] uppercase tracking-widest">
            Order list name
          </span>
          <input
            className={fieldCls}
            onChange={(e) => setOrderName(e.target.value)}
            placeholder="e.g. September Hardware Batch"
            value={orderName}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-mono text-[#7A6555] text-[8.5px] uppercase tracking-widest">
            Department
          </span>
          <select
            className={selectCls}
            onChange={(e) => handleDept(e.target.value)}
            value={department}
          >
            <option value="">Select department</option>
            {DEPT_LIST.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
        {recurringMode && (
          <label className="flex flex-col gap-1">
            <span className="font-mono text-[#7A6555] text-[8.5px] uppercase tracking-widest">
              Interval (days)
            </span>
            <input
              className={fieldCls}
              min="1"
              onChange={(e) => {
                setIntervalDays(e.target.value);
                onIntervalChange?.(e.target.value);
              }}
              placeholder="e.g. 30"
              type="number"
              value={intervalDays}
            />
          </label>
        )}
      </div>

      {/* Table header — sticky within scrollable parent */}
      <div
        className={`${FORM_GRID} sticky top-0 z-10 mb-0.5 border-[#3D3330] border-b bg-[#232120] pt-1 pb-1.5 font-mono text-[#7A6555] text-[8px] uppercase tracking-widest`}
      >
        <span>#</span>
        <span>Link / URL</span>
        <span>Price / pc</span>
        <span>Qty</span>
        <span>Type</span>
        <span>Urgency</span>
        <span>Comments</span>
      </div>

      {/* Rows */}
      <div className="mb-3 divide-y divide-[#3D3330]/40">
        {rows.map((row, i) => (
          <div
            className={`${FORM_GRID} items-center py-1 ${i % 5 === 4 ? "border-[#3D3330]/60 border-b" : ""}`}
            key={row.id}
          >
            <span className="font-mono text-[#7A6555] text-[9px]">
              {String(i + 1).padStart(2, "0")}
            </span>
            <input
              className={fieldCls}
              onChange={(e) => updateRow(i, { link: e.target.value })}
              placeholder="https://…"
              type="url"
              value={row.link}
            />
            <input
              className={`${fieldCls} text-right font-mono`}
              inputMode="decimal"
              min="0"
              onChange={(e) => updateRow(i, { pricePerPiece: e.target.value })}
              placeholder="0.00"
              step="0.01"
              type="number"
              value={row.pricePerPiece}
            />
            <input
              className={`${fieldCls} text-right font-mono`}
              inputMode="numeric"
              min="0"
              onChange={(e) => updateRow(i, { quantity: e.target.value })}
              placeholder="0"
              step="1"
              type="number"
              value={row.quantity}
            />
            <select
              className={selectCls}
              onChange={(e) => updateRow(i, { orderType: e.target.value })}
              value={row.orderType}
            >
              <option value="">—</option>
              {ORDER_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <select
              className={selectCls}
              onChange={(e) => updateRow(i, { urgency: e.target.value })}
              value={row.urgency}
            >
              <option value="">—</option>
              {URGENCIES.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
            <input
              className={fieldCls}
              maxLength={200}
              onChange={(e) => updateRow(i, { comments: e.target.value })}
              value={row.comments}
            />
          </div>
        ))}
      </div>

      {/* Footer — sticky bottom */}
      <div className="sticky bottom-0 flex items-center justify-between gap-4 border-[#3D3330] border-t bg-[#232120] pt-3 pb-1">
        <p className="text-[#9C8272] text-[11px]">
          Total:{" "}
          <span className="font-mono font-semibold text-[#FFD142]">
            {fmt(total)}
          </span>
          {recurringMode && intervalDays && (
            <span className="ml-2 text-[#8b5cf6]">
              every {intervalDays} days
            </span>
          )}
        </p>
        <div className="flex items-center gap-2">
          {!isIncoming && (
            <button
              className="rounded-lg px-3 py-1.5 text-[#9C8272] text-[11px] transition-colors hover:bg-white/5 hover:text-[#FFEDD1]"
              onClick={handleClear}
            >
              Clear sheet
            </button>
          )}
          <button
            className={`rounded-lg border px-5 py-1.5 font-semibold text-[11px] transition-colors ${
              recurringMode
                ? "border-[#8b5cf6]/40 bg-[#8b5cf6]/10 text-[#8b5cf6] hover:border-[#8b5cf6]/70 hover:bg-[#8b5cf6]/15"
                : "border-[#FFD142]/40 bg-[#FFD142]/10 text-[#FFD142] hover:border-[#FFD142]/70 hover:bg-[#FFD142]/15"
            }`}
            onClick={onSubmit}
          >
            {recurringMode
              ? "Save recurring order"
              : isIncoming
                ? "Approve order"
                : "Submit order"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Incoming panel ─────────────────────────────────────────────────────────────
function IncomingPanel({
  orders,
  onTotalChange,
  onDeptChange,
}: {
  orders: OrderRecord[];
  onTotalChange: (n: number) => void;
  onDeptChange: (d: string) => void;
}) {
  const [selectedId, setSelectedId] = useState(orders[0]?.id ?? "");
  const selected = orders.find((o) => o.id === selectedId) ?? orders[0];

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-20 text-[#4A3F38]">
        <span className="text-3xl">—</span>
        <span className="text-sm">No incoming orders</span>
      </div>
    );
  }

  return (
    <div>
      {orders.length > 1 && (
        <div className="sticky top-0 z-20 mb-4 flex items-center gap-2 border-[#3D3330] border-b bg-[#232120] pb-2">
          <span className="shrink-0 font-mono text-[#7A6555] text-[9px] uppercase tracking-widest">
            Viewing
          </span>
          <select
            className={`${selectCls} max-w-xs flex-1`}
            onChange={(e) => setSelectedId(e.target.value)}
            value={selectedId}
          >
            {orders.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name} — {o.submittedBy}
              </option>
            ))}
          </select>
        </div>
      )}
      <OrderForm
        incomingSubmitter={selected?.submittedBy}
        initialData={selected}
        key={selected?.id}
        onDeptChange={onDeptChange}
        onTotalChange={onTotalChange}
      />
    </div>
  );
}

// ── Upload buttons ─────────────────────────────────────────────────────────────
function UploadButtons({
  item,
  onPhotoUploaded,
  onInvoiceUploaded,
}: {
  item: OrderItem;
  onPhotoUploaded: () => void;
  onInvoiceUploaded: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {item.requiresPhoto && !item.photoUploaded && (
        <button
          className="whitespace-nowrap rounded border border-[#3D3330] px-2 py-1 text-[#9C8272] text-[9px] transition-colors hover:border-[#FFD142]/50 hover:text-[#FFD142]"
          onClick={onPhotoUploaded}
        >
          ↑ Photo
        </button>
      )}
      {item.requiresPhoto && item.photoUploaded && (
        <span className="whitespace-nowrap text-[#10b981] text-[9px]">
          ✓ Photo
        </span>
      )}
      {item.requiresInvoice && !item.invoiceUploaded && (
        <button
          className="whitespace-nowrap rounded border border-[#3D3330] px-2 py-1 text-[#9C8272] text-[9px] transition-colors hover:border-[#FFD142]/50 hover:text-[#FFD142]"
          onClick={onInvoiceUploaded}
        >
          ↑ Invoice
        </button>
      )}
      {item.requiresInvoice && item.invoiceUploaded && (
        <span className="whitespace-nowrap text-[#10b981] text-[9px]">
          ✓ Invoice
        </span>
      )}
    </div>
  );
}

// ── Order detail view ──────────────────────────────────────────────────────────
const DETAIL_GRID =
  "grid grid-cols-[1.75rem_minmax(9rem,1.5fr)_4.5rem_3.5rem_6.5rem_5.5rem_minmax(7rem,1fr)] gap-1.5";

function OrderDetailView({
  order,
  onClose,
}: {
  order: OrderRecord;
  onClose: () => void;
}) {
  const isPending = order.status === "pending";
  const uploadsOnly =
    order.status === "ordered" || order.status === "action_needed";
  const canEdit = isPending;

  const [items, setItems] = useState<OrderItem[]>(order.items);
  const [orderName, setOrderName] = useState(order.name);
  const [department, setDepartment] = useState(order.department);

  function updateItem(idx: number, patch: Partial<OrderItem>) {
    setItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, ...patch } : it))
    );
  }

  const total = calcTotal(items);

  return (
    <div>
      {/* Header */}
      <div className="sticky top-0 z-20 mb-4 flex items-center gap-3 border-[#3D3330] border-b bg-[#232120] pb-3">
        <button
          className="flex items-center gap-1.5 text-[#9C8272] text-[10px] transition-colors hover:text-[#FFEDD1]"
          onClick={onClose}
        >
          ← Back
        </button>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ background: STATUS_COLOR[order.status] }}
          />
          {canEdit ? (
            <input
              className="h-7 flex-1 rounded border border-[#3D3330] bg-[#1A1919] px-2 font-semibold text-[#FFEDD1] text-sm outline-none focus:border-[#FFD142]/60"
              onChange={(e) => setOrderName(e.target.value)}
              value={orderName}
            />
          ) : (
            <span className="truncate font-semibold text-[#FFEDD1] text-sm">
              {orderName}
            </span>
          )}
          <span
            className="shrink-0 rounded-full px-2 py-0.5 font-semibold text-[9px]"
            style={{
              background: `${STATUS_COLOR[order.status]}22`,
              color: STATUS_COLOR[order.status],
            }}
          >
            {STATUS_LABEL[order.status]}
          </span>
        </div>
        <div className="shrink-0 font-mono font-semibold text-[#FFD142] text-sm">
          {fmt(total)}
        </div>
      </div>

      {/* Order meta */}
      <div className="mb-5 grid grid-cols-3 gap-3 text-[10px]">
        <div>
          <span className="mb-1 block font-mono text-[#7A6555] text-[8px] uppercase tracking-wider">
            Department
          </span>
          {canEdit ? (
            <select
              className={`${selectCls} h-7 text-[10px]`}
              onChange={(e) => setDepartment(e.target.value)}
              value={department}
            >
              {DEPT_LIST.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-[#C4A882]">{department}</span>
          )}
        </div>
        <div>
          <span className="mb-1 block font-mono text-[#7A6555] text-[8px] uppercase tracking-wider">
            Submitted by
          </span>
          <span className="text-[#C4A882]">{order.submittedBy}</span>
        </div>
        <div>
          <span className="mb-1 block font-mono text-[#7A6555] text-[8px] uppercase tracking-wider">
            Approved by
          </span>
          <span className="text-[#C4A882]">{order.approvedBy || "—"}</span>
        </div>
      </div>

      {/* Items — detailed view */}
      {canEdit && (
        <div
          className={`${DETAIL_GRID} sticky top-[3.25rem] z-10 mb-0.5 border-[#3D3330] border-b bg-[#232120] pt-1 pb-1.5 font-mono text-[#7A6555] text-[8px] uppercase tracking-widest`}
        >
          <span>#</span>
          <span>Link / URL</span>
          <span>Price/pc</span>
          <span>Qty</span>
          <span>Type</span>
          <span>Urgency</span>
          <span>Comments</span>
        </div>
      )}

      <div className={canEdit ? "divide-y divide-[#3D3330]/40" : "space-y-3"}>
        {items.map((item, idx) =>
          canEdit ? (
            /* Pending: full editable row + upload buttons */
            <div className="py-2" key={item.id}>
              <div className={`${DETAIL_GRID} mb-1.5 items-center`}>
                <span className="font-mono text-[#7A6555] text-[9px]">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <input
                  className={fieldCls}
                  onChange={(e) => updateItem(idx, { link: e.target.value })}
                  placeholder="https://…"
                  type="url"
                  value={item.link}
                />
                <input
                  className={`${fieldCls} text-right font-mono`}
                  min="0"
                  onChange={(e) =>
                    updateItem(idx, {
                      pricePerPiece: Number.parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0.00"
                  step="0.01"
                  type="number"
                  value={item.pricePerPiece}
                />
                <input
                  className={`${fieldCls} text-right font-mono`}
                  min="0"
                  onChange={(e) =>
                    updateItem(idx, {
                      quantity: Number.parseInt(e.target.value, 10) || 0,
                    })
                  }
                  placeholder="0"
                  step="1"
                  type="number"
                  value={item.quantity}
                />
                <select
                  className={selectCls}
                  onChange={(e) =>
                    updateItem(idx, { orderType: e.target.value })
                  }
                  value={item.orderType}
                >
                  <option value="">—</option>
                  {ORDER_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <select
                  className={selectCls}
                  onChange={(e) => updateItem(idx, { urgency: e.target.value })}
                  value={item.urgency}
                >
                  <option value="">—</option>
                  {URGENCIES.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
                <input
                  className={fieldCls}
                  maxLength={200}
                  onChange={(e) =>
                    updateItem(idx, { comments: e.target.value })
                  }
                  value={item.comments}
                />
              </div>
              <div className="flex items-center gap-3 pl-7">
                <span className="font-mono text-[#C4A882] text-[9px]">
                  {fmt(item.pricePerPiece)} × {item.quantity} ={" "}
                  <span className="font-semibold text-[#FFD142]">
                    {fmt(item.pricePerPiece * item.quantity)}
                  </span>
                </span>
                <UploadButtons
                  item={item}
                  onInvoiceUploaded={() =>
                    updateItem(idx, { invoiceUploaded: true })
                  }
                  onPhotoUploaded={() =>
                    updateItem(idx, { photoUploaded: true })
                  }
                />
              </div>
            </div>
          ) : (
            /* Non-pending: rich card view with clear pricing */
            <div
              className="rounded-xl border border-[#3D3330] bg-[#1A1919] p-4"
              key={item.id}
            >
              <div className="mb-3 flex items-start justify-between gap-4">
                <div className="flex min-w-0 flex-1 items-start gap-2">
                  <span
                    className="mt-1 h-2 w-2 shrink-0 rounded-full"
                    style={{ background: ITEM_STATUS_COLOR[item.status] }}
                  />
                  <div className="min-w-0">
                    <p className="font-medium text-[#FFEDD1] text-sm leading-snug">
                      {item.description}
                    </p>
                    <a
                      className="block truncate text-[#7A6555] text-[10px] underline-offset-2 transition-colors hover:text-[#C4A882]"
                      href={item.link}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {item.link}
                    </a>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-mono font-semibold text-[#FFEDD1] text-xl">
                    {fmt(item.pricePerPiece * item.quantity)}
                  </p>
                  <p className="font-mono text-[#9C8272] text-[10px]">
                    {fmt(item.pricePerPiece)} × {item.quantity}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="rounded-full px-1.5 py-0.5 font-semibold text-[9px]"
                  style={{
                    background: `${ITEM_STATUS_COLOR[item.status]}22`,
                    color: ITEM_STATUS_COLOR[item.status],
                  }}
                >
                  {item.status}
                </span>
                <span className="rounded-full bg-[#2A2724] px-1.5 py-0.5 text-[#7A6555] text-[9px]">
                  {item.orderType}
                </span>
                <span className="text-[#7A6555] text-[9px]">
                  {item.urgency}
                </span>
                {item.comments && (
                  <span className="text-[#7A6555] text-[9px] italic">
                    "{item.comments}"
                  </span>
                )}
                {uploadsOnly && (
                  <div className="ml-auto">
                    <UploadButtons
                      item={item}
                      onInvoiceUploaded={() =>
                        updateItem(idx, { invoiceUploaded: true })
                      }
                      onPhotoUploaded={() =>
                        updateItem(idx, { photoUploaded: true })
                      }
                    />
                  </div>
                )}
              </div>
            </div>
          )
        )}
      </div>

      {canEdit && (
        <div className="sticky bottom-0 mt-3 flex items-center justify-between border-[#3D3330] border-t bg-[#232120] pt-3 pb-1">
          <p className="text-[#9C8272] text-[11px]">
            Total:{" "}
            <span className="font-mono font-semibold text-[#FFD142]">
              {fmt(total)}
            </span>
          </p>
          <button className="rounded-lg border border-[#FFD142]/40 bg-[#FFD142]/10 px-5 py-1.5 font-semibold text-[#FFD142] text-[11px] transition-colors hover:border-[#FFD142]/70">
            Save changes
          </button>
        </div>
      )}
    </div>
  );
}

// ── Overview list ──────────────────────────────────────────────────────────────
function OrderOverviewList({
  orders,
  isPast,
  recurring,
  onRecurringUpdate,
}: {
  orders: OrderRecord[];
  isPast: boolean;
  recurring?: RecurringOrder[];
  onRecurringUpdate?: (r: RecurringOrder[]) => void;
}) {
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [approvedBy, setApprovedBy] = useState("Liam Bakker");
  const [submittedBy, setSubmittedBy] = useState("Admin user");

  const sorted = [...orders].sort((a, b) => {
    const p = (s: OrderStatus) =>
      s === "action_needed" ? 0 : s === "pending" ? 1 : 2;
    return p(a.status) - p(b.status);
  });

  if (selectedOrder) {
    return (
      <div className="flex flex-col">
        <OrderDetailView
          onClose={() => setSelectedOrder(null)}
          order={selectedOrder}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="sticky top-0 z-10 mb-4 flex items-start justify-between border-[#3D3330] border-b bg-[#232120] pb-3">
        <h2 className="font-semibold text-[#FFEDD1] text-sm">
          {isPast ? "Past Orders" : "Current Orders"}
        </h2>
        <MetaFields
          approvedBy={approvedBy}
          onApprovedByChange={setApprovedBy}
          onSubmittedByChange={setSubmittedBy}
          submittedBy={submittedBy}
        />
      </div>

      <div className="mb-4 space-y-1.5">
        {sorted.map((order) => {
          const total = calcTotal(order.items);
          return (
            <button
              className="flex w-full items-center gap-2.5 rounded-xl border border-[#3D3330] bg-[#1A1919] px-3 py-2.5 text-left transition-all hover:border-[#4A3F38] hover:bg-[#232120]"
              key={order.id}
              onClick={() => setSelectedOrder(order)}
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: STATUS_COLOR[order.status] }}
              />
              <span className="flex-1 truncate font-medium text-[#FFEDD1] text-xs">
                {order.name}
              </span>
              <span className="shrink-0 text-[#9C8272] text-[10px]">
                {order.department}
              </span>
              <span className="shrink-0 font-mono font-semibold text-[#C4A882] text-[11px]">
                {fmt(total)}
              </span>
              <span
                className="shrink-0 rounded-full px-1.5 py-0.5 font-semibold text-[9px]"
                style={{
                  background: `${STATUS_COLOR[order.status]}22`,
                  color: STATUS_COLOR[order.status],
                }}
              >
                {STATUS_LABEL[order.status]}
              </span>
              <span className="shrink-0 text-[#7A6555] text-[10px]">→</span>
            </button>
          );
        })}
        {sorted.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-[#4A3F38]">
            <span className="font-thin text-3xl">—</span>
            <span className="text-sm">No orders</span>
          </div>
        )}
      </div>

      {/* Recurring orders section — only in Overview (not Past) */}
      {!isPast && recurring && recurring.length > 0 && onRecurringUpdate && (
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="font-semibold text-[#8b5cf6] text-[9px] uppercase tracking-widest">
              Recurring Orders
            </span>
            <div className="h-px flex-1 bg-[#3D3330]" />
          </div>
          <div className="space-y-1.5">
            {recurring.map((rec) => {
              const total = rowsTotal(rec.rows);
              return (
                <div
                  className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all ${
                    rec.enabled
                      ? rec.paused
                        ? "border-[#3D3330] bg-[#1A1919] opacity-70"
                        : "border-[#8b5cf6]/30 bg-[#1A1919]"
                      : "border-[#3D3330] bg-[#1A1919] opacity-50"
                  }`}
                  key={rec.id}
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{
                      background: rec.enabled
                        ? rec.paused
                          ? "#7A6555"
                          : "#8b5cf6"
                        : "#3D3330",
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-[#FFEDD1] text-xs">
                      {rec.name}
                    </span>
                    <span className="text-[#7A6555] text-[9px]">
                      {rec.department} · every {rec.intervalDays} days
                    </span>
                  </div>
                  <span className="shrink-0 font-mono font-semibold text-[#C4A882] text-[11px]">
                    {fmt(total)}
                  </span>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      className={`rounded border px-2 py-0.5 text-[9px] transition-colors ${
                        rec.paused
                          ? "border-[#10b981]/40 text-[#10b981] hover:bg-[#10b981]/10"
                          : "border-[#FFD142]/40 text-[#FFD142] hover:bg-[#FFD142]/10"
                      } disabled:cursor-not-allowed disabled:opacity-40`}
                      disabled={!rec.enabled}
                      onClick={() =>
                        onRecurringUpdate(
                          recurring.map((r) =>
                            r.id === rec.id ? { ...r, paused: !r.paused } : r
                          )
                        )
                      }
                    >
                      {rec.paused ? "Resume" : "Pause"}
                    </button>
                    <button
                      className={`rounded border px-2 py-0.5 text-[9px] transition-colors ${
                        rec.enabled
                          ? "border-[#f43f5e]/40 text-[#f43f5e] hover:bg-[#f43f5e]/10"
                          : "border-[#3D3330] text-[#9C8272] hover:text-[#FFEDD1]"
                      }`}
                      onClick={() =>
                        onRecurringUpdate(
                          recurring.map((r) =>
                            r.id === rec.id
                              ? { ...r, enabled: !r.enabled, paused: false }
                              : r
                          )
                        )
                      }
                    >
                      {rec.enabled ? "Disable" : "Enable"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Recurring panel ────────────────────────────────────────────────────────────
function RecurringPanel({
  recurring,
  onAdd,
  onTotalChange,
  onDeptChange,
}: {
  recurring: RecurringOrder[];
  onAdd: (r: RecurringOrder) => void;
  onTotalChange: (n: number) => void;
  onDeptChange: (d: string) => void;
}) {
  const [intervalDays, setIntervalDays] = useState("30");

  return (
    <div>
      <OrderForm
        initialIntervalDays={intervalDays}
        onDeptChange={onDeptChange}
        onIntervalChange={setIntervalDays}
        onSubmit={() => {}}
        onTotalChange={onTotalChange}
        recurringMode
      />
    </div>
  );
}

// ── Clicked orders (chart point) view ─────────────────────────────────────────
function ClickedOrdersView({
  orders,
  onClose,
}: {
  orders: OrderRecord[];
  onClose: () => void;
}) {
  return (
    <div>
      <div className="sticky top-0 z-10 mb-3 flex items-center justify-between border-[#3D3330] border-b bg-[#232120] pb-2">
        <h3 className="font-semibold text-[#FFEDD1] text-xs">
          Orders — {orders[0]?.monthLabel}
        </h3>
        <button
          className="text-[#7A6555] text-[10px] transition-colors hover:text-[#F0684D]"
          onClick={onClose}
        >
          ✕ Close
        </button>
      </div>
      <div className="space-y-2">
        {orders.map((o) => (
          <div
            className="rounded-xl border border-[#3D3330] bg-[#2A2724] p-3"
            key={o.id}
          >
            <div className="mb-1 flex items-center gap-2">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: STATUS_COLOR[o.status] }}
              />
              <span className="flex-1 truncate font-medium text-[#FFEDD1] text-xs">
                {o.name}
              </span>
              <span className="shrink-0 font-mono font-semibold text-[#FFD142] text-xs">
                {fmt(calcTotal(o.items))}
              </span>
            </div>
            <div className="text-[#7A6555] text-[10px]">
              {o.department} · {o.submittedBy} · {STATUS_LABEL[o.status]}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────
export function OrdersPanel({ data }: { data: BudgetData }) {
  const [tab, setTab] = useState<Tab>("submit");
  const [formTotal, setFormTotal] = useState(0);
  const [formDept, setFormDept] = useState("");
  const [chartPeriod, setChartPeriod] = useState<Period>("6M");
  const [clickedOrders, setClickedOrders] = useState<OrderRecord[] | null>(
    null
  );
  const [recurring, setRecurring] = useState<RecurringOrder[]>(INIT_RECURRING);
  const [recurFormTotal, setRecurFormTotal] = useState(0);
  const [recurFormDept, setRecurFormDept] = useState("");

  const currentOrders = MOCK_ORDERS.filter((o) => !o.isPast);
  const pastOrders = MOCK_ORDERS.filter((o) => o.isPast);
  const incomingOrders = currentOrders.filter(
    (o) => o.status === "pending" && o.submittedBy !== "Admin user"
  );

  const showDeptChart =
    tab === "submit" || tab === "incoming" || tab === "recurring";
  const showOrderOverlay = tab === "submit" || tab === "incoming";
  const showRecurOverlay = tab === "recurring";

  // Pending amounts for charts
  const pendingByMonth: Record<string, number> = {};
  MOCK_ORDERS.filter((o) => o.status === "pending").forEach((o) => {
    pendingByMonth[o.monthLabel] =
      (pendingByMonth[o.monthLabel] ?? 0) + calcTotal(o.items);
  });
  if (tab === "submit" && formTotal > 0) {
    pendingByMonth["Sep"] = (pendingByMonth["Sep"] ?? 0) + formTotal;
  }

  // Recurring amounts for charts (enabled & not paused)
  const recurringByMonth: Record<string, number> = {};
  recurring
    .filter((r) => r.enabled && !r.paused)
    .forEach((r) => {
      const t = rowsTotal(r.rows);
      // Distribute across months proportionally — simplify: add to current + next month
      recurringByMonth["Sep"] = (recurringByMonth["Sep"] ?? 0) + t;
    });
  if (showRecurOverlay && recurFormTotal > 0) {
    recurringByMonth["Sep"] = (recurringByMonth["Sep"] ?? 0) + recurFormTotal;
  }

  const activeDept =
    tab === "incoming"
      ? (incomingOrders[0]?.department ?? "Mechanical")
      : tab === "recurring"
        ? recurFormDept || "Mechanical"
        : formDept || "Mechanical";
  const deptColor =
    (DEPT_COLORS as Record<string, string>)[activeDept] ?? "#F0684D";

  const deptPendingByMonth: Record<string, number> = {};
  MOCK_ORDERS.filter(
    (o) => o.status === "pending" && o.department === activeDept
  ).forEach((o) => {
    deptPendingByMonth[o.monthLabel] =
      (deptPendingByMonth[o.monthLabel] ?? 0) + calcTotal(o.items);
  });
  if (tab === "submit" && formTotal > 0 && formDept === activeDept) {
    deptPendingByMonth["Sep"] = (deptPendingByMonth["Sep"] ?? 0) + formTotal;
  }
  const deptRecurringByMonth: Record<string, number> = {};
  recurring
    .filter((r) => r.enabled && !r.paused && r.department === activeDept)
    .forEach((r) => {
      deptRecurringByMonth["Sep"] =
        (deptRecurringByMonth["Sep"] ?? 0) + rowsTotal(r.rows);
    });

  function ordersForMonth(month: string): OrderRecord[] {
    return MOCK_ORDERS.filter((o) => o.monthLabel === month);
  }
  function handlePointClick(month: string) {
    const orders = ordersForMonth(month);
    if (orders.length > 0) setClickedOrders(orders);
  }

  const activeRecurTotal =
    recurring
      .filter((r) => r.enabled && !r.paused)
      .reduce((s, r) => s + rowsTotal(r.rows), 0) +
    (showRecurOverlay ? recurFormTotal : 0);

  const TABS: { id: Tab; label: string; special?: boolean }[] = [
    { id: "submit", label: "Submit" },
    { id: "overview", label: "Overview" },
    { id: "incoming", label: "Incoming" },
    { id: "past", label: "Past Orders" },
    { id: "recurring", label: "Recurring", special: true },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {/* Budget Bar */}
      <BudgetBar
        data={data}
        orderAmount={showOrderOverlay ? formTotal : 0}
        recurringAmount={activeRecurTotal}
        showOrder={showOrderOverlay}
      />

      {/* Tab Buttons */}
      <div className="flex shrink-0 flex-wrap items-center gap-1.5">
        {TABS.map((t) => (
          <button
            className={`rounded-lg border px-4 py-1.5 font-medium text-xs transition-all ${
              t.special
                ? tab === t.id
                  ? "border-[#8b5cf6]/40 bg-[#8b5cf6]/20 text-[#c4b5fd]"
                  : "border-[#8b5cf6]/20 text-[#8b5cf6]/60 hover:bg-[#8b5cf6]/10 hover:text-[#c4b5fd]"
                : tab === t.id
                  ? "border-[#4A3F38] bg-[#2A2724] text-[#FFEDD1]"
                  : "border-transparent text-[#9C8272] hover:bg-white/5 hover:text-[#FFEDD1]"
            }`}
            key={t.id}
            onClick={() => {
              setTab(t.id);
              setClickedOrders(null);
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Charts panel */}
      <div className="shrink-0 rounded-2xl border border-[#3D3330] bg-[#232120] px-4 pt-3 pb-2">
        <SpendingChart
          color="#F0684D"
          name="Total"
          onPeriodChange={setChartPeriod}
          onPointClick={handlePointClick}
          ordersForMonth={ordersForMonth}
          pendingByMonth={pendingByMonth}
          period={chartPeriod}
          recurringByMonth={recurringByMonth}
          title="Team Expenses"
        />
        {showDeptChart && (
          <div className="mt-3 border-[#3D3330] border-t pt-3">
            <SpendingChart
              color={deptColor}
              name={activeDept}
              onPeriodChange={setChartPeriod}
              onPointClick={handlePointClick}
              ordersForMonth={ordersForMonth}
              pendingByMonth={deptPendingByMonth}
              period={chartPeriod}
              recurringByMonth={deptRecurringByMonth}
              title={`${activeDept} Department Expenses`}
            />
          </div>
        )}
      </div>

      {/* Content Panel — overflow-auto so entire form scrolls */}
      <div className="min-h-0 flex-1 overflow-auto rounded-2xl border border-[#3D3330] bg-[#232120] px-4 pt-4">
        {clickedOrders ? (
          <ClickedOrdersView
            onClose={() => setClickedOrders(null)}
            orders={clickedOrders}
          />
        ) : (
          <>
            {tab === "submit" && (
              <OrderForm
                onDeptChange={setFormDept}
                onTotalChange={setFormTotal}
              />
            )}
            {tab === "overview" && (
              <OrderOverviewList
                isPast={false}
                onRecurringUpdate={setRecurring}
                orders={currentOrders}
                recurring={recurring}
              />
            )}
            {tab === "incoming" && (
              <IncomingPanel
                onDeptChange={setFormDept}
                onTotalChange={setFormTotal}
                orders={incomingOrders}
              />
            )}
            {tab === "past" && <OrderOverviewList isPast orders={pastOrders} />}
            {tab === "recurring" && (
              <RecurringPanel
                onAdd={(r) => setRecurring((prev) => [...prev, r])}
                onDeptChange={setRecurFormDept}
                onTotalChange={setRecurFormTotal}
                recurring={recurring}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
