"use client";

import { Check, ExternalLink, Search, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type OrderStatus = "owner_review" | "accepted" | "declined" | "pending";

interface OrderItem {
  id: string;
  orderName: string;
  department: string;
  description: string;
  amount: number;
  pricePerPiece: string;
  totalCosts: string;
  typeOfOrder: string;
  urgency: string;
  comments: string;
  status: OrderStatus;
  ordered: boolean;
  photoNeeded: boolean;
  photoUploaded: boolean;
  delivered: boolean;
  createdAt: string;
}

const statusStyles: Record<OrderStatus, string> = {
  owner_review: "border-[#FFD142]/30 bg-[#FFD142]/10 text-[#FFD142]",
  pending: "border-[#60a5fa]/30 bg-[#60a5fa]/10 text-[#93c5fd]",
  accepted: "border-[#10b981]/30 bg-[#10b981]/10 text-[#6ee7b7]",
  declined: "border-[#F0684D]/30 bg-[#F0684D]/10 text-[#fca5a5]",
};

const statusLabel: Record<OrderStatus, string> = {
  owner_review: "Needs review",
  pending: "Pending admin",
  accepted: "Accepted",
  declined: "Declined",
};

export function OwnerOrdersWorkspace({
  items: initialItems,
  slug,
}: {
  items: OrderItem[];
  slug: string;
}) {
  const [items, setItems] = useState(initialItems);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | OrderStatus>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesFilter = filter === "all" || item.status === filter;
      const matchesQuery =
        !normalizedQuery ||
        [item.orderName, item.department, item.description, item.typeOfOrder]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      return matchesFilter && matchesQuery;
    });
  }, [filter, items, query]);

  const reviewCount = items.filter(
    (item) => item.status === "owner_review"
  ).length;
  const totalPending = items
    .filter((item) => item.status !== "declined")
    .reduce((sum, item) => sum + Number(item.totalCosts), 0);

  async function updateReview(id: string, status: "pending" | "declined") {
    setUpdatingId(id);
    try {
      const response = await fetch(`/api/order-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to update order item.");
      }
      setItems((current) =>
        current.map((item) => (item.id === id ? { ...item, status } : item))
      );
      toast.success(
        status === "pending" ? "Order sent to admin." : "Order declined."
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to update order item."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#1A1919] px-4 py-5 text-[#FFEDD1] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-4 border-[#FFEDD1]/10 border-b pb-5">
          <div>
            <p className="font-mono text-[#F0684D] text-[10px] uppercase tracking-[0.2em]">
              Organization workspace
            </p>
            <h1 className="mt-1 font-semibold text-2xl">Manage orders</h1>
          </div>
          <Link
            aria-label="Back to dashboard"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-[#9C8272] transition-colors hover:border-white/20 hover:text-[#FFEDD1]"
            href={`/dashboard/organization/${slug}`}
          >
            <X className="size-4" />
          </Link>
        </header>

        <section className="mb-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-[#3D3330] bg-[#232120] p-4">
            <p className="text-[#9C8272] text-xs">Awaiting your review</p>
            <p className="mt-1 font-semibold text-2xl text-[#FFD142]">
              {reviewCount}
            </p>
          </div>
          <div className="rounded-lg border border-[#3D3330] bg-[#232120] p-4">
            <p className="text-[#9C8272] text-xs">Order lines</p>
            <p className="mt-1 font-semibold text-2xl">{items.length}</p>
          </div>
          <div className="rounded-lg border border-[#3D3330] bg-[#232120] p-4">
            <p className="text-[#9C8272] text-xs">Active order value</p>
            <p className="mt-1 font-semibold text-2xl">
              EUR {totalPending.toFixed(2)}
            </p>
          </div>
        </section>

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="relative block max-w-md flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#7A6555]" />
            <input
              className="h-10 w-full rounded-lg border border-[#3D3330] bg-[#232120] pr-3 pl-9 text-sm outline-none placeholder:text-[#7A6555] focus:border-[#FFD142]/60"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search orders, departments, or types"
              value={query}
            />
          </label>
          <div className="flex overflow-x-auto rounded-lg border border-[#3D3330] bg-[#232120] p-1">
            {(
              [
                "all",
                "owner_review",
                "pending",
                "accepted",
                "declined",
              ] as const
            ).map((status) => (
              <button
                className={`shrink-0 rounded-md px-3 py-1.5 text-xs transition-colors ${filter === status ? "bg-[#F0684D] text-white" : "text-[#9C8272] hover:text-[#FFEDD1]"}`}
                key={status}
                onClick={() => setFilter(status)}
                type="button"
              >
                {status === "all" ? "All orders" : statusLabel[status]}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-[#3D3330] bg-[#232120]">
          <div className="hidden grid-cols-[minmax(13rem,1.5fr)_8rem_7rem_7rem_8rem_9rem] gap-4 border-[#3D3330] border-b px-5 py-3 font-mono text-[#7A6555] text-[10px] uppercase tracking-wider md:grid">
            <span>Order</span>
            <span>Department</span>
            <span>Amount</span>
            <span>Urgency</span>
            <span>Status</span>
            <span>Actions</span>
          </div>
          {filteredItems.map((item) => (
            <article
              className="grid gap-3 border-[#3D3330] border-b px-4 py-4 last:border-b-0 md:grid-cols-[minmax(13rem,1.5fr)_8rem_7rem_7rem_8rem_9rem] md:items-center md:gap-4 md:px-5"
              key={item.id}
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-sm">{item.orderName}</p>
                <a
                  className="mt-1 flex max-w-fit items-center gap-1 truncate text-[#9C8272] text-xs hover:text-[#FFD142]"
                  href={item.description}
                  rel="noreferrer"
                  target="_blank"
                >
                  View item <ExternalLink className="size-3" />
                </a>
              </div>
              <p className="text-[#C4A882] text-xs">{item.department}</p>
              <p className="font-mono text-sm">EUR {item.totalCosts}</p>
              <p className="text-[#C4A882] text-xs">{item.urgency}</p>
              <span
                className={`w-fit rounded-full border px-2 py-1 font-semibold text-[10px] ${statusStyles[item.status]}`}
              >
                {statusLabel[item.status]}
              </span>
              <div className="flex gap-2">
                {item.status === "owner_review" ? (
                  <>
                    <button
                      aria-label="Approve order"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#10b981]/40 text-[#6ee7b7] transition-colors hover:bg-[#10b981]/15 disabled:opacity-50"
                      disabled={updatingId === item.id}
                      onClick={() => updateReview(item.id, "pending")}
                      type="button"
                    >
                      <Check className="size-4" />
                    </button>
                    <button
                      aria-label="Decline order"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#F0684D]/40 text-[#fca5a5] transition-colors hover:bg-[#F0684D]/15 disabled:opacity-50"
                      disabled={updatingId === item.id}
                      onClick={() => updateReview(item.id, "declined")}
                      type="button"
                    >
                      <X className="size-4" />
                    </button>
                  </>
                ) : (
                  <span className="text-[#7A6555] text-xs">No action</span>
                )}
              </div>
            </article>
          ))}
          {filteredItems.length === 0 && (
            <p className="px-5 py-14 text-center text-[#7A6555] text-sm">
              No orders match this view.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
