"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface RabobankPaymentFormProps {
  organizationId: string;
  connectionId: string;
}

export default function RabobankPaymentForm({
  organizationId,
  connectionId,
}: RabobankPaymentFormProps) {
  const [creditorName, setCreditorName] = useState("");
  const [creditorIban, setCreditorIban] = useState("");
  const [debtorIban, setDebtorIban] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [remittanceInformation, setRemittanceInformation] = useState("");
  const [executionDate, setExecutionDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = useMemo(
    () => creditorName && creditorIban && debtorIban && amount,
    [amount, creditorIban, creditorName, debtorIban]
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/rabobank/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organizationId,
          connectionId,
          creditorName,
          creditorIban,
          debtorIban,
          amount,
          currency,
          remittanceInformation,
          executionDate,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error ?? "Failed to initiate payment");
      }

      toast.success("Payment initiated");
      setCreditorName("");
      setCreditorIban("");
      setDebtorIban("");
      setAmount("");
      setRemittanceInformation("");
      setExecutionDate("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="grid gap-3" onSubmit={handleSubmit}>
      <div className="grid gap-3 md:grid-cols-2">
        <Input
          onChange={(event) => setCreditorName(event.target.value)}
          placeholder="Creditor name"
          value={creditorName}
        />
        <Input
          onChange={(event) => setCreditorIban(event.target.value)}
          placeholder="Creditor IBAN"
          value={creditorIban}
        />
        <Input
          onChange={(event) => setDebtorIban(event.target.value)}
          placeholder="Debtor IBAN"
          value={debtorIban}
        />
        <Input
          onChange={(event) => setAmount(event.target.value)}
          placeholder="Amount"
          value={amount}
        />
        <Input
          onChange={(event) => setCurrency(event.target.value)}
          placeholder="Currency"
          value={currency}
        />
        <Input
          onChange={(event) => setExecutionDate(event.target.value)}
          placeholder="Execution date"
          value={executionDate}
        />
      </div>
      <Input
        onChange={(event) => setRemittanceInformation(event.target.value)}
        placeholder="Remittance information"
        value={remittanceInformation}
      />
      <Button disabled={!canSubmit || isSubmitting} type="submit">
        {isSubmitting ? "Submitting..." : "Initiate payment"}
      </Button>
    </form>
  );
}
