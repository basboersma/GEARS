// biome-ignore-all lint/style/useFilenamingConvention: Preserves the existing dashboard component naming convention.
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ChangeOrganizationPassword({
  organizationId,
}: {
  organizationId: string;
}) {
  const [open, setOpen] = useState(false);
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  const [previousPassword, setPreviousPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/organization-password?organizationId=${organizationId}`)
      .then((response) => response.json())
      .then((result: { hasPassword?: boolean }) =>
        setHasPassword(result.hasPassword === true)
      )
      .catch(() => setHasPassword(false));
  }, [organizationId]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/organization-password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          ...(hasPassword ? { previousPassword } : {}),
          newPassword,
        }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setMessage(result.error ?? "Unable to change password.");
        return;
      }
      setHasPassword(true);
      setPreviousPassword("");
      setNewPassword("");
      setOpen(false);
      setMessage("Password updated.");
    } catch {
      setMessage("Unable to change password.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <Button
          className="w-fit rounded-none"
          onClick={() => setOpen((current) => !current)}
          type="button"
          variant="outline"
        >
          {hasPassword ? "Change Password" : "Set Password"}
        </Button>
        {open && (
          <form className="flex items-center gap-2" onSubmit={submit}>
            {hasPassword && (
              <Input
                aria-label="Old Password"
                className="w-36 rounded-none"
                onChange={(event) => setPreviousPassword(event.target.value)}
                placeholder="Old Password"
                type="password"
                value={previousPassword}
              />
            )}
            <Input
              aria-label={hasPassword ? "New Password" : "Set Password"}
              className="w-36 rounded-none"
              minLength={8}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder={hasPassword ? "New Password" : "Set Password"}
              required
              type="password"
              value={newPassword}
            />
            <Button className="rounded-none" disabled={saving} type="submit">
              {saving ? "Saving…" : "Save"}
            </Button>
          </form>
        )}
      </div>
      {message && <p className="text-muted-foreground text-xs">{message}</p>}
    </div>
  );
}
