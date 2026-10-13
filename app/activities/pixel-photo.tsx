"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const BLOCKS = [48, 24, 12, 6]; //px, going from rough to fine
const STEP_TIME = 110; //ms per step for the animation


interface PixelPhotoProps {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
}

//for drawing the image in block, to make it pixelated
//reference: https://stackoverflow.com/questions/77166522/pixelated-image-animation-transition-when-they-enter-viewport-with-lazy-loading
//https://developer.mozilla.org/en-US/docs/Web/HTML/Element/canvas
//https://stackoverflow.com/questions/118241/can-you-make-an-image-pixelated-in-html5-canvas
function drawBlocks(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  block: number
) {
  const cols = Math.max(1, Math.ceil(canvas.width / block));
  const rows = Math.max(1, Math.ceil(canvas.height / block));
  const scale = Math.max(cols / img.naturalWidth, rows / img.naturalHeight);
  const width = img.naturalWidth * scale;
  const height = img.naturalHeight * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, (cols - width) / 2, (rows - height) / 2, width, height);
  ctx.drawImage(canvas, 0, 0, cols, rows, 0, 0, cols * block, rows * block);
}


//starts pixelated, then sharpens up in steps, to give a "pixel photo" effect
export function PixelPhoto({ src, alt, sizes, className }: PixelPhotoProps) {
  const [sharp, setSharp] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!(img && canvas)) {
      return;
    }
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let timer = 0;

    const sharpen = (step: number) => {
      if (still || step === BLOCKS.length) {
        setSharp(true);
        return;
      }
      drawBlocks(canvas, img, BLOCKS[step]);
      timer = window.setTimeout(() => sharpen(step + 1), STEP_TIME);
    };

    const watcher = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          return;
        }
        watcher.disconnect();
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        img
          .decode()
          .then(() => sharpen(0))
          .catch(() => setSharp(true));
      },
      { threshold: 0.3 }
    );
    watcher.observe(canvas);
    return () => {
      watcher.disconnect();
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <div
      className={className ? `pixel-photo ${className}` : "pixel-photo"}
      data-sharp={sharp ? "" : undefined}
    >
      <Image alt={alt} fill ref={imgRef} sizes={sizes} src={src} />
      <canvas ref={canvasRef} />
    </div>
  );
}
