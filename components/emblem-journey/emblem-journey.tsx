"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { EmblemScene } from "./scene";
import { CLOSING, OPENING, STEPS } from "./steps";
import {
  CLOSING_STAGE,
  OPENING_STAGE,
  stageAt,
  TIMELINE_LENGTH,
  timeFromScroll,
} from "./timeline";
import "./emblem-journey.css";

const twoDigits = (n: number) => String(n).padStart(2, "0");

//homepage section where the GEARS emblem comes apart piece by piece as you scroll.
export function EmblemJourney() {
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);
  const [stage, setStage] = useState(OPENING_STAGE);
  const [hasWebGL, setHasWebGL] = useState(true);

  useEffect(() => {
    const track = trackRef.current;
    const pinned = stageRef.current;
    const canvas = canvasRef.current;
    const progress = progressRef.current;
    if (!(track && pinned && canvas && progress)) {
      return;
    }

    let scene: EmblemScene | null = null;
    let frame = 0;
    let unmounted = false;

    const update = () => {
      frame = 0;
      const pinnedTop = Number.parseFloat(getComputedStyle(pinned).top) || 0;
      const scrolled = pinnedTop - track.getBoundingClientRect().top;
      const time = timeFromScroll(
        scrolled,
        track.offsetHeight - pinned.offsetHeight
      );

      setStage(stageAt(time));
      progress.style.transform = `scaleX(${time / TIMELINE_LENGTH})`;
      scene?.setTime(time);
    };

    const scheduleUpdate = () => {
      if (!frame) {
        frame = requestAnimationFrame(update);
      }
    };

    //pin the stage right under the sticky header, however tall it is
    const header = document.querySelector<HTMLElement>(".topbar");
    const resizeObserver = new ResizeObserver(() => {
      pinned.style.setProperty("--pin-top", `${header?.offsetHeight ?? 0}px`);
      scene?.resize();
      scheduleUpdate();
    });
    resizeObserver.observe(canvas);
    if (header) {
      resizeObserver.observe(header);
    }
    window.addEventListener("scroll", scheduleUpdate, { passive: true });

    //three.js is big, so it only loads once this section is on the page
    const startScene = async () => {
      const { createEmblemScene } = await import("./scene");
      if (unmounted) {
        return;
      }
      try {
        scene = createEmblemScene(canvas);
        scheduleUpdate();
      } catch {
        setHasWebGL(false); //the text still follows the scroll, just with a flat emblem
      }
    };
    startScene();

    return () => {
      unmounted = true;
      window.removeEventListener("scroll", scheduleUpdate);
      resizeObserver.disconnect();
      cancelAnimationFrame(frame);
      scene?.dispose();
    };
  }, []);

  const step = STEPS[stage];
  const intro = stage === CLOSING_STAGE ? CLOSING : OPENING;
  const text = step ?? intro;
  //links to other sites open in a new tab, like the rest of the site
  const isExternal = step?.href.startsWith("http") ?? false;

  return (
    <section
      aria-label="How GEARS supports student challenges"
      className="journey"
    >
      <div className="journey-heading">
        <p className="journey-eyebrow">What we do...</p>
        <h2>It all starts with an idea...</h2>
        <a className="journey-link" href="/activities#teams">
          Meet the teams
        </a>
      </div>

      <div className="journey-track" ref={trackRef}>
        <div className="journey-stage" data-chapter={Boolean(step)} ref={stageRef}>
          <div className="journey-model">
            {hasWebGL ? (
              <canvas ref={canvasRef} />
            ) : (
              <Image
                alt="GEARS emblem"
                height={400}
                src="/gears-emblem.png"
                width={400}
              />
            )}
            <span aria-hidden="true" className="journey-mark">
              Groningen / Student challenges
            </span>
          </div>

          <div aria-live="polite" className="journey-copy">
            {step && (
              <>
                <span aria-hidden="true" className="journey-number">
                  {twoDigits(stage + 1)}
                </span>
                <p className="journey-eyebrow">
                  {twoDigits(stage + 1)} / {twoDigits(STEPS.length)}
                </p>
              </>
            )}
            <h3>{text.title}</h3>
            {!step && (
              <span aria-hidden="true" className="journey-number is-word">
                GEARS
              </span>
            )}
            <p className="journey-description">{text.description}</p>
            {step ? (
              <a
                className="journey-link"
                href={step.href}
                rel="noopener noreferrer"
                target={isExternal ? "_blank" : undefined}
              >
                {step.link} {isExternal ? "↗" : "→"}
              </a>
            ) : (
              <p className="journey-cue">{intro.cue}</p>
            )}
          </div>

          <div aria-hidden="true" className="journey-bottom">
            <ol className="journey-steps">
              {STEPS.map((item, index) => (
                <li
                  className={index === stage ? "active" : undefined}
                  key={item.title}
                >
                  {twoDigits(index + 1)} {item.title}
                </li>
              ))}
            </ol>
            <div className="journey-progress">
              <span ref={progressRef} />
            </div>
          </div>
        </div>
      </div>

      <div id="after-journey" />
    </section>
  );
}
