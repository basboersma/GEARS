"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export const ORDER_TYPES = [
  "Hardware",
  "Electronic",
  "Software",
  "Social",
] as const;

export const URGENCIES = [
  { value: "1 day", label: "1 day" },
  { value: "2 days", label: "2 days" },
  { value: "3 days", label: "3 days" },
  { value: "7 days", label: "7 days" },
] as const;

const ROW_COUNT = 25;
const CONTACT_EMAIL = "orders@company.com";

interface Row {
  id: string;
  description: string;
  pricePerPiece: string;
  quantity: string;
  orderType: string;
  urgency: string;
  comments: string;
}

const createEmptyRow = (): Row => ({
  id: crypto.randomUUID(),
  description: "",
  pricePerPiece: "",
  quantity: "",
  orderType: "",
  urgency: "",
  comments: "",
});

const GRID =
  "grid grid-cols-[2.25rem_minmax(11rem,1.5fr)_5.5rem_4.5rem_8rem_6.5rem_minmax(9rem,1fr)] gap-2";
const URL_PATTERN = /^https?:\/\//i;

const fieldClass =
  "h-9 w-full rounded-md border border-input bg-card/70 px-2.5 text-sm text-card-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-ring focus:bg-card focus:ring-2 focus:ring-ring/25";

const selectClass = `${fieldClass} cursor-pointer appearance-none bg-[url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%23a8a4a0' stroke-width='1.5'%3E%3Cpath d='M4 6.5 8 10.5l4-4'/%3E%3C/svg%3E")] bg-[length:14px_14px] bg-[position:right_0.5rem_center] bg-no-repeat pr-7`;

