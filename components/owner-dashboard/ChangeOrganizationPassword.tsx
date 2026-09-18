// biome-ignore-all lint/style/useFilenamingConvention: Preserves the existing dashboard component naming convention.
"use client";

import { useState } from "react";

export function ChangeOrganizationPassword({
  organizationId,
  role,
}: {
  organizationId: string;
  role: "owner" | "admin";
}) {
  const [open, setOpen] = useState(false);
  const [previousPassword, setPreviousPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    const response = await fetch("/api/organization-password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId, previousPassword, newPassword }),
    });
    const result = (await response.json()) as { error?: string };
    setSaving(false);
    if (!response.ok) {
      setMessage(result.error ?? "Unable to change password.");
      return;
    }
    setPreviousPassword("");
    setNewPassword("");
    setMessage("Password updated.");
  };

  return (
    <div className="relative">
      <button
        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[#9C8272] text-xs transition-all hover:bg-white/5 hover:text-[#FFEDD1]"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span className="h-1 w-1 shrink-0 rounded-full bg-[#9C8272]/50" />
        <span>Change Password</span>
      </button>
      {open && (
        <form
          className="absolute top-full left-0 z-50 mt-2 w-64 space-y-2 rounded-xl border border-[#3D3330] bg-[#232120] p-3 shadow-xl"
          onSubmit={submit}
        >
          <div className="font-semibold text-[#FFEDD1] text-xs">
            {role === "owner" ? "Owner" : "Admin"} password
          </div>
          <input
            className="w-full rounded-lg border border-[#3D3330] bg-[#141212] px-2.5 py-2 text-[#FFEDD1] text-xs outline-none focus:border-[#F0684D]"
            onChange={(event) => setPreviousPassword(event.target.value)}
            placeholder="Previous Password"
            type="password"
            value={previousPassword}
          />
          <input
            className="w-full rounded-lg border border-[#3D3330] bg-[#141212] px-2.5 py-2 text-[#FFEDD1] text-xs outline-none focus:border-[#F0684D]"
            minLength={8}
            onChange={(event) => setNewPassword(event.target.value)}
            placeholder="New Password"
            required
            type="password"
            value={newPassword}
          />
          <button
            className="w-full rounded-lg bg-[#F0684D] px-2.5 py-2 font-semibold text-white text-xs disabled:opacity-50"
            disabled={saving}
            type="submit"
          >
            {saving ? "Saving…" : "Save Password"}
          </button>
          {message && <p className="text-[#C4A882] text-[10px]">{message}</p>}
        </form>
      )}
    </div>
  );
}
