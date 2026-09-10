// biome-ignore-all assist/source/useSortedAttributes: Preserves the imported ordering dashboard JSX attribute order.
// biome-ignore-all lint: Preserves the imported ordering dashboard interaction and formatting conventions.
"use client";

import { useState } from "react";
import { DEPT_COLORS, MONTHLY_SPEND } from "./data";
import type { BudgetData } from "./types";

// ── Types ──────────────────────────────────────────────────────────────────────
type Tab = "submit" | "overview" | "incoming" | "past";
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
  isRecurring?: boolean;
  recurInterval?: string;
  recurEndDate?: string;
  recurPaused?: boolean;
  recurEnabled?: boolean;
}
interface FormRow {
  id: string;
  link: string;
  pricePerPiece: string;
  quantity: string;
  orderType: string;
  urgency: string;
  comments: string;
  recurTime?: string;
  recurTimescale?: string;
  recurEndDate?: string;
}
interface Draft {
  id: string;
  name: string;
  department: string;
  rows: FormRow[];
  approvedBy: string;
  submittedBy: string;
  savedAt: string;
  isRecurring?: boolean;
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
const INIT_ROWS = 8;

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
      s + (parseFloat(r.pricePerPiece) || 0) * (parseInt(r.quantity) || 0),
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
  recurTime: "",
  recurTimescale: "Days",
  recurEndDate: "",
});
const rowHasContent = (r: FormRow) =>
  !!(
    r.link ||
    r.pricePerPiece ||
    r.quantity ||
    r.orderType ||
    r.urgency ||
    r.comments
  );

function matchesSearch(order: OrderRecord, q: string): boolean {
  if (!q.trim()) return true;
  const lq = q.toLowerCase();
  return (
    order.name.toLowerCase().includes(lq) ||
    order.department.toLowerCase().includes(lq) ||
    order.submittedBy.toLowerCase().includes(lq) ||
    order.items.some(
      (i) =>
        i.description.toLowerCase().includes(lq) ||
        i.orderType.toLowerCase().includes(lq)
    )
  );
}

