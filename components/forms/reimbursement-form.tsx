"use client";

import { useState } from "react";

export function ReimbursementForm({
  organizationId,
}: {
  organizationId: string;
}) {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
      return;
    }
    event.currentTarget.reset();
    setSubmitted(true);
  }

  return (
    <form className="mx-auto grid w-full max-w-xl gap-4" onSubmit={submit}>
      <h1 className="font-bold text-2xl">Submit reimbursement</h1>
      <input name="name" placeholder="Description" required />
      <input name="department" placeholder="Department" />
      <input name="link" placeholder="Link / URL" />
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
      <select defaultValue="Hardware" name="orderType">
        <option>Hardware</option>
        <option>Electronic</option>
        <option>Software</option>
        <option>Social</option>
      </select>
      <select defaultValue="7 days" name="urgency">
        <option>1 day</option>
        <option>2 days</option>
        <option>3 days</option>
        <option>7 days</option>
      </select>
      <textarea name="comments" placeholder="Comments" />
      <input accept="image/*,.pdf" name="file" required type="file" />
      <button type="submit">
        {submitted ? "Submitted" : "Submit reimbursement"}
      </button>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </form>
  );
}
