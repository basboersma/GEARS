import type { orderRequest } from "@/db/schema";

type TreasurerOrderItem = Pick<
  typeof orderRequest.$inferSelect,
  | "id"
  | "orderName"
  | "description"
  | "typeOfOrder"
  | "urgency"
  | "status"
  | "ordered"
  | "totalCosts"
>;

const urgencyWeight: Record<string, number> = {
  "1 day": 0,
  "2 days": 1,
  "3 days": 2,
  "7 days": 3,
};

const typeColors: Record<string, string> = {
  Hardware: "#FFD142",
  Electronic: "#F0684D",
  Software: "#7CA4FF",
  Social: "#66CDAA",
};

function toDoSort(left: TreasurerOrderItem, right: TreasurerOrderItem) {
  const leftWeight = urgencyWeight[left.urgency] ?? Number.MAX_SAFE_INTEGER;
  const rightWeight = urgencyWeight[right.urgency] ?? Number.MAX_SAFE_INTEGER;

  return (
    leftWeight - rightWeight ||
    left.description.localeCompare(right.description)
  );
}

export function TreasurerOverview({
  items,
  showTodo,
}: {
  items: TreasurerOrderItem[];
  showTodo: boolean;
}) {
  const pendingItems = items
    .filter((item) => item.status === "pending")
    .sort(toDoSort);

  const typeCounts = items.reduce<Record<string, number>>((acc, item) => {
    const key = item.typeOfOrder;
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const chartEntries = Object.entries(typeCounts);
  const total = chartEntries.reduce((sum, [, count]) => sum + count, 0);

  let offset = 0;
  const segments = chartEntries.map(([type, count]) => {
    const size = total > 0 ? (count / total) * 100 : 0;
    const start = offset;
    const end = offset + size;
    offset = end;
    return {
      type,
      count,
      color: typeColors[type] ?? "#C9C9C9",
      start,
      end,
    };
  });

  const conicGradient =
    segments.length === 0
      ? "conic-gradient(#3b3b3b 0% 100%)"
      : `conic-gradient(${segments
          .map(
            (segment) => `${segment.color} ${segment.start}% ${segment.end}%`
          )
          .join(",")})`;

  return (
    <div className="mb-4 grid gap-4 lg:grid-cols-3">
      <div className="rounded-xl border border-border/70 bg-muted/30 p-4">
        <p className="font-medium text-sm">Order Totals</p>
        <p className="mt-1 text-muted-foreground text-xs">
          {total} ordered items in this organization
        </p>
      </div>

      <div className="rounded-xl border border-border/70 bg-muted/30 p-4">
        <p className="text-center font-medium text-sm">Orders by Type</p>
        <div className="mt-3 flex justify-center">
          <div
            className="size-36 rounded-full border border-border"
            style={{ background: conicGradient }}
          />
        </div>
        <div className="mt-3 grid gap-1">
          {segments.map((segment) => (
            <p className="text-xs" key={segment.type}>
              <span
                className="mr-2 inline-block size-2 rounded-full"
                style={{ backgroundColor: segment.color }}
              />
              {segment.type}: {segment.count}
            </p>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border/70 bg-muted/30 p-4">
        <p className="font-medium text-sm">Admin To-Do</p>
        {showTodo ? null : (
          <p className="mt-2 text-muted-foreground text-xs">
            Visible for admins in Treasurer.
          </p>
        )}

        {showTodo && pendingItems.length === 0 ? (
          <p className="mt-2 text-muted-foreground text-xs">
            No pending items.
          </p>
        ) : null}

        {showTodo && pendingItems.length > 0 ? (
          <div className="mt-2 flex max-h-40 flex-col gap-2 overflow-y-auto pr-1">
            {pendingItems.map((item) => (
              <details
                className="rounded-lg border border-border/70 p-2"
                key={item.id}
              >
                <summary className="cursor-pointer list-none text-sm">
                  {item.description}
                </summary>
                <p className="mt-1 text-muted-foreground text-xs">
                  {item.orderName} · {item.typeOfOrder} · {item.urgency} · €
                  {item.totalCosts}
                </p>
              </details>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
