"use client";

import { Camera, Check, Upload } from "lucide-react";
import { useState } from "react";

export function PhotoUpload({
  orderRequestId,
  itemLink,
}: {
  orderRequestId: string;
  itemLink: string;
}) {
  const [state, setState] = useState<"ready" | "uploading" | "done" | "error">(
    "ready"
  );

  async function upload(file: File) {
    setState("uploading");
    const form = new FormData();
    form.append("file", file);
    const response = await fetch(`/api/order-photo/${orderRequestId}`, {
      method: "POST",
      body: form,
    });
    setState(response.ok ? "done" : "error");
  }

  let icon = <Camera className="h-24 w-24 text-[#FFD142]" />;
  let title = "Make a Photo";
  if (state === "done") {
    icon = <Check className="h-20 w-20 text-[#10b981]" />;
    title = "Photo uploaded";
  } else if (state === "error") {
    icon = <Upload className="h-20 w-20 text-[#F0684D]" />;
  } else if (state === "uploading") {
    title = "Uploading...";
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#1A1919] p-6 text-[#FFEDD1]">
      <label className="flex min-h-[70vh] w-full max-w-md cursor-pointer flex-col items-center justify-center gap-5 rounded-3xl border border-[#3D3330] bg-[#232120] p-8 text-center">
        {icon}
        <span className="font-semibold text-2xl">{title}</span>
        <a
          className="max-w-full truncate text-[#FFD142] text-sm underline"
          href={itemLink}
          onClick={(event) => event.stopPropagation()}
          rel="noreferrer"
          target="_blank"
        >
          {itemLink}
        </a>
        {state !== "done" && (
          <span className="text-[#9C8272] text-sm">
            Tap the camera to take a photo of this item
          </span>
        )}
        <input
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (file) {
              await upload(file);
            }
          }}
          type="file"
        />
      </label>
    </main>
  );
}
