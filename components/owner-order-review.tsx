"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface OrderItem {
  id: string;
  orderName: string;
  department: string;
  description: string;
  amount: number;
  pricePerPiece: string;
  totalCosts: string;
  comments: string;
}

export function OwnerOrderReview({ items }: { items: OrderItem[] }) {
  const [reviewItems, setReviewItems] = useState(items);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  function updateItem(id: string, patch: Partial<OrderItem>) {
    setReviewItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  }

  async function saveItem(item: OrderItem) {
    setUpdatingId(item.id);
    try {
      const response = await fetch(`/api/order-requests/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderName: item.orderName,
          description: item.description,
          pricePerPiece: Number(item.pricePerPiece),
          amount: item.amount,
          comments: item.comments,
        }),
      });
      const data = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        throw new Error(data?.error || "Unable to update order item.");
      }

      toast.success("Order item updated.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to update order item."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function reviewItem(id: string, status: "pending" | "declined") {
    setUpdatingId(id);

    try {
      const response = await fetch(`/api/order-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        throw new Error(data?.error || "Unable to review order item.");
      }

      setReviewItems((current) => current.filter((item) => item.id !== id));
      toast.success(
        status === "pending"
          ? "Order item approved and sent to admin."
          : "Order item declined."
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to review order item."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  if (reviewItems.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No order items await review.
      </p>
    );
  }

  return (
    <div className="grid gap-3">
      {reviewItems.map((item) => (
        <article className="rounded-lg border bg-card p-4" key={item.id}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <input
                className="w-full bg-transparent font-medium outline-none"
                onChange={(event) =>
                  updateItem(item.id, { orderName: event.target.value })
                }
                value={item.orderName}
              />
              <p className="text-muted-foreground text-sm">{item.department}</p>
            </div>
            <p className="font-medium">EUR {item.totalCosts}</p>
          </div>
          <input
            className="mt-3 w-full rounded-md border bg-background px-2 py-1 text-sm"
            onChange={(event) =>
              updateItem(item.id, { description: event.target.value })
            }
            value={item.description}
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <input
              className="w-28 rounded-md border bg-background px-2 py-1 text-sm"
              min="0.01"
              onChange={(event) =>
                updateItem(item.id, { pricePerPiece: event.target.value })
              }
              step="0.01"
              type="number"
              value={item.pricePerPiece}
            />
            <input
              className="w-20 rounded-md border bg-background px-2 py-1 text-sm"
              min="1"
              onChange={(event) =>
                updateItem(item.id, { amount: Number(event.target.value) })
              }
              type="number"
              value={item.amount}
            />
          </div>
          <input
            className="mt-2 w-full rounded-md border bg-background px-2 py-1 text-sm"
            onChange={(event) =>
              updateItem(item.id, { comments: event.target.value })
            }
            placeholder="Comments"
            value={item.comments}
          />
          <div className="mt-4 flex gap-2">
            <Button
              disabled={updatingId === item.id}
              onClick={() => saveItem(item)}
              size="sm"
              type="button"
              variant="outline"
            >
              Save edits
            </Button>
            <Button
              disabled={updatingId === item.id}
              onClick={() => reviewItem(item.id, "pending")}
              size="sm"
              type="button"
            >
              Approve
            </Button>
            <Button
              disabled={updatingId === item.id}
              onClick={() => reviewItem(item.id, "declined")}
              size="sm"
              type="button"
              variant="destructive"
            >
              Deny
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
}
