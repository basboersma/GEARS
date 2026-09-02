"use client";

import { useEffect } from "react";
import { toast } from "sonner";

function readCookie(name: string) {
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));

  return match?.split("=")[1];
}

function clearCookie(name: string) {
  // biome-ignore lint/suspicious/noDocumentCookie: clearing the short-lived status cookie after reading it
  document.cookie = `${name}=; Max-Age=0; path=/`;
}

export function InviteStatusToast() {
  useEffect(() => {
    const status = readCookie("invite_status");

    if (!status) {
      return;
    }

    if (status === "accepted") {
      toast.success("You've joined the organization.");
    } else {
      toast.error(
        "Couldn't accept the invitation. It may have expired, already been used, or you're logged in with a different email than the one invited."
      );
    }

    clearCookie("invite_status");
  }, []);

  return null;
}
