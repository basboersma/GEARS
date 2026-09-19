// ─── Date utilities ───────────────────────────────────────────────────────────
export const addDays = (d: Date, n: number): Date => {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
};

export const getMonday = (d: Date): Date => {
  const r = new Date(d);
  const day = r.getDay();
  r.setDate(r.getDate() - (day === 0 ? 6 : day - 1));
  r.setHours(0, 0, 0, 0);
  return r;
};

export const formatDate = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const parseDate = (s: string): Date => {
  const [y, m, day] = s.split("-").map(Number);
  return new Date(y, m - 1, day);
};

export const isSameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export const diffDays = (a: string, b: string): number =>
  Math.round((parseDate(b).getTime() - parseDate(a).getTime()) / 86_400_000);

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const DAY_SHORT = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
export const DAY_FULL = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// ─── Calendar layout ──────────────────────────────────────────────────────────
export const HOURS = Array.from({ length: 14 }, (_, i) => i + 7);
export const HOUR_H = 56;
export const HEADER_H = 32;
export const TIME_COL_W = 44;

// ─── Avatar helpers ───────────────────────────────────────────────────────────
export const AVATAR_BG = [
  "bg-blue-500",
  "bg-purple-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-indigo-500",
];

export const avatarBg = (i: number) =>
  AVATAR_BG[((i % AVATAR_BG.length) + AVATAR_BG.length) % AVATAR_BG.length];
