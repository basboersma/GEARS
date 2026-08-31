"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function OrganizationTestEmail() {
  const { data: activeOrganization } = authClient.useActiveOrganization();
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);

  if (!activeOrganization?.id) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 rounded-md border bg-background/90 px-2 py-1.5 shadow-sm">
      <input
        aria-label="Test email destination"
        className="w-40 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Send test email"
        type="email"
        value={email}
      />
      <Button
        className="h-8"
        disabled={isSending || !email.trim()}
        onClick={async () => {
          const trimmedEmail = email.trim();

          if (!trimmedEmail) {
            toast.error("Enter an email address first.");
            return;
          }

          setIsSending(true);

          try {
            const response = await fetch("/api/test-email", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                organizationId: activeOrganization.id,
                email: trimmedEmail,
              }),
            });

            const data = (await response.json().catch(() => null)) as {
              error?: string;
              success?: boolean;
            } | null;

            if (!response.ok) {
              toast.error(data?.error || "Unable to send test email.");
              return;
            }

            toast.success("Test email sent.");
            setEmail("");
          } catch (error) {
            console.error(error);
            toast.error("Unable to send test email.");
          } finally {
            setIsSending(false);
          }
        }}
        type="button"
        variant="outline"
      >
        Send
      </Button>
    </div>
  );
}
