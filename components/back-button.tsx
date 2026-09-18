"use client";

import { XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function BackButton() {
  const router = useRouter();

  return (
    <Button
      aria-label="Close account page"
      className="rounded-none"
      onClick={() => router.back()}
      size="icon"
      variant="outline"
    >
      <XIcon className="size-4" />
    </Button>
  );
}