// ── Mock data ──────────────────────────────────────────────────────────────────
const MOCK_ORDERS: OrderRecord[] = [
  {
    id: "ol1",
    name: "September Hardware Batch",
    department: "Mechanical",
    submittedBy: "Alex van den Berg",
    approvedBy: "Liam Bakker",
    submittedAt: "2026-09-01",
    monthLabel: "Sep'26",
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
    monthLabel: "Sep'26",
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
    monthLabel: "Sep'26",
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
    monthLabel: "Aug'26",
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
    monthLabel: "Jul'26",
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
    monthLabel: "Aug'26",
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
  {
    id: "ol7",
    name: "Board Travel Jun",
    department: "Board",
    submittedBy: "Liam Bakker",
    approvedBy: "Liam Bakker",
    submittedAt: "2026-06-12",
    monthLabel: "Jun'26",
    status: "arrived",
    isPast: true,
    items: [
      {
        id: "i13",
        link: "https://booking.com/flights",
        description: "Flights Amsterdam–Berlin (×3)",
        pricePerPiece: 180,
        quantity: 3,
        orderType: "Social",
        urgency: "7 days",
        comments: "Economy class",
        status: "arrived",
        requiresPhoto: false,
        requiresInvoice: true,
        photoUploaded: false,
        invoiceUploaded: true,
      },
      {
        id: "i14",
        link: "https://booking.com/hotel",
        description: "Hotel Berlin (3 nights)",
        pricePerPiece: 120,
        quantity: 3,
        orderType: "Social",
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
  // Recurring orders
  {
    id: "rec1",
    name: "Monthly Cleaning Supplies",
    department: "Board",
    submittedBy: "Admin user",
    approvedBy: "Liam Bakker",
    submittedAt: "2026-09-01",
    monthLabel: "Sep'26",
    status: "ordered",
    isPast: false,
    isRecurring: true,
    recurInterval: "1 Month",
    recurEndDate: "2027-06-01",
    recurEnabled: true,
    recurPaused: false,
    items: [
      {
        id: "ri1",
        link: "https://example.com/cleaning",
        description: "Cleaning supplies restock",
        pricePerPiece: 15,
        quantity: 3,
        orderType: "Hardware",
        urgency: "7 days",
        comments: "Monthly restock",
        status: "ordered",
        requiresPhoto: false,
        requiresInvoice: true,
        photoUploaded: false,
        invoiceUploaded: false,
      },
    ],
  },
  {
    id: "rec2",
    name: "Weekly Coffee & Snacks",
    department: "Board",
    submittedBy: "Admin user",
    approvedBy: "Liam Bakker",
    submittedAt: "2026-09-05",
    monthLabel: "Sep'26",
    status: "pending",
    isPast: false,
    isRecurring: true,
    recurInterval: "1 Week",
    recurEndDate: "2026-12-31",
    recurEnabled: true,
    recurPaused: false,
    items: [
      {
        id: "ri2",
        link: "https://example.com/coffee",
        description: "Coffee beans 500g",
        pricePerPiece: 12,
        quantity: 2,
        orderType: "Hardware",
        urgency: "3 days",
        comments: "",
        status: "pending",
        requiresPhoto: false,
        requiresInvoice: false,
        photoUploaded: false,
        invoiceUploaded: false,
      },
      {
        id: "ri3",
        link: "https://example.com/snacks",
        description: "Snack assortment",
        pricePerPiece: 18,
        quantity: 1,
        orderType: "Hardware",
        urgency: "3 days",
        comments: "",
        status: "pending",
        requiresPhoto: false,
        requiresInvoice: false,
        photoUploaded: false,
        invoiceUploaded: false,
      },
    ],
  },
  {
    id: "rec3",
    name: "Software License Renewal",
    department: "Software",
    submittedBy: "Daan Mulder",
    approvedBy: "Liam Bakker",
    submittedAt: "2026-09-01",
    monthLabel: "Sep'26",
    status: "ordered",
    isPast: false,
    isRecurring: true,
    recurInterval: "1 Month",
    recurEndDate: "2027-09-01",
    recurEnabled: true,
    recurPaused: true,
    items: [
      {
        id: "ri4",
        link: "https://example.com/license",
        description: "Tool licence seat",
        pricePerPiece: 40,
        quantity: 5,
        orderType: "Software",
        urgency: "7 days",
        comments: "Auto-renew",
        status: "ordered",
        requiresPhoto: false,
        requiresInvoice: true,
        photoUploaded: false,
        invoiceUploaded: false,
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
  const orderPct = showOrder
    ? Math.min((orderAmount / data.total) * 100, rem)
    : 0;
  const recurPct = Math.min(
    (recurringAmount / data.total) * 100,
    rem - orderPct
  );

  return (
    <div className="shrink-0 flex items-center gap-3 px-4 py-2.5 rounded-2xl border border-[#3D3330] bg-[#232120]">
      <span className="text-xs font-bold text-[#FFEDD1] shrink-0">
        Budget {new Date().getFullYear()}
      </span>
      <div className="relative flex-1 h-1.5 rounded-full bg-[#3D3330] overflow-hidden">
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
              left: `${spentPct + orderPct}%`,
              width: `${recurPct}%`,
              background: "#8b5cf6",
              opacity: 0.8,
            }}
          />
        )}
      </div>
      <span className="text-xs text-[#C4A882] shrink-0 flex items-center gap-1 flex-wrap justify-end">
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

// ── Spending Chart (scrollable) ────────────────────────────────────────────────
function SpendingChart({
  name,
  color,
  pendingByMonth,
  recurringByMonth,
  onPointClick,
  filteredOrdersForMonth,
  title,
  period,
  onPeriodChange,
  searchQuery,
  onSearchChange,
}: {
  name: string;
  color: string;
  pendingByMonth?: Record<string, number>;
  recurringByMonth?: Record<string, number>;
  onPointClick: (month: string) => void;
  filteredOrdersForMonth: (month: string) => OrderRecord[];
  title: string;
  period: Period;
  onPeriodChange: (p: Period) => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
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

  const PT_W = 90; // pixels per slot — full width = 24 slots regardless of period
  const H = 110;
  const PAD = { l: 42, r: 24, t: 14, b: 28 };
  const W = PAD.l + 24 * PT_W + PAD.r; // always the 24-month canvas width
  const iW = W - PAD.l - PAD.r;
  const iH = H - PAD.t - PAD.b;

  // Spread N points proportionally across the full canvas width
  const toX = (i: number) =>
    PAD.l + (data.length > 1 ? (i / (data.length - 1)) * iW : iW / 2);
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
  const hoveredOrders =
    hoveredIdx !== null ? filteredOrdersForMonth(data[hoveredIdx].month) : [];

  // Months that have matching filtered orders (highlight)
  const matchedMonths = new Set(
    data.map((d) => d.month).filter((m) => filteredOrdersForMonth(m).length > 0)
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-semibold text-[#C4A882] uppercase tracking-wider">
            {title}
          </span>
          <div className="flex items-center gap-2 text-[8px] text-[#7A6555]">
            <span className="flex items-center gap-1">
              <svg width="12" height="2">
                <line
                  x1="0"
                  y1="1"
                  x2="12"
                  y2="1"
                  stroke={color}
                  strokeWidth="1.5"
                  strokeDasharray="3,2"
                />
              </svg>
              Budget
            </span>
            <span className="flex items-center gap-1">
              <svg width="12" height="2">
                <line
                  x1="0"
                  y1="1"
                  x2="12"
                  y2="1"
                  stroke={color}
                  strokeWidth="1.5"
                />
              </svg>
              Spent
            </span>
            {hasPending && (
              <span className="flex items-center gap-1">
                <svg width="12" height="2">
                  <line
                    x1="0"
                    y1="1"
                    x2="12"
                    y2="1"
                    stroke="#FFD142"
                    strokeWidth="1.5"
                  />
                </svg>
                Pending
              </span>
            )}
            {hasRecur && (
              <span className="flex items-center gap-1">
                <svg width="12" height="2">
                  <line
                    x1="0"
                    y1="1"
                    x2="12"
                    y2="1"
                    stroke="#8b5cf6"
                    strokeWidth="1.5"
                  />
                </svg>
                Recurring
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onSearchChange !== undefined && (
            <div className="relative">
              <svg
                className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none"
                width="10"
                height="10"
                viewBox="0 0 10 10"
                fill="none"
              >
                <circle
                  cx="4"
                  cy="4"
                  r="3"
                  stroke="#7A6555"
                  strokeWidth="1.2"
                />
                <line
                  x1="6.5"
                  y1="6.5"
                  x2="9"
                  y2="9"
                  stroke="#7A6555"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
              </svg>
              <input
                className="h-7 w-48 rounded border border-[#3D3330] bg-[#1A1919] pl-6 pr-2.5 text-[10px] text-[#FFEDD1] outline-none transition-colors placeholder:text-[#4A3F38] focus:border-[#FFD142]/60 focus:ring-1 focus:ring-[#FFD142]/20"
                placeholder="Search orders, departments…"
                value={searchQuery ?? ""}
                onChange={(e) => onSearchChange(e.target.value)}
              />
              {searchQuery && (
                <button
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[#7A6555] hover:text-[#F0684D] transition-colors text-[9px]"
                  onClick={() => onSearchChange("")}
                >
                  ✕
                </button>
              )}
            </div>
          )}
          <div className="flex items-center gap-0.5">
            {(["1M", "6M", "1Y"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => onPeriodChange(p)}
                className={`px-1.5 py-0.5 rounded text-[8px] font-semibold transition-colors ${period === p ? "bg-[#3D3330] text-[#FFEDD1]" : "text-[#7A6555] hover:text-[#C4A882]"}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Scrollable chart */}
      <div
        className="overflow-x-auto"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "#3D3330 transparent",
        }}
        onMouseLeave={() => setHoveredIdx(null)}
      >
        <div className="relative" style={{ width: W, height: H }}>
          <svg width={W} height={H} style={{ display: "block" }}>
            <defs>
              <linearGradient
                id={`ga-${name.replace(/\s/g, "")}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={color} stopOpacity="0.22" />
                <stop offset="100%" stopColor={color} stopOpacity="0.02" />
              </linearGradient>
              <linearGradient
                id={`gp-${name.replace(/\s/g, "")}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#FFD142" stopOpacity="0.16" />
                <stop offset="100%" stopColor="#FFD142" stopOpacity="0.02" />
              </linearGradient>
              <linearGradient
                id={`gr-${name.replace(/\s/g, "")}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.16" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((f) => {
              const y = PAD.t + iH * (1 - f);
              const val = Math.round(maxY * f);
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
                    x={PAD.l - 4}
                    y={y + 3}
                    textAnchor="end"
                    fontSize={8}
                    fill="#7A6555"
                  >
                    {val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
                  </text>
                </g>
              );
            })}

            {/* Month highlight for search matches */}
            {searchQuery &&
              data.map(
                (d, i) =>
                  matchedMonths.has(d.month) && (
                    <rect
                      key={i}
                      x={toX(i) - PT_W / 2}
                      y={PAD.t}
                      width={PT_W}
                      height={iH}
                      fill="#FFD142"
                      fillOpacity={0.04}
                      rx={2}
                    />
                  )
              )}

            {/* Areas */}
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

            {/* Lines */}
            {budgetPts.length > 1 && (
              <path
                d={smoothPath(budgetPts)}
                fill="none"
                stroke={color}
                strokeWidth={1}
                strokeDasharray="4,3"
                strokeOpacity={0.5}
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
                strokeWidth={1}
                strokeDasharray="3,2"
                strokeOpacity={0.8}
              />
            )}
            {hasRecur && recurPts.length > 1 && (
              <path
                d={smoothPath(recurPts)}
                fill="none"
                stroke="#8b5cf6"
                strokeWidth={1}
                strokeDasharray="2,2"
                strokeOpacity={0.7}
              />
            )}

            {/* Points + hit areas */}
            {data.map((d, i) => {
              const hasMatch = searchQuery ? matchedMonths.has(d.month) : false;
              return (
                <g key={i}>
                  <rect
                    x={toX(i) - PT_W / 2}
                    y={0}
                    width={PT_W}
                    height={H}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredIdx(i)}
                    onClick={() => onPointClick(d.month)}
                  />
                  <circle
                    cx={toX(i)}
                    cy={spentPts[i].y}
                    r={hoveredIdx === i ? 5 : hasMatch ? 4 : 2.5}
                    fill={hasMatch ? "#FFD142" : color}
                    className="pointer-events-none transition-all"
                  />
                  {pendingAmt[i] > 0 && (
                    <circle
                      cx={toX(i)}
                      cy={pendingPts[i].y}
                      r={hoveredIdx === i ? 3.5 : 2}
                      fill="#FFD142"
                      className="pointer-events-none"
                    />
                  )}
                  {recurAmt[i] > 0 && (
                    <circle
                      cx={toX(i)}
                      cy={recurPts[i].y}
                      r={hoveredIdx === i ? 3 : 1.5}
                      fill="#8b5cf6"
                      className="pointer-events-none"
                    />
                  )}
                  <text
                    x={toX(i)}
                    y={H - 8}
                    textAnchor="middle"
                    fontSize={8}
                    fill={hasMatch ? "#FFD142" : "#7A6555"}
                  >
                    {d.month}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Tooltip */}
          {hoveredIdx !== null && (
            <div
              className="absolute pointer-events-none z-20"
              style={{
                left: toX(hoveredIdx),
                top: 0,
                transform: "translateX(-50%)",
              }}
            >
              <div className="bg-[#2A2724] border border-[#3D3330] rounded-lg px-2.5 py-2 shadow-xl text-[10px] whitespace-nowrap mt-1">
                {hoveredOrders.length > 0 ? (
                  hoveredOrders.map((o) => (
                    <div key={o.id} className="text-[#FFEDD1] leading-snug">
                      {o.name} —{" "}
                      <span className="font-mono text-[#FFD142]">
                        {fmt(calcTotal(o.items))}
                      </span>
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
    <div className="flex flex-col items-end gap-1 shrink-0">
      <div className="flex items-center gap-2">
        <span className="font-mono text-[8.5px] text-[#7A6555] uppercase tracking-wider whitespace-nowrap">
          Approved by
        </span>
        <input
          className="h-6 w-40 rounded border border-[#3D3330] bg-[#1A1919] px-2 text-[10px] text-[#FFEDD1] outline-none transition-colors focus:border-[#FFD142]/60 placeholder:text-[#4A3F38]"
          placeholder="—"
          value={approvedBy}
          onChange={(e) => onApprovedByChange?.(e.target.value)}
        />
      </div>
      <div className="flex items-center gap-2">
        <span className="font-mono text-[8.5px] text-[#7A6555] uppercase tracking-wider whitespace-nowrap">
          Submitted by
        </span>
        {submittedByReadOnly ? (
          <span className="text-[10px] text-[#C4A882] font-medium w-40 text-right truncate">
            {submittedBy || "—"}
          </span>
        ) : (
          <input
            className="h-6 w-40 rounded border border-[#3D3330] bg-[#1A1919] px-2 text-[10px] text-[#FFEDD1] outline-none transition-colors focus:border-[#FFD142]/60 placeholder:text-[#4A3F38]"
            placeholder="Your name"
            value={submittedBy}
            onChange={(e) => onSubmittedByChange?.(e.target.value)}
          />
        )}
      </div>
    </div>
  );
}

// ── Order Form ─────────────────────────────────────────────────────────────────
const FORM_GRID =
  "grid grid-cols-[1.75rem_minmax(9rem,1.5fr)_4.5rem_3.5rem_6.5rem_5.5rem_minmax(7rem,1fr)] gap-1.5";

function OrderForm({
  onTotalChange,
  onDeptChange,
  initialData,
  draftInitial,
  incomingSubmitter,
  onSubmit,
  onSaveDraft,
}: {
  onTotalChange: (n: number) => void;
  onDeptChange?: (d: string) => void;
  initialData?: OrderRecord;
  draftInitial?: Draft;
  incomingSubmitter?: string;
  onSubmit?: () => void;
  onSaveDraft?: (d: Draft) => void;
}) {
  const isIncoming = incomingSubmitter !== undefined;

  const [rows, setRows] = useState<FormRow[]>(() => {
    if (draftInitial) {
      const r = [...draftInitial.rows];
      if (!rowHasContent(r[r.length - 1])) return r;
      r.push(mkRow());
      return r;
    }
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
      for (let i = 0; i < 3; i++) filled.push(mkRow());
      return filled;
    }
    return Array.from({ length: INIT_ROWS }, mkRow);
  });
  const [orderName, setOrderName] = useState(
    draftInitial?.name ?? initialData?.name ?? ""
  );
  const [department, setDepartment] = useState(
    draftInitial?.department ?? initialData?.department ?? ""
  );
  const [approvedBy, setApprovedBy] = useState(
    draftInitial?.approvedBy ?? initialData?.approvedBy ?? ""
  );
  const [submittedBy, setSubmittedBy] = useState(
    isIncoming ? (incomingSubmitter ?? "") : (draftInitial?.submittedBy ?? "")
  );
  const [isRecurring, setIsRecurring] = useState(
    draftInitial?.isRecurring ?? initialData?.isRecurring ?? false
  );
  const [draftSaved, setDraftSaved] = useState(false);

  function updateRow(i: number, patch: Partial<FormRow>) {
    const next = rows.map((row, idx) =>
      idx === i ? { ...row, ...patch } : row
    );
    if (i === next.length - 1 && rowHasContent(next[i])) {
      next.push(mkRow());
    }
    setRows(next);
    onTotalChange(rowsTotal(next));
  }

  function handleClear() {
    const empty = Array.from({ length: INIT_ROWS }, mkRow);
    setRows(empty);
    setOrderName("");
    setDepartment("");
    onTotalChange(0);
    onDeptChange?.("");
  }

  const total = rowsTotal(rows);

  return (
    <div className="pb-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <p className="font-mono text-[0.6rem] text-[#F0684D] uppercase tracking-[0.22em]">
            Form PR-25
          </p>
          <h2 className="mt-0.5 text-base font-semibold text-[#FFEDD1] tracking-tight">
            {isIncoming ? "Incoming Order Review" : "Order Requisition Sheet"}
          </h2>
        </div>
        <MetaFields
          approvedBy={approvedBy}
          submittedBy={isIncoming ? (incomingSubmitter ?? "") : submittedBy}
          onApprovedByChange={setApprovedBy}
          onSubmittedByChange={isIncoming ? undefined : setSubmittedBy}
          submittedByReadOnly={isIncoming}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <label className="flex flex-col gap-1">
          <span className="font-mono text-[8.5px] text-[#7A6555] uppercase tracking-widest">
            Order list name
          </span>
          <input
            className={fieldCls}
            placeholder="e.g. September Hardware Batch"
            value={orderName}
            onChange={(e) => setOrderName(e.target.value)}
          />
        </label>
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[8.5px] text-[#7A6555] uppercase tracking-widest">
            Department
          </span>
          <div className="flex items-center gap-2">
            <select
              className={selectCls}
              value={department}
              onChange={(e) => {
                setDepartment(e.target.value);
                onDeptChange?.(e.target.value);
              }}
            >
              <option value="">Select department</option>
              {DEPT_LIST.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            {!isIncoming && (
              <label className="flex items-center gap-1.5 cursor-pointer shrink-0 select-none">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="w-3 h-3 accent-[#8b5cf6] cursor-pointer"
                />
                <span className="text-[10px] text-[#9C8272] whitespace-nowrap">
                  Recurring
                </span>
              </label>
            )}
          </div>
        </div>
      </div>

      {/* Sticky column header */}
      <div
        className={`${FORM_GRID} sticky top-0 z-10 bg-[#232120] border-b border-[#3D3330] pb-1.5 pt-1 mb-0.5 font-mono text-[8px] text-[#7A6555] uppercase tracking-widest`}
      >
        <span>#</span>
        <span>Link / URL</span>
        <span>Price / pc</span>
        <span>Qty</span>
        <span>Type</span>
        <span>Urgency</span>
        <span>Comments</span>
      </div>

      <div className="divide-y divide-[#3D3330]/40 mb-3">
        {rows.map((row, i) => (
          <div
            key={row.id}
            className={i % 5 === 4 ? "border-b border-[#3D3330]/60" : ""}
          >
            <div className={`${FORM_GRID} items-center py-1`}>
              <span className="font-mono text-[#7A6555] text-[9px]">
                {String(i + 1).padStart(2, "0")}
              </span>
              <input
                className={fieldCls}
                placeholder="https://…"
                type="url"
                value={row.link}
                onChange={(e) => updateRow(i, { link: e.target.value })}
              />
              <input
                className={`${fieldCls} text-right font-mono`}
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                inputMode="decimal"
                value={row.pricePerPiece}
                onChange={(e) =>
                  updateRow(i, { pricePerPiece: e.target.value })
                }
              />
              <input
                className={`${fieldCls} text-right font-mono`}
                type="number"
                min="0"
                step="1"
                placeholder="0"
                inputMode="numeric"
                value={row.quantity}
                onChange={(e) => updateRow(i, { quantity: e.target.value })}
              />
              <select
                className={selectCls}
                value={row.orderType}
                onChange={(e) => updateRow(i, { orderType: e.target.value })}
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
                value={row.urgency}
                onChange={(e) => updateRow(i, { urgency: e.target.value })}
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
                value={row.comments}
                onChange={(e) => updateRow(i, { comments: e.target.value })}
              />
            </div>
            {isRecurring && rowHasContent(row) && (
              <div className="flex items-center gap-2 pb-1.5 pl-[calc(1.75rem+0.375rem)]">
                <span className="font-mono text-[8px] text-[#8b5cf6]/60 uppercase tracking-widest shrink-0">
                  Recur:
                </span>
                <input
                  className={`${fieldCls} w-16 font-mono`}
                  type="number"
                  min="1"
                  placeholder="e.g. 2"
                  value={row.recurTime ?? ""}
                  onChange={(e) => updateRow(i, { recurTime: e.target.value })}
                />
                <select
                  className={`${selectCls} w-24`}
                  value={row.recurTimescale ?? "Days"}
                  onChange={(e) =>
                    updateRow(i, { recurTimescale: e.target.value })
                  }
                >
                  <option value="Days">Days</option>
                  <option value="Weeks">Weeks</option>
                  <option value="Months">Months</option>
                </select>
                <input
                  className={`${fieldCls} w-32`}
                  type="date"
                  value={row.recurEndDate ?? ""}
                  onChange={(e) =>
                    updateRow(i, { recurEndDate: e.target.value })
                  }
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Sticky footer */}
      <div className="sticky bottom-0 bg-[#232120] border-t border-[#3D3330] pt-3 pb-1 flex items-center justify-between gap-4">
        <p className="text-[11px] text-[#9C8272]">
          Total:{" "}
          <span className="text-[#FFD142] font-mono font-semibold">
            {fmt(total)}
          </span>
          {isRecurring && (
            <span className="ml-2 text-[10px] text-[#8b5cf6]">recurring</span>
          )}
        </p>
        <div className="flex items-center gap-2">
          {!isIncoming && (
            <button
              onClick={handleClear}
              className="px-3 py-1.5 rounded-lg text-[11px] text-[#9C8272] hover:text-[#FFEDD1] hover:bg-white/5 transition-colors"
            >
              Clear
            </button>
          )}
          {!isIncoming && (
            <button
              onClick={() => {
                const draft: Draft = {
                  id: crypto.randomUUID(),
                  name: orderName,
                  department,
                  rows: rows.filter(rowHasContent),
                  approvedBy,
                  submittedBy,
                  savedAt: new Date().toISOString(),
                  isRecurring,
                };
                onSaveDraft?.(draft);
                setDraftSaved(true);
                setTimeout(() => setDraftSaved(false), 2500);
              }}
              className={`px-3 py-1.5 rounded-lg border text-[11px] transition-colors ${
                draftSaved
                  ? "border-[#10b981]/50 text-[#10b981] bg-[#10b981]/10"
                  : "border-[#3D3330] text-[#9C8272] hover:border-[#4A3F38] hover:text-[#FFEDD1]"
              }`}
            >
              {draftSaved ? "✓ Saved" : "Save draft"}
            </button>
          )}
          <button
            onClick={onSubmit}
            className={`px-5 py-1.5 rounded-lg border text-[11px] font-semibold transition-colors ${
              isRecurring
                ? "border-[#8b5cf6]/40 bg-[#8b5cf6]/10 text-[#8b5cf6] hover:border-[#8b5cf6]/70 hover:bg-[#8b5cf6]/15"
                : "border-[#FFD142]/40 bg-[#FFD142]/10 text-[#FFD142] hover:border-[#FFD142]/70 hover:bg-[#FFD142]/15"
            }`}
          >
            {isIncoming
              ? "Approve order"
              : isRecurring
                ? "Submit recurring"
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
  const [expandedId, setExpandedId] = useState<string | null>(
    orders[0]?.id ?? null
  );

  if (!orders.length)
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[#4A3F38] gap-2">
        <span className="text-3xl">—</span>
        <span className="text-sm">No incoming orders</span>
      </div>
    );

  return (
    <div className="space-y-2 pb-4">
      {orders.map((order) => {
        const isOpen = expandedId === order.id;
        const total = calcTotal(order.items);
        return (
          <div
            key={order.id}
            className={`rounded-xl border transition-colors overflow-hidden ${
              isOpen
                ? "border-[#4A3F38] bg-[#232120]"
                : "border-[#3D3330] bg-[#1A1919]"
            }`}
          >
            {/* Collapsible header */}
            <button
              className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-white/5 transition-colors text-left"
              onClick={() => setExpandedId(isOpen ? null : order.id)}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: STATUS_COLOR[order.status] }}
              />
              <span className="flex-1 text-xs font-medium text-[#FFEDD1] truncate">
                {order.name}
              </span>
              <span className="text-[10px] text-[#9C8272] shrink-0">
                {order.submittedBy}
              </span>
              <span className="text-[11px] font-mono text-[#C4A882] shrink-0">
                {fmt(total)}
              </span>
              <span
                className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
                style={{
                  background: STATUS_COLOR[order.status] + "22",
                  color: STATUS_COLOR[order.status],
                }}
              >
                {STATUS_LABEL[order.status]}
              </span>
              <svg
                className={`w-3 h-3 text-[#7A6555] shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M2 4.5 6 8.5l4-4" />
              </svg>
            </button>

            {/* Expanded form */}
            {isOpen && (
              <div className="border-t border-[#3D3330] px-4 pt-2 overflow-auto max-h-[60vh]">
                <OrderForm
                  key={order.id}
                  onTotalChange={onTotalChange}
                  onDeptChange={onDeptChange}
                  initialData={order}
                  incomingSubmitter={order.submittedBy}
                />
              </div>
            )}
          </div>
        );
      })}
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
    <div className="flex items-center gap-1.5 flex-wrap">
      {item.requiresPhoto && !item.photoUploaded && (
        <button
          onClick={onPhotoUploaded}
          className="px-2 py-1 rounded border border-[#3D3330] text-[9px] text-[#9C8272] hover:border-[#FFD142]/50 hover:text-[#FFD142] transition-colors whitespace-nowrap"
        >
          ↑ Photo
        </button>
      )}
      {item.requiresPhoto && item.photoUploaded && (
        <span className="text-[9px] text-[#10b981]">✓ Photo</span>
      )}
      {item.requiresInvoice && !item.invoiceUploaded && (
        <button
          onClick={onInvoiceUploaded}
          className="px-2 py-1 rounded border border-[#3D3330] text-[9px] text-[#9C8272] hover:border-[#FFD142]/50 hover:text-[#FFD142] transition-colors whitespace-nowrap"
        >
          ↑ Invoice
        </button>
      )}
      {item.requiresInvoice && item.invoiceUploaded && (
        <span className="text-[9px] text-[#10b981]">✓ Invoice</span>
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
      <div className="flex items-center gap-3 mb-4 sticky top-0 z-20 bg-[#232120] pb-3 border-b border-[#3D3330]">
        <button
          onClick={onClose}
          className="text-[10px] text-[#9C8272] hover:text-[#FFEDD1] transition-colors flex items-center gap-1"
        >
          ← Back
        </button>
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: STATUS_COLOR[order.status] }}
          />
          {isPending ? (
            <input
              className="flex-1 h-7 rounded border border-[#3D3330] bg-[#1A1919] px-2 text-sm font-semibold text-[#FFEDD1] outline-none focus:border-[#FFD142]/60"
              value={orderName}
              onChange={(e) => setOrderName(e.target.value)}
            />
          ) : (
            <span className="text-sm font-semibold text-[#FFEDD1] truncate flex-1">
              {orderName}
            </span>
          )}
          <span
            className="text-[9px] font-semibold px-2 py-0.5 rounded-full shrink-0"
            style={{
              background: STATUS_COLOR[order.status] + "22",
              color: STATUS_COLOR[order.status],
            }}
          >
            {STATUS_LABEL[order.status]}
          </span>
        </div>
        <div className="text-sm font-mono font-semibold text-[#FFD142] shrink-0">
          {fmt(total)}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5 text-[10px]">
        <div>
          <span className="font-mono text-[8px] text-[#7A6555] uppercase tracking-wider block mb-1">
            Department
          </span>
          {isPending ? (
            <select
              className={`${selectCls} text-[10px] h-7`}
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
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
          <span className="font-mono text-[8px] text-[#7A6555] uppercase tracking-wider block mb-1">
            Submitted by
          </span>
          <span className="text-[#C4A882]">{order.submittedBy}</span>
        </div>
        <div>
          <span className="font-mono text-[8px] text-[#7A6555] uppercase tracking-wider block mb-1">
            Approved by
          </span>
          <span className="text-[#C4A882]">{order.approvedBy || "—"}</span>
        </div>
      </div>

      {isPending && (
        <div
          className={`${DETAIL_GRID} sticky top-[3.25rem] z-10 bg-[#232120] border-b border-[#3D3330] pb-1.5 pt-1 mb-0.5 font-mono text-[8px] text-[#7A6555] uppercase tracking-widest`}
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

      <div className={isPending ? "divide-y divide-[#3D3330]/40" : "space-y-3"}>
        {items.map((item, idx) =>
          isPending ? (
            <div key={item.id} className="py-2">
              <div className={`${DETAIL_GRID} items-center mb-1.5`}>
                <span className="font-mono text-[#7A6555] text-[9px]">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <input
                  className={fieldCls}
                  type="url"
                  placeholder="https://…"
                  value={item.link}
                  onChange={(e) => updateItem(idx, { link: e.target.value })}
                />
                <input
                  className={`${fieldCls} text-right font-mono`}
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.pricePerPiece}
                  onChange={(e) =>
                    updateItem(idx, {
                      pricePerPiece: parseFloat(e.target.value) || 0,
                    })
                  }
                />
                <input
                  className={`${fieldCls} text-right font-mono`}
                  type="number"
                  min="0"
                  step="1"
                  value={item.quantity}
                  onChange={(e) =>
                    updateItem(idx, { quantity: parseInt(e.target.value) || 0 })
                  }
                />
                <select
                  className={selectCls}
                  value={item.orderType}
                  onChange={(e) =>
                    updateItem(idx, { orderType: e.target.value })
                  }
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
                  value={item.urgency}
                  onChange={(e) => updateItem(idx, { urgency: e.target.value })}
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
                  value={item.comments}
                  onChange={(e) =>
                    updateItem(idx, { comments: e.target.value })
                  }
                />
              </div>
              <div className="flex items-center gap-3 pl-7">
                <span className="text-[9px] font-mono text-[#C4A882]">
                  {fmt(item.pricePerPiece)} × {item.quantity} ={" "}
                  <span className="text-[#FFD142] font-semibold">
                    {fmt(item.pricePerPiece * item.quantity)}
                  </span>
                </span>
                <UploadButtons
                  item={item}
                  onPhotoUploaded={() =>
                    updateItem(idx, { photoUploaded: true })
                  }
                  onInvoiceUploaded={() =>
                    updateItem(idx, { invoiceUploaded: true })
                  }
                />
              </div>
            </div>
          ) : (
            <div
              key={item.id}
              className="p-4 rounded-xl bg-[#1A1919] border border-[#3D3330]"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  <span
                    className="w-2 h-2 rounded-full mt-1 shrink-0"
                    style={{ background: ITEM_STATUS_COLOR[item.status] }}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#FFEDD1]">
                      {item.description}
                    </p>
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] text-[#7A6555] hover:text-[#C4A882] transition-colors underline-offset-2 truncate block"
                    >
                      {item.link}
                    </a>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xl font-semibold font-mono text-[#FFEDD1]">
                    {fmt(item.pricePerPiece * item.quantity)}
                  </p>
                  <p className="text-[10px] text-[#9C8272] font-mono">
                    {fmt(item.pricePerPiece)} × {item.quantity}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                  style={{
                    background: ITEM_STATUS_COLOR[item.status] + "22",
                    color: ITEM_STATUS_COLOR[item.status],
                  }}
                >
                  {item.status}
                </span>
                <span className="text-[9px] text-[#7A6555] bg-[#2A2724] px-1.5 py-0.5 rounded-full">
                  {item.orderType}
                </span>
                <span className="text-[9px] text-[#7A6555]">
                  {item.urgency}
                </span>
                {item.comments && (
                  <span className="text-[9px] text-[#7A6555] italic">
                    "{item.comments}"
                  </span>
                )}
                {uploadsOnly && (
                  <div className="ml-auto">
                    <UploadButtons
                      item={item}
                      onPhotoUploaded={() =>
                        updateItem(idx, { photoUploaded: true })
                      }
                      onInvoiceUploaded={() =>
                        updateItem(idx, { invoiceUploaded: true })
                      }
                    />
                  </div>
                )}
              </div>
            </div>
          )
        )}
      </div>

      {isPending && (
        <div className="sticky bottom-0 bg-[#232120] border-t border-[#3D3330] pt-3 pb-1 mt-3 flex items-center justify-between">
          <p className="text-[11px] text-[#9C8272]">
            Total:{" "}
            <span className="text-[#FFD142] font-mono font-semibold">
              {fmt(total)}
            </span>
          </p>
          <button className="px-5 py-1.5 rounded-lg border border-[#FFD142]/40 bg-[#FFD142]/10 text-[11px] font-semibold text-[#FFD142] hover:border-[#FFD142]/70 transition-colors">
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
  hideHeader,
  onEditOrder,
}: {
  orders: OrderRecord[];
  isPast: boolean;
  hideHeader?: boolean;
  onEditOrder?: (order: OrderRecord) => void;
}) {
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [approvedBy, setApprovedBy] = useState("Liam Bakker");
  const [submittedBy, setSubmittedBy] = useState("Admin user");
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const [openIntervals, setOpenIntervals] = useState<Set<string>>(new Set());

  const regularOrders = orders.filter((o) => !o.isRecurring);
  const recurringOrders = orders.filter(
    (o) => o.isRecurring && !removedIds.has(o.id)
  );

  // Group recurring by interval
  const recurGroups: Record<string, OrderRecord[]> = {};
  for (const o of recurringOrders) {
    const key = o.recurInterval ?? "Unknown";
    if (!recurGroups[key]) recurGroups[key] = [];
    recurGroups[key].push(o);
  }

  const sorted = [...regularOrders].sort((a, b) => {
    const p = (s: OrderStatus) =>
      s === "action_needed" ? 0 : s === "pending" ? 1 : 2;
    return p(a.status) - p(b.status);
  });

  function toggleInterval(key: string) {
    setOpenIntervals((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const orderRow = (order: OrderRecord) => {
    const total = calcTotal(order.items);
    return (
      <button
        key={order.id}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-[#3D3330] bg-[#1A1919] hover:border-[#4A3F38] hover:bg-[#232120] transition-all text-left"
        onClick={() => setSelectedOrder(order)}
      >
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ background: STATUS_COLOR[order.status] }}
        />
        <span className="flex-1 text-xs font-medium text-[#FFEDD1] truncate">
          {order.name}
        </span>
        <span className="text-[10px] text-[#9C8272] shrink-0">
          {order.department}
        </span>
        <span className="text-[11px] font-mono font-semibold text-[#C4A882] shrink-0">
          {fmt(total)}
        </span>
        <span
          className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
          style={{
            background: STATUS_COLOR[order.status] + "22",
            color: STATUS_COLOR[order.status],
          }}
        >
          {STATUS_LABEL[order.status]}
        </span>
        <span className="text-[#7A6555] text-[10px] shrink-0">→</span>
      </button>
    );
  };

  if (selectedOrder)
    return (
      <div>
        <OrderDetailView
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      </div>
    );

  return (
    <div>
      {!hideHeader && (
        <div className="flex items-start justify-between mb-4 sticky top-0 z-10 bg-[#232120] pb-3 border-b border-[#3D3330]">
          <h2 className="text-sm font-semibold text-[#FFEDD1]">
            {isPast ? "Past Orders" : "Current Orders"}
          </h2>
          <MetaFields
            approvedBy={approvedBy}
            submittedBy={submittedBy}
            onApprovedByChange={setApprovedBy}
            onSubmittedByChange={setSubmittedBy}
          />
        </div>
      )}

      {/* Regular orders */}
      <div className="space-y-1.5 mb-4">
        {sorted.map(orderRow)}
        {sorted.length === 0 && recurringOrders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-[#4A3F38] gap-2">
            <span className="text-3xl font-thin">—</span>
            <span className="text-sm">No orders found</span>
          </div>
        )}
      </div>

      {/* Recurring groups */}
      {!isPast && Object.keys(recurGroups).length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[9px] font-semibold text-[#8b5cf6] uppercase tracking-widest">
              Recurring Orders
            </span>
            <div className="flex-1 h-px bg-[#3D3330]" />
          </div>
          {Object.entries(recurGroups).map(([interval, grpOrders]) => {
            const isOpen = openIntervals.has(interval);
            const grpTotal = grpOrders.reduce(
              (s, o) => s + calcTotal(o.items),
              0
            );
            return (
              <div
                key={interval}
                className="rounded-xl border border-[#8b5cf6]/25 overflow-hidden"
              >
                {/* Group header */}
                <button
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 bg-[#8b5cf6]/8 hover:bg-[#8b5cf6]/12 transition-colors text-left"
                  onClick={() => toggleInterval(interval)}
                >
                  <span className="w-2 h-2 rounded-full shrink-0 bg-[#8b5cf6]" />
                  <span className="flex-1 text-xs font-semibold text-[#c4b5fd]">
                    Every {interval}
                  </span>
                  <span className="text-[10px] text-[#9C8272] shrink-0">
                    {grpOrders.length} order{grpOrders.length !== 1 ? "s" : ""}
                  </span>
                  <span className="text-[11px] font-mono text-[#C4A882] shrink-0">
                    {fmt(grpTotal)}
                  </span>
                  <svg
                    className={`w-3 h-3 text-[#8b5cf6] shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    viewBox="0 0 12 12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M2 4.5 6 8.5l4-4" />
                  </svg>
                </button>
                {/* Group orders */}
                {isOpen && (
                  <div className="border-t border-[#8b5cf6]/20 divide-y divide-[#3D3330]/40">
                    {grpOrders.map((order) => {
                      const total = calcTotal(order.items);
                      return (
                        <div
                          key={order.id}
                          className="flex items-center gap-2.5 px-3 py-2.5 bg-[#1A1919]"
                        >
                          <span className="w-2 h-2 rounded-full shrink-0 bg-[#8b5cf6]" />
                          <button
                            className="flex-1 text-left min-w-0"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <span className="text-xs font-medium text-[#FFEDD1] truncate block">
                              {order.name}
                            </span>
                            <span className="text-[9px] text-[#7A6555]">
                              {order.department}
                              {order.recurEndDate
                                ? ` · ends ${order.recurEndDate}`
                                : ""}
                            </span>
                          </button>
                          <span className="text-[11px] font-mono text-[#C4A882] shrink-0">
                            {fmt(total)}
                          </span>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => onEditOrder?.(order)}
                              className="px-2 py-0.5 rounded text-[9px] border border-[#4f6ef7]/40 text-[#4f6ef7] hover:bg-[#4f6ef7]/10 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() =>
                                setRemovedIds(
                                  (prev) => new Set([...prev, order.id])
                                )
                              }
                              className="px-2 py-0.5 rounded text-[9px] border border-[#3D3330] text-[#7A6555] hover:border-[#f43f5e]/40 hover:text-[#f43f5e] hover:bg-[#f43f5e]/8 transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Clicked orders view ────────────────────────────────────────────────────────
function ClickedOrdersView({
  orders,
  onClose,
}: {
  orders: OrderRecord[];
  onClose: () => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3 sticky top-0 z-10 bg-[#232120] pb-2 border-b border-[#3D3330]">
        <h3 className="text-xs font-semibold text-[#FFEDD1]">
          Orders — {orders[0]?.monthLabel}
        </h3>
        <button
          onClick={onClose}
          className="text-[10px] text-[#7A6555] hover:text-[#F0684D] transition-colors"
        >
          ✕ Close
        </button>
      </div>
      <div className="space-y-2">
        {orders.map((o) => (
          <div
            key={o.id}
            className="p-3 rounded-xl border border-[#3D3330] bg-[#2A2724]"
          >
            <div className="flex items-center gap-2 mb-1">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: STATUS_COLOR[o.status] }}
              />
              <span className="flex-1 text-xs font-medium text-[#FFEDD1] truncate">
                {o.name}
              </span>
              <span className="text-xs font-mono font-semibold text-[#FFD142] shrink-0">
                {fmt(calcTotal(o.items))}
              </span>
            </div>
            <p className="text-[10px] text-[#7A6555]">
              {o.department} · {o.submittedBy} · {STATUS_LABEL[o.status]}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Drafts list ────────────────────────────────────────────────────────────────
function DraftsList({
  drafts,
  onLoad,
  onDelete,
}: {
  drafts: Draft[];
  onLoad: (d: Draft) => void;
  onDelete: (id: string) => void;
}) {
  if (!drafts.length)
    return (
      <div className="flex flex-col items-center justify-center py-16 text-[#4A3F38] gap-2">
        <span className="text-3xl font-thin">—</span>
        <span className="text-sm">No saved drafts</span>
      </div>
    );
  return (
    <div className="space-y-1.5 pb-4">
      {drafts.map((d) => {
        const total = rowsTotal(d.rows);
        const saved = new Date(d.savedAt);
        const timeStr =
          saved.toLocaleDateString("nl-NL", {
            day: "numeric",
            month: "short",
          }) +
          " " +
          saved.toLocaleTimeString("nl-NL", {
            hour: "2-digit",
            minute: "2-digit",
          });
        return (
          <div
            key={d.id}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-[#3D3330] bg-[#1A1919]"
          >
            <div className="flex-1 min-w-0">
              <span className="text-xs font-medium text-[#FFEDD1] truncate block">
                {d.name || (
                  <span className="italic text-[#7A6555]">Untitled draft</span>
                )}
              </span>
              <span className="text-[9px] text-[#7A6555]">
                {d.department || "No dept"} · {fmt(total)} · {timeStr}
              </span>
            </div>
            <button
              onClick={() => onLoad(d)}
              className="px-2.5 py-1 rounded border border-[#3D3330] text-[9px] text-[#9C8272] hover:border-[#FFD142]/50 hover:text-[#FFD142] transition-colors whitespace-nowrap"
            >
              Open in Submit
            </button>
            <button
              onClick={() => onDelete(d.id)}
              className="text-[#7A6555] hover:text-[#F0684D] transition-colors text-[11px] px-1"
            >
              ✕
            </button>
          </div>
        );
      })}
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
  const [searchQuery, setSearchQuery] = useState("");
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [overviewSubTab, setOverviewSubTab] = useState<"orders" | "drafts">(
    "orders"
  );
  const [overviewSearch, setOverviewSearch] = useState("");
  const [loadedDraft, setLoadedDraft] = useState<Draft | null>(null);
  const [submitKey, setSubmitKey] = useState(0);

  const allPastOrders = MOCK_ORDERS.filter((o) => o.isPast);
  const currentOrders = MOCK_ORDERS.filter((o) => !o.isPast);
  const incomingOrders = currentOrders.filter(
    (o) => o.status === "pending" && o.submittedBy !== "Admin user"
  );

  // Filtered past orders for search
  const filteredPastOrders = allPastOrders.filter((o) =>
    matchesSearch(o, searchQuery)
  );

  const showOrderOverlay = tab === "submit" || tab === "incoming";

  // Pending amounts
  const pendingByMonth: Record<string, number> = {};
  MOCK_ORDERS.filter((o) => o.status === "pending").forEach((o) => {
    pendingByMonth[o.monthLabel] =
      (pendingByMonth[o.monthLabel] ?? 0) + calcTotal(o.items);
  });
  if (tab === "submit" && formTotal > 0)
    pendingByMonth["Sep"] = (pendingByMonth["Sep"] ?? 0) + formTotal;

  const recurringByMonth: Record<string, number> = {};
  MOCK_ORDERS.filter(
    (o) => o.isRecurring && o.recurEnabled && !o.recurPaused
  ).forEach((o) => {
    recurringByMonth[o.monthLabel] =
      (recurringByMonth[o.monthLabel] ?? 0) + calcTotal(o.items);
  });

  const activeRecurTotal = MOCK_ORDERS.filter(
    (o) => o.isRecurring && o.recurEnabled && !o.recurPaused
  ).reduce((s, o) => s + calcTotal(o.items), 0);

  // ordersForMonth filtered by search (for chart tooltips in past tab)
  function filteredOrdersForMonth(month: string): OrderRecord[] {
    return filteredPastOrders.filter((o) => o.monthLabel === month);
  }

  function handlePointClick(month: string) {
    const orders = filteredOrdersForMonth(month);
    if (orders.length > 0) setClickedOrders(orders);
  }

  function handleSaveDraft(draft: Draft) {
    setDrafts((prev) => [draft, ...prev]);
  }

  function handleLoadDraft(draft: Draft) {
    setLoadedDraft(draft);
    setSubmitKey((k) => k + 1);
    setTab("submit");
    setFormTotal(rowsTotal(draft.rows));
  }

  function handleDeleteDraft(id: string) {
    setDrafts((prev) => prev.filter((d) => d.id !== id));
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: "submit", label: "Submit" },
    { id: "overview", label: "Overview" },
    { id: "incoming", label: "Incoming" },
    { id: "past", label: "Past Orders" },
  ];

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-3">
      {/* Budget Bar */}
      <BudgetBar
        data={data}
        orderAmount={showOrderOverlay ? formTotal : 0}
        recurringAmount={activeRecurTotal}
        showOrder={showOrderOverlay}
      />

      {/* Tab Buttons */}
      <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setTab(t.id);
              setClickedOrders(null);
              setSearchQuery("");
            }}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all border ${
              tab === t.id
                ? "bg-[#2A2724] text-[#FFEDD1] border-[#4A3F38]"
                : "text-[#9C8272] hover:text-[#FFEDD1] hover:bg-white/5 border-transparent"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Chart — only in Past Orders tab */}
      {tab === "past" && (
        <div className="shrink-0 rounded-2xl border border-[#3D3330] bg-[#232120] px-4 pt-3 pb-3">
          <SpendingChart
            name="Total"
            color="#F0684D"
            pendingByMonth={pendingByMonth}
            recurringByMonth={recurringByMonth}
            onPointClick={handlePointClick}
            filteredOrdersForMonth={filteredOrdersForMonth}
            title="Team Expenses"
            period={chartPeriod}
            onPeriodChange={setChartPeriod}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>
      )}

      {/* Content Panel */}
      <div className="flex-1 min-h-0 rounded-2xl border border-[#3D3330] bg-[#232120] px-4 pt-4 overflow-auto">
        {clickedOrders ? (
          <ClickedOrdersView
            orders={clickedOrders}
            onClose={() => setClickedOrders(null)}
          />
        ) : (
          <>
            {tab === "submit" && (
              <OrderForm
                key={submitKey}
                onTotalChange={setFormTotal}
                onDeptChange={setFormDept}
                draftInitial={loadedDraft ?? undefined}
                onSaveDraft={handleSaveDraft}
              />
            )}
            {tab === "overview" && (
              <div>
                {/* Sub-tabs + search */}
                <div className="flex items-center gap-2 mb-4 sticky top-0 z-10 bg-[#232120] pb-3 border-b border-[#3D3330]">
                  <div className="flex items-center gap-1">
                    {(["orders", "drafts"] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => setOverviewSubTab(st)}
                        className={`px-3 py-1 rounded-md text-[11px] font-medium transition-colors ${
                          overviewSubTab === st
                            ? "bg-[#2A2724] text-[#FFEDD1]"
                            : "text-[#9C8272] hover:text-[#FFEDD1] hover:bg-white/5"
                        }`}
                      >
                        {st === "orders"
                          ? "Orders"
                          : `Drafts${drafts.length ? ` (${drafts.length})` : ""}`}
                      </button>
                    ))}
                  </div>
                  <div className="flex-1" />
                  {overviewSubTab === "orders" && (
                    <div className="relative">
                      <svg
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#7A6555]"
                        viewBox="0 0 12 12"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <circle cx="5" cy="5" r="3.5" />
                        <path d="M8 8l2.5 2.5" />
                      </svg>
                      <input
                        className="pl-6 pr-3 py-1 rounded-lg bg-[#1A1919] border border-[#3D3330] text-[11px] text-[#FFEDD1] placeholder-[#4A3F38] focus:outline-none focus:border-[#4A3F38] w-36 transition-colors"
                        placeholder="Search orders…"
                        value={overviewSearch}
                        onChange={(e) => setOverviewSearch(e.target.value)}
                      />
                    </div>
                  )}
                </div>
                {overviewSubTab === "orders" ? (
                  <OrderOverviewList
                    orders={currentOrders.filter((o) =>
                      matchesSearch(o, overviewSearch)
                    )}
                    isPast={false}
                    hideHeader
                    onEditOrder={(order) => {
                      setLoadedDraft({
                        id: order.id,
                        name: order.name,
                        department: order.department,
                        rows: order.items.map((item) => ({
                          id: item.id,
                          link: item.link,
                          pricePerPiece: String(item.pricePerPiece),
                          quantity: String(item.quantity),
                          orderType: item.orderType,
                          urgency: item.urgency,
                          comments: item.comments,
                        })),
                        approvedBy: order.approvedBy,
                        submittedBy: order.submittedBy,
                        savedAt: new Date().toISOString(),
                        isRecurring: order.isRecurring,
                      });
                      setSubmitKey((k) => k + 1);
                      setTab("submit");
                    }}
                  />
                ) : (
                  <DraftsList
                    drafts={drafts}
                    onLoad={handleLoadDraft}
                    onDelete={handleDeleteDraft}
                  />
                )}
              </div>
            )}
            {tab === "incoming" && (
              <IncomingPanel
                orders={incomingOrders}
                onTotalChange={setFormTotal}
                onDeptChange={setFormDept}
              />
            )}
            {tab === "past" && (
              <OrderOverviewList orders={filteredPastOrders} isPast />
            )}
          </>
        )}
      </div>
    </div>
  );
}
