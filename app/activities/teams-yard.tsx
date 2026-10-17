"use client";

import { useEffect, useRef, useState } from "react";
import { PixelPhoto } from "./pixel-photo";
import { TEAMS } from "./teams";
import { GEAR, paintBackdrop, paintFrame, ROWS } from "./yard-scene";

const FRAME = 1000 / 14; //ms per frame, smol 
const SPEED = 0.012; //how far the gear moves each frame, in canvas units
const KEYS: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1 };

//picking a team moves the gear to that team's spot, and shows their info in a card
export function TeamsYard() {
  const [active, setActive] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  //where the gear is, where it's going, and how often it turns on the way
  const gear = useRef({
    x: 0.04,
    from: 0.04,
    to: TEAMS[0].spot,
    turns: 1,
  }).current;

  //source: https://stackoverflow.com/questions/77166522/pixelated-image-animation-transition-when-they-enter-viewport-with-lazy-loading
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!(canvas && ctx)) {
      return;
    }
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let backdrop: HTMLCanvasElement | undefined;
    let frame = 0;
    let last = 0;
    
    //tick function for the animation, called on every frame => gear moves, and the canvas is repainted
    const tick = (time: number) => {
      frame = requestAnimationFrame(tick);
      if (!backdrop || time - last < FRAME) {
        return;
      }
      last = time;
      const left = gear.to - gear.x;
      gear.x = still
        ? gear.to
        : gear.x + Math.sign(left) * Math.min(Math.abs(left), SPEED);
      const done =
        gear.to === gear.from
          ? 0
          : (gear.x - gear.from) / (gear.to - gear.from);
      const angle =
        Math.sign(gear.to - gear.from) * done * gear.turns * Math.PI * 2;
      paintFrame(ctx, backdrop, still ? 0 : time, gear.x, angle);
    };

    //start the animation
    //sizer= resizing the canvas
    const sizer = new ResizeObserver(() => {
      canvas.width = Math.round(
        (ROWS * canvas.clientWidth) / canvas.clientHeight
      );
      canvas.height = ROWS;
      backdrop = paintBackdrop(canvas.width, canvas.height);
    });
    //wathcer = starting/stopping the animation when the canvas is in view
    const watcher = new IntersectionObserver(([entry]) => {
      cancelAnimationFrame(frame);
      if (entry.isIntersecting) {
        frame = requestAnimationFrame(tick);
      }
    });
    //start observing the canvas(for stuff like resizing and being in view)
    sizer.observe(canvas);
    watcher.observe(canvas);
    return () => {
      //stop observing the canvas when the component is unmounted
      sizer.disconnect();
      watcher.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [gear]);

  //whole turns only, therefore the gear should stop upright
  const driveTo = (index: number) => {
    const width = canvasRef.current?.width ?? 200;
    const roll = (Math.abs(TEAMS[index].spot - gear.x) * width) / (GEAR / 2);
    gear.from = gear.x;
    gear.to = TEAMS[index].spot;
    gear.turns = Math.max(1, Math.round(roll / (Math.PI * 2)));
    setActive(index);
  };

  //arrow keys
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const next = active + (KEYS[event.key ?? 0]); // active + (-1 || 1)
      if(next !==active && next >= 0 && next < TEAMS.length) {
        driveTo(next);
      }
    };
      addEventListener("keydown", onKey);
      return () => removeEventListener("keydown", onKey);
  });

  //current selected team
  const team = TEAMS[active];

  //html stuff in react :')
  return (
    <>
      <div className="teams-yard">
        <canvas
          aria-label=""
          ref={canvasRef}
          role="img"
        />
        
        {TEAMS.map((spot, index) => (
          <button
            aria-pressed={index === active}
            className="teams-spot"
            key={spot.id}
            onClick={() => driveTo(index)}
            style={{ left: `${spot.spot * 100}%` }}
            type="button"
          >
            <span className="teams-spot-long">{spot.name}</span>
            <span className="teams-spot-short">{spot.short}</span>
          </button>
        ))}
      </div>

      <article aria-live="polite" className="teams-card">
        <div className="teams-card-media" data-team={team.id}>
          {team.photo ? (
            <PixelPhoto
              alt={team.photo.alt}
              key={team.id}
              sizes="(max-width: 768px) 100vw, 42vw"
              src={team.photo.src}
            />
          ) : (
            <span aria-hidden="true">?</span>
          )}
        </div>
        <div className="teams-card-body">
          <p className="label">{team.kind}</p>
          <h2 className="display">{team.name}</h2>
          <p>{team.text}</p>
                    {team.bullets.length > 0 && (
            <ul>
              {team.bullets.map((bullet) => {
                const [label, text] = bullet.split(": ");
                return (
                  <li key={bullet}>
                    <b>{label}:</b> {text}
                  </li>
                );
              })}
            </ul>
          )}
          {team.link && (
            <a className="teams-card-link" href={team.link.href}>
              {team.link.label} →
            </a>
          )}
        </div>
      </article>
    </>
  );
}
