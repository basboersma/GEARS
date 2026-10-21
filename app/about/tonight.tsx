"use client";

import { Instrument_Serif } from "next/font/google";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import "./tonight.css";

const serif = Instrument_Serif({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

const ART = "/assets/about";

//one programme per channel, each with its own photo, channel 5 is us
const SHOWS = [
  { title: "GEARS One", src: `${ART}/board.jpg` },
  { title: "Workshop", src: "/journey/makercie-00.jpg" },
  { title: "Paperwork", src: "/journey/makercie-04.jpg" },
  { title: "Members", src: "/journey/makercie-11.jpg" },
  { title: "The Board", src: "" },
  { title: "Goals", src: "/journey/kiwi-mexico.jpg" },
];

const BOARD = ["chair", "secretary", "treasurer", "extern"];

//hh:mm, ticks every few seconds
function useClock() {
  const [now, setNow] = useState("--:--");

  useEffect(() => {
    const tick = () =>
      setNow(
        new Date().toLocaleTimeString("nl-NL", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    tick();
    const id = setInterval(tick, 10000);
    return () => clearInterval(id);
  }, []);

  return now;
}

export function Tonight() {
  const now = useClock();
  const [ch, setCh] = useState(0);
  const [touched, setTouched] = useState(false);
  const [noise, setNoise] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  //a little static between channels
  function tune(next: number) {
    if (next === ch) return; //already on, nothing to turn
    setCh(next);
    setTouched(true);
    setNoise(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setNoise(false), 400);
  }

  const show = SHOWS[ch];

  return (
    <section className={`tonight ${serif.variable}`}>
      <div className="tonight-head">
        <div>
          <p className="label">
            GEARS TV guide · now {now} · Nijenborgh 4, Groningen
          </p>
          <h1 className="display">
            About <span>GEARS</span>
          </h1>
        </div>
        <div className="tonight-host">
          <Image
            alt="The GEARS gear"
            height={240}
            src={`${ART}/gear.png`}
            width={240}
          />
          <em>Hi, I'll be your host tonight!</em>
        </div>
      </div>

      <div className="tonight-main">
        <div className="tonight-wall">
          <div className="tv">
            <div className="tv-screen">
              {show.src ? (
                <Image alt="" fill sizes="520px" src={show.src} />
              ) : (
                <div className="tv-board">
                  {BOARD.map((role) => (
                    <Image
                      alt={role}
                      height={440}
                      key={role}
                      src={`${ART}/${role}.png`}
                      width={330}
                    />
                  ))}
                </div>
              )}
              <p className="tv-lower">
                <span className="label">
                  {now} · CH {ch + 1}
                </span>
                {show.title}
              </p>
              {noise && <div className="tv-noise" />}
            </div>
            <Image alt="" className="tv-body" fill src={`${ART}/tv.png`} />
            <button
              aria-label="Next channel"
              className={touched ? "tv-knob" : "tv-knob hint"}
              onClick={() => tune((ch + 1) % SHOWS.length)}
              style={{ rotate: `${ch * 60}deg` }}
              type="button"
            >
              <Image alt="" height={84} src={`${ART}/knob.png`} width={80} />
            </button>
            <div className="tv-keys">
              {SHOWS.map((s, i) => (
                <button
                  aria-label={s.title}
                  aria-pressed={ch === i}
                  key={s.title}
                  onClick={() => tune(i)}
                  type="button"
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="tonight-guide">
          <h2>
            Tonight on <em>GEARS</em>
          </h2>
          {SHOWS.map((s, i) => (
            <button key={s.title} onClick={() => tune(i)} type="button">
              <span className="label">CH {i + 1}</span>
              {s.title}
              {ch === i && <mark className="label">on now, {now}</mark>}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
