"use client";

import Image from "next/image";
import { type PointerEvent, useEffect, useRef } from "react";
import { MEMBERSHIP } from "../data";

const STIFFNESS = 0.04; //how hard the card pulls back to hanging straight
const DAMPING = 0.92; //how quickly the swing dies out
const MAX_ANGLE = 50; //degrees, so the card can't be flipped over

type Motion = { angle: number; speed: number; dragging: boolean; frame: number };

function setAngle(swing: HTMLElement, motion: Motion, value: number) {
  motion.angle = Math.max(-MAX_ANGLE, Math.min(MAX_ANGLE, value));
  swing.style.transform = `rotate(${motion.angle}deg)`;
}

function swingBack(swing: HTMLElement, motion: Motion) {
  motion.frame = 0;
  if (motion.dragging) {
    return;
  }
  motion.speed = (motion.speed - motion.angle * STIFFNESS) * DAMPING;
  setAngle(swing, motion, motion.angle + motion.speed);
  if (Math.abs(motion.angle) > 0.05 || Math.abs(motion.speed) > 0.05) {
    motion.frame = requestAnimationFrame(() => swingBack(swing, motion));
  } else {
    setAngle(swing, motion, 0);
  }
}

const reducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function Lanyard() {
  const swingRef = useRef<HTMLDivElement>(null);
  const motion = useRef<Motion>({ angle: 0, speed: 0, dragging: false, frame: 0 });

  //a small push when the page opens so people see it can move
  useEffect(() => {
    const swing = swingRef.current;
    const current = motion.current;
    if (!swing || reducedMotion()) {
      return;
    }
    current.speed = 3;
    swingBack(swing, current);
    return () => cancelAnimationFrame(current.frame);
  }, []);

  const grab = (event: PointerEvent<HTMLDivElement>) => {
    motion.current.dragging = true;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const drag = (event: PointerEvent<HTMLDivElement>) => {
    const pin = event.currentTarget.parentElement?.getBoundingClientRect();
    if (!(motion.current.dragging && pin)) {
      return;
    }
    const dx = event.clientX - (pin.left + pin.width / 2);
    const dy = event.clientY - pin.top;
    const next = (-Math.atan2(dx, dy) * 180) / Math.PI;
    motion.current.speed = next - motion.current.angle;
    setAngle(event.currentTarget, motion.current, next);
  };

  const letGo = (event: PointerEvent<HTMLDivElement>) => {
    motion.current.dragging = false;
    if (reducedMotion()) {
      setAngle(event.currentTarget, motion.current, 0);
    } else if (!motion.current.frame) {
      swingBack(event.currentTarget, motion.current);
    }
  };

  return (
    <div aria-hidden="true" className="mv-lanyard">
      <div
        className="mv-lanyard-swing"
        onPointerDown={grab}
        onPointerMove={drag}
        onPointerUp={letGo}
        ref={swingRef}
      >
        <div className="mv-lanyard-strap" />
        <div className="mv-lanyard-clip" />
        <div className="mv-card">
          <Image alt="" height={714} src="/gears-logo-grey.png" width={764} />
          <div>
            <p className="mv-card-label">Member</p>
            <strong>{"This could be you!"}</strong>
          </div>
          <p className="mv-card-foot">
            <span>{MEMBERSHIP.name}</span>
            <span>
              {MEMBERSHIP.price} / {MEMBERSHIP.period}
            </span>
          </p>
          <div className="mv-card-bar" />
        </div>
      </div>
    </div>
  );
}