export function OrderSheet({
  organizationId,
  departments,
}: {
  organizationId: string;
  departments: Array<{ id: string; name: string }>;
}) {
  const [rows, setRows] = useState<Row[]>(() =>
    Array.from({ length: ROW_COUNT }, () => createEmptyRow())
  );
  const [orderName, setOrderName] = useState<string>("");
  const [department, setDepartment] = useState<string>("");
  const [submitted, setSubmitted] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateRow(index: number, patch: Partial<Row>) {
    setSubmitted(null);
    setRows((current) =>
      current.map((row, i) => (i === index ? { ...row, ...patch } : row))
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!orderName.trim()) {
      toast.error("Add an order list name before submitting");
      return;
    }

    if (!department) {
      toast.error("Select a department before submitting");
      return;
    }

    const filled = rows.filter((row) => row.description.trim() !== "");

    if (filled.length === 0) {
      setSubmitted(0);
      toast.error("No lines filled in");
      return;
    }

    const hasInvalid = filled.some(
      (row) =>
        row.description === "" ||
        row.description.trim() === "" ||
        !URL_PATTERN.test(row.description.trim()) ||
        row.pricePerPiece === "" ||
        row.quantity === "" ||
        row.orderType === "" ||
        row.urgency === ""
    );

    if (hasInvalid) {
      toast.error("Complete all required fields for every filled line");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/order-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organizationId,
          orderName,
          department,
          rows: filled.map((row) => ({
            description: row.description,
            pricePerPiece: row.pricePerPiece,
            quantity: row.quantity,
            orderType: row.orderType,
            urgency: row.urgency,
            comments: row.comments,
          })),
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error ?? "Failed to submit order sheet");
      }

      setSubmitted(filled.length);
      toast.success("Order sheet submitted successfully");
      handleReset();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleReset() {
    setRows(Array.from({ length: ROW_COUNT }, () => createEmptyRow()));
    setOrderName("");
    setDepartment("");
    setSubmitted(null);
  }

  return (
    <form
      className="rounded-xl border-[#FFD142] border-[0.5px] bg-card shadow-2xl shadow-black/40"
      onSubmit={handleSubmit}
    >
      <header className="border-[#FFD142] border-b-[0.5px] px-6 py-5">
        <p className="font-mono text-[0.7rem] text-primary uppercase tracking-[0.22em]">
          Form PR-25
        </p>
        <h1 className="mt-1 text-pretty font-semibold text-2xl text-card-foreground tracking-tight">
          Order Requisition Sheet
        </h1>
      </header>

      <div className="border-[#FFD142] border-b-[0.5px] px-6 py-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="flex w-full flex-col gap-1.5">
            <span className="font-mono text-[0.7rem] text-muted-foreground uppercase tracking-[0.14em]">
              Order list name
            </span>
            <input
              className={fieldClass}
              onChange={(event) => setOrderName(event.target.value)}
              placeholder="Example: September Hardware Batch"
              value={orderName}
            />
          </label>

          <label className="flex w-full flex-col gap-1.5">
            <span className="font-mono text-[0.7rem] text-muted-foreground uppercase tracking-[0.14em]">
              Department
            </span>
            <select
              className={selectClass}
              onChange={(event) => setDepartment(event.target.value)}
              value={department}
            >
              <option value="">Select department</option>
              {departments.length > 0 ? (
                departments.map((departmentEntry) => (
                  <option key={departmentEntry.id} value={departmentEntry.name}>
                    {departmentEntry.name}
                  </option>
                ))
              ) : (
                <option value="">No departments configured yet</option>
              )}
            </select>
          </label>
        </div>
      </div>

      <div className="overflow-x-auto px-6 py-5">
        <div className="min-w-[62rem]">
          <div
            className={`${GRID} border-[#FFD142] border-b pb-2 font-mono text-[0.7rem] text-muted-foreground uppercase tracking-[0.12em]`}
          >
            <span>#</span>
            <span>Link</span>
            <span>Price / pc</span>
            <span>Qty</span>
            <span>Type of order</span>
            <span>Urgency</span>
            <span>Comments</span>
          </div>

          <div className="divide-y divide-border/60">
            {rows.map((row, index) => (
              <div
                className={`${GRID} items-center py-1.5 ${
                  index % 5 === 4 ? "border-b-border" : ""
                }`}
                key={row.id}
              >
                <span className="font-mono text-muted-foreground text-xs">
                  {String(index + 1).padStart(2, "0")}
                </span>

                <input
                  aria-label={`Link, line ${index + 1}`}
                  className={fieldClass}
                  onChange={(event) =>
                    updateRow(index, { description: event.target.value })
                  }
                  placeholder="https://example.com"
                  type="url"
                  value={row.description}
                />

                <input
                  aria-label={`Price per piece, line ${index + 1}`}
                  className={`${fieldClass} text-right font-mono`}
                  inputMode="decimal"
                  min="0"
                  onChange={(event) =>
                    updateRow(index, { pricePerPiece: event.target.value })
                  }
                  placeholder="0.00"
                  step="0.01"
                  type="number"
                  value={row.pricePerPiece}
                />

                <input
                  aria-label={`Quantity, line ${index + 1}`}
                  className={`${fieldClass} text-right font-mono`}
                  inputMode="numeric"
                  min="0"
                  onChange={(event) =>
                    updateRow(index, { quantity: event.target.value })
                  }
                  placeholder="0"
                  step="1"
                  type="number"
                  value={row.quantity}
                />

                <select
                  aria-label={`Type of order, line ${index + 1}`}
                  className={selectClass}
                  onChange={(event) =>
                    updateRow(index, { orderType: event.target.value })
                  }
                  value={row.orderType}
                >
                  <option value="">-</option>
                  {ORDER_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>

                <select
                  aria-label={`Urgency, line ${index + 1}`}
                  className={selectClass}
                  onChange={(event) =>
                    updateRow(index, { urgency: event.target.value })
                  }
                  value={row.urgency}
                >
                  <option value="">-</option>
                  {URGENCIES.map((urgency) => (
                    <option key={urgency.value} value={urgency.value}>
                      {urgency.label}
                    </option>
                  ))}
                </select>

                <input
                  aria-label={`Comments, line ${index + 1}`}
                  className={fieldClass}
                  maxLength={200}
                  onChange={(event) =>
                    updateRow(index, { comments: event.target.value })
                  }
                  value={row.comments}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-4 border-[#FFD142] border-t-[0.5px] px-6 py-5">
        <p className="text-muted-foreground text-sm">
          Questions about this form?{" "}
          <a
            className="font-medium text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary"
            href={`mailto:${CONTACT_EMAIL}`}
          >
            {CONTACT_EMAIL}
          </a>
        </p>

        <div className="flex items-center gap-3">
          {submitted !== null && (
            <output className="font-mono text-primary text-xs uppercase tracking-[0.12em]">
              {submitted === 0
                ? "No lines filled in"
                : `${submitted} line${submitted === 1 ? "" : "s"} submitted`}
            </output>
          )}
          <Button
            className="text-muted-foreground hover:text-card-foreground"
            onClick={handleReset}
            type="button"
            variant="ghost"
          >
            Clear sheet
          </Button>
          <Button
            className="min-w-44 border border-primary/60 bg-background px-8 text-foreground hover:border-primary hover:bg-secondary"
            disabled={isSubmitting}
            type="submit"
          >
            Submit order
          </Button>
        </div>
      </footer>
    </form>
  );
}
