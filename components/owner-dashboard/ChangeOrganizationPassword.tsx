// biome-ignore-all lint/style/useFilenamingConvention: Preserves the existing dashboard component naming convention.
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

  let passwordButtonLabel = "Checking Password";
  if (hasPassword === true) {
    passwordButtonLabel = "Change Password";
  } else if (hasPassword === false) {
    passwordButtonLabel = "Set Password";
  }

  return (
    <>
      <Button
        className="w-fit"
        disabled={hasPassword === null || saving}
        onClick={() => setOpen(true)}
        type="button"
        variant="outline"
      >
        {passwordButtonLabel}
      </Button>

      <Dialog onOpenChange={setOpen} open={open}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {hasPassword ? "Change password" : "Set password"}
            </DialogTitle>
            <DialogDescription>
              {hasPassword
                ? "Enter your old password and choose a new password."
                : "Choose a password for this organization membership."}
            </DialogDescription>
          </DialogHeader>
          <form className="grid gap-4" onSubmit={submit}>
            <div className="grid gap-2">
              <label className="font-medium text-sm" htmlFor="old-password">
                Old password
              </label>
              <Input
                id="old-password"
                onChange={(event) => setPreviousPassword(event.target.value)}
                placeholder="Old password"
                required={hasPassword === true}
                type="password"
                value={previousPassword}
              />
            </div>
            <div className="grid gap-2">
              <label className="font-medium text-sm" htmlFor="new-password">
                New password
              </label>
              <Input
                id="new-password"
                minLength={8}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="New password"
                required
                type="password"
                value={newPassword}
              />
            </div>
            {message && <p className="text-destructive text-sm">{message}</p>}
            <DialogFooter>
              <Button
                onClick={() => setOpen(false)}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button disabled={saving} type="submit">
                {saving ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
