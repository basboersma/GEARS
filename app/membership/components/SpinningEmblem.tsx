"use client";

import { useEffect, useRef } from "react";

// The GEARS emblem: idles with a slow spin, grab it to spin, flick it for inertia.
export function SpinningEmblem() {
  const hostRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const img = imgRef.current;
    if (!host || !img) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let angle = 0;
    let vel = 0;
    let dragging = false;
    let lastAngle = 0;
    let lastTime = 0;
    let raf = 0;

    const apply = () => { img.style.transform = `rotate(${angle}deg)`; };
    const angleAt = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180 / Math.PI;
    };

    const onDown = (e: PointerEvent) => {
      dragging = true;
      lastAngle = angleAt(e);
      lastTime = performance.now();
      host.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const a = angleAt(e);
      let d = a - lastAngle;
      if (d > 180) d -= 360;
      else if (d < -180) d += 360;
      angle += d;
      const now = performance.now();
      const dt = (now - lastTime) / 1000;
      if (dt > 0) vel = d / dt;
      lastAngle = a;
      lastTime = now;
      if (reduce) apply();
    };
    const onUp = () => { dragging = false; };

    host.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);

    if (reduce) {
      apply();
    } else {
      let last = performance.now();
      const idle = 8; // deg per second
      const loop = (now: number) => {
        const dt = (now - last) / 1000;
        last = now;
        if (!dragging) {
          angle += (idle + vel) * dt;
          vel *= Math.pow(0.88, dt * 60); // inertia fades after a flick
          if (Math.abs(vel) < 0.02) vel = 0;
        }
        apply();
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }

    return () => {
      host.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="mv-emblem-wrap">
      <div className="mv-emblem" ref={hostRef} role="img" aria-label="GEARS emblem, grab and spin">
        <img ref={imgRef} src="/gears-emblem.png" alt="GEARS" draggable={false} />
      </div>
      <p className="mv-emblem-hint">↺ grab and spin</p>
    </div>
  );
}
