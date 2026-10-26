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

const BOARD = [
  { role: "chair", name: "Chair" },
  { role: "secretary", name: "Secretary" },
  { role: "treasurer", name: "Treasurer" },
  { role: "extern", name: "External affairs" },
];

//a photo printed in coral ink
const Riso = ({ src }: { src: string }) => (
  <div className="riso">
    <Image alt="" fill sizes="560px" src={src} />
  </div>
);

//one channel per part of the about text: a show on the tv, a spread in the notes
const SHOWS = [
  {
    title: "About GEARS",
    show: <Image alt="" fill sizes="520px" src={`${ART}/show-1.jpg`} />,
    left: (
      <div className="page page-coral">
        <h3 className="display">About GEARS</h3>
        <Riso src={`${ART}/board.jpg`} />
      </div>
    ),
    right: (
      <div className="page">
        <p className="lead">
          GEARS is a student-led STEM association that provides opportunities
          for challenge-based learning through interdisciplinary projects,
          competitions, workshops, and industry collaborations. Our mission is
          to help students develop practical skills, gain real world experience,
          and build meaningful connections while working on innovative solutions
          to technical and societal changes.
        </p>
      </div>
    ),
  },
  {
    title: "What We Do",
    show: <Image alt="" fill sizes="520px" src={`${ART}/show-2.jpg`} />,
    left: (
      <div className="page">
        <h3 className="display">What We Do</h3>
        <p>GEARS supports students by:</p>
        <ul>
          <li>
            Providing teams with seed-funding to enable them to enter
            competitions
          </li>
          <li>Organizing and participating in STEM competitions</li>
          <li>Facilitating interdisciplinary projects</li>
          <li>Connecting students with industry partners</li>
          <li>Hosting workshops and networking events</li>
          <li>
            Creating opportunities for hands-on learning and professional
            development
          </li>
        </ul>
      </div>
    ),
    right: (
      <div className="page">
        <Riso src="/journey/makercie-13.jpg" />
      </div>
    ),
  },
  {
    title: "Handling paperwork",
    show: <Image alt="" fill sizes="520px" src={`${ART}/show-3.jpg`} />,
    left: (
      <div className="page">
        <Riso src="/journey/makercie-04.jpg" />
        <Image
          alt="A stack of forms stamped with the GEARS emblem"
          height={520}
          src={`${ART}/paperwork.png`}
          width={900}
        />
      </div>
    ),
    right: (
      <div className="page">
        <h3 className="display">Handling paperwork</h3>
        <p className="lead">
          Bureaucracy is the most time-consuming part of starting a new team.
          Our mission is to facilitate the formation and growth of teams
          competing in student challenges by allowing teams to focus on the
          quality of the R&amp;D.
        </p>
      </div>
    ),
  },
  {
    title: "What members get",
    show: (
      <div className="show show-game">
        <b>What members get</b>
        <p>
          <span>1</span>
          <span>2</span>
          <span>3</span>
          <span>4</span>
        </p>
      </div>
    ),
    left: (
      <div className="page">
        <h3 className="display">What members get</h3>
        <h4 className="display">Team Perks</h4>
        <p>Facilitated bureaucracy process for new and established teams.</p>
        <h4 className="display">Social</h4>
        <p>
          Meet like-minded students at our monthly socials, game nights and
          informal project evenings in the GEARS room.
        </p>
      </div>
    ),
    right: (
      <div className="page">
        <Riso src="/journey/makercie-11.jpg" />
        <h4 className="display">Study</h4>
        <p>
          Get support with hard courses through workshops, project reviews and
          peer-to-peer tutoring in robotics-related topics.
        </p>
        <h4 className="display">Career</h4>
        <p>
          Explore future paths through company visits, tech talks and networking
          events with our industrial partners.
        </p>
      </div>
    ),
  },
  {
    title: "Starring the board",
    show: <Image alt="" fill sizes="520px" src={`${ART}/show-5.jpg`} />,
    left: (
      <div className="page">
        <h3 className="display">Starring the board</h3>
        <div className="cast">
          {BOARD.map((b) => (
            <div key={b.role}>
              <Riso src={`${ART}/${b.role}.png`} />
              <span className="label">{b.name}</span>
              <a href={`mailto:${b.role}@gearsnl.org`}>{b.role}@gearsnl.org</a>
            </div>
          ))}
        </div>
      </div>
    ),
    right: (
      <a className="page page-dark" href="/contact">
        <span className="display">
          Talk to <span>the board</span>
        </span>
        <span>Interested in collaborating, sponsoring or just curious?</span>
        <span className="label">Spin the gear to pick your contact →</span>
        <svg aria-hidden="true" className="chute" viewBox="0 0 34 40">
          <path d="M2 14a15 13 0 0 1 30 0z" fill="#f0694e" />
          <path d="M3 14l11 16M31 14L20 30" stroke="#fffdf9" />
          <rect fill="#fffdf9" height="9" width="12" x="11" y="28" />
          <path d="M11 28l6 5 6-5" fill="none" stroke="#f0694e" />
        </svg>
      </a>
    ),
  },
  {
    title: "Our objectives",
    show: (
      <div className="show show-credits">
        <p>
          <b className="display">Our objectives</b>
          Seed-funding
          <br />
          Sponsors and organisations
          <br />A website and social media
          <br />
          Events for members and students
        </p>
      </div>
    ),
    left: (
      <div className="page">
        <h3 className="display">GEARS Organisational Objectives</h3>
        <p>
          The aim of the association is to offer students a platform through
          which they can participate in and are stimulated to engage in
          challenge-based learning, by allowing members to participate in
          various committees corresponding to various STEM projects and
          competitions where they can gain experience and learn to work together
          in a diverse, international environment.
        </p>
      </div>
    ),
    right: (
      <div className="page page-dark">
        <span className="label">Objectives</span>
        <ol className="lead">
          <li>
            Providing committees with seed-funding to enable them to enter the
            corresponding competition or project
          </li>
          <li>
            Providing committees with contact with various sponsors and
            organisations through its network
          </li>
          <li>Maintain a website and various social media</li>
          <li>
            Organise events aimed at connecting its members and university
            students.
          </li>
        </ol>
      </div>
    ),
  },
];

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
  const next = () => tune((ch + 1) % SHOWS.length);

  return (
    <section className={`tonight ${serif.variable}`}>
      <div className="tonight-head">
        <h1 className="display">
          About <span>GEARS</span>
        </h1>
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
              {show.show}
              <p className="tv-lower">
                <span className="label">
                  {now} · CH {ch + 1}
                </span>
                {show.title}
              </p>
              {noise && (
                <div className="tv-noise">
                  <Image
                    alt=""
                    height={240}
                    src={`${ART}/gear.png`}
                    width={240}
                  />
                </div>
              )}
            </div>
            <Image alt="" className="tv-body" fill src={`${ART}/tv.png`} />
            <button
              aria-label="Next channel"
              className={touched ? "tv-knob" : "tv-knob hint"}
              onClick={next}
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

      <div className="notes">
        <div className="notes-head">
          <h2 className="display">
            Tonight's <span>notes</span>
          </h2>
          <button
            onClick={() => tune((ch + SHOWS.length - 1) % SHOWS.length)}
            type="button"
          >
            Prev
          </button>
          <button onClick={next} type="button">
            Next
          </button>
        </div>
        <div className="spread" key={ch}>
          {show.left}
          {show.right}
        </div>
      </div>
    </section>
  );
}
