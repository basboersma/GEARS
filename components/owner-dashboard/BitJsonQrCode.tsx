// biome-ignore-all assist/source/useSortedAttributes: Preserves the imported QR code JSX attribute order.
// biome-ignore-all lint: Preserves web component and image sizing conventions.
"use client";

import React, { useEffect, useState } from "react";

export function BitJsonQrCode({
  contents,
  iconSrc = "/gears_branding/asset-17.png",
  size = 100,
  moduleColor = "#FFFFFF",
  positionRingColor = "#FFFFFF",
  positionCenterColor = "#FFFFFF",
  backgroundColor = "#1A1919",
}: {
  contents: string;
  iconSrc?: string;
  size?: number;
  moduleColor?: string;
  positionRingColor?: string;
  positionCenterColor?: string;
  backgroundColor?: string;
}) {
  const [isReady, setIsReady] = useState(false);
  const iconDimension = Math.round(size * 0.28);

  useEffect(() => {
    let mounted = true;
    // @ts-ignore - Untyped subpath in @bitjson/qr-code
    import("@bitjson/qr-code/dist/esm/es5/qr-code.define.js")
      .then(
        ({
          defineCustomElements,
        }: {
          defineCustomElements: (win: Window) => void;
        }) => {
          if (typeof window !== "undefined") {
            defineCustomElements(window);
            if (mounted) {
              setIsReady(true);
            }
          }
        }
      )
      .catch((err) => {
        console.error("Failed to load QR code component", err);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div
      className="flex items-center justify-center overflow-hidden rounded-lg"
      style={{
        width: size,
        height: size,
        backgroundColor,
      }}
    >
      {isReady ? (
        React.createElement(
          "qr-code",
          {
            contents,
            "module-color": moduleColor,
            "position-center-color": positionCenterColor,
            "position-ring-color": positionRingColor,
            style: {
              width: `${size}px`,
              height: `${size}px`,
              backgroundColor,
              display: "block",
            },
          },
          iconSrc
            ? React.createElement("img", {
                alt: "Gears Logo",
                slot: "icon",
                src: iconSrc,
                width: iconDimension,
                height: iconDimension,
                style: {
                  width: `${iconDimension}px`,
                  height: `${iconDimension}px`,
                  objectFit: "contain",
                },
              })
            : null
        )
      ) : (
        <div
          className="flex items-center justify-center text-[#7A6555] text-[10px]"
          style={{ width: size, height: size }}
        >
          QR Code
        </div>
      )}
    </div>
  );
}
