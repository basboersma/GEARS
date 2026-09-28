export type RecurrenceUnit = "Days" | "Weeks" | "Months";

function advanceDate(
  value: Date,
  quantity: number,
  unit: RecurrenceUnit
): Date {
  const next = new Date(value);
  if (unit === "Days") {
    next.setUTCDate(next.getUTCDate() + quantity);
    return next;
  }
  if (unit === "Weeks") {
    next.setUTCDate(next.getUTCDate() + quantity * 7);
    return next;
  }

  const day = next.getUTCDate();
  next.setUTCDate(1);
  next.setUTCMonth(next.getUTCMonth() + quantity);
  const lastDay = new Date(
    Date.UTC(next.getUTCFullYear(), next.getUTCMonth() + 1, 0)
  ).getUTCDate();
  next.setUTCDate(Math.min(day, lastDay));
  return next;
}

export function getRecurringOccurrenceDates({
  startDate,
  endDate,
  quantity,
  unit,
}: {
  startDate: Date;
  endDate: Date | null;
  quantity?: number | null;
  unit?: string | null;
}): Date[] {
  if (
    !(endDate && quantity) ||
    quantity < 1 ||
    !["Days", "Weeks", "Months"].includes(unit ?? "")
  ) {
    return [new Date(startDate)];
  }

  const dates: Date[] = [];
  let current = new Date(startDate);
  const inclusiveEnd = new Date(endDate);
  inclusiveEnd.setUTCHours(23, 59, 59, 999);
  const maximumOccurrences = 1000;
  while (current <= inclusiveEnd && dates.length < maximumOccurrences) {
    dates.push(new Date(current));
    current = advanceDate(current, quantity, unit as RecurrenceUnit);
  }
  return dates.length > 0 ? dates : [new Date(startDate)];
}
