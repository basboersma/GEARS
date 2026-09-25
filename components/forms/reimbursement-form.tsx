"use client";

import { useState } from "react";

export function ReimbursementForm({
  organizationId,
}: {
  organizationId: string;
}) {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) {
      return;
    }
    setSubmitting(true);
    setError("");
    const form = new FormData(event.currentTarget);
    form.set("organizationId", organizationId);
    const response = await fetch("/api/reimbursements", {
      method: "POST",
      body: form,
    });
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(body?.error ?? "Unable to submit reimbursement");
      setSubmitting(false);
      return;
    }
    event.currentTarget.reset();
    setSubmitted(true);
    setSubmitting(false);
  }

  let submitLabel = "Submit reimbursement";
  if (submitting) {
    submitLabel = "Submitting…";
  } else if (submitted) {
    submitLabel = "Submitted";
  }

  return (
    <form className="mx-auto grid w-full max-w-xl gap-4" onSubmit={submit}>
      <h1 className="font-bold text-2xl">Submit reimbursement</h1>
      <label className="grid gap-1">
        <span className="font-medium text-sm">Order name</span>
        <input
          aria-label="Order name"
          name="name"
          placeholder="Order name"
          required
        />
      </label>
      <input name="department" placeholder="Department" required />
      <input name="link" placeholder="Link / URL" required />
      <div className="grid grid-cols-2 gap-3">
        <input
          min="0"
          name="pricePerPiece"
          placeholder="Amount"
          required
          step="0.01"
          type="number"
        />
        <input
          defaultValue="1"
          min="1"
          name="quantity"
          required
          type="number"
        />
      </div>
      <select defaultValue="" name="orderType" required>
        <option disabled value="">
          Select order type
        </option>
        <option>Hardware</option>
        <option>Electronic</option>
        <option>Software</option>
        <option>Social</option>
      </select>
      <select defaultValue="" name="urgency" required>
        <option disabled value="">
          Select urgency
        </option>
        <option>1 day</option>
        <option>2 days</option>
        <option>3 days</option>
        <option>7 days</option>
      </select>
      <textarea name="comments" placeholder="Comments" required />
      <input accept="image/*,.pdf" name="file" required type="file" />
      <button disabled={submitting} type="submit">
        {submitLabel}
      </button>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </form>
  );
}
