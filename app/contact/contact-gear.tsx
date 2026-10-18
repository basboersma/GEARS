"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

//roles on the big gear, board on top first
const CONTACTS = [
  {
    role: "Board",
    email: "board@gearsnl.org",
    line: "Not sure who?",
  },
  {
    role: "Chair",
    email: "chair@gearsnl.org",
    line: "Leading, officials",
  },
  {
    role: "Secretary",
    email: "secretary@gearsnl.org",
    line: "Members, meetings",
  },
  {
    role: "Treasurer",
    email: "treasurer@gearsnl.org",
    line: "Finances, invoices",
  },
  {
    role: "External",
    email: "extern@gearsnl.org",
    line: "Partners, sponsors",
  },
];

const STEP = 360 / CONTACTS.length; //degrees between two roles
const RATIO = 40 / 14; //big teeth over small teeth
const KEYS: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1 };

//turn the big gear, the small one shows who is on top
export function ContactGear() {
  //counts steps, so it keeps rolling the same way
  const [turn, setTurn] = useState(0);
  const [copied, setCopied] = useState(false);
  const active = ((turn % CONTACTS.length) + CONTACTS.length) % CONTACTS.length;
  const picked = CONTACTS[active];

  const turnBy = (steps: number) => {
    setTurn((now) => now + steps);
    setCopied(false);
  };

  //shortest way round to the role that was clicked
  const turnTo = (index: number) => {
    let diff = (index - active + CONTACTS.length) % CONTACTS.length;
    if (diff > CONTACTS.length / 2) {
      diff -= CONTACTS.length;
    }
    turnBy(diff);
  };

  //arrow keys, like the teams page
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const steps = KEYS[event.key];
      if (steps) {
        setTurn((now) => now + steps);
        setCopied(false);
      }
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, []);

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(picked.email);
      setCopied(true);
    } catch {
      //clipboard blocked, mailto still works
    }
  };

  return (
    <div className="contact-gears">
      <div
        className="contact-gear-big"
        style={{ rotate: `${-turn * STEP}deg` }}
      >
        {/*holes sit between the five roles*/}
        <Image alt="" height={200} src="/contact/gear-big.svg" width={200} />

        {CONTACTS.map((contact, index) => (
          <button
            aria-pressed={index === active}
            className="contact-tooth"
            key={contact.email}
            onClick={() => turnTo(index)}
            style={{ rotate: `${index * STEP}deg` }}
            type="button"
          >
            {contact.role}
          </button>
        ))}
      </div>

      <div className="contact-gear-small">
        <Image
          alt=""
          height={200}
          src="/contact/gear-small.svg"
          style={{ rotate: `${turn * STEP * RATIO}deg` }}
          width={200}
        />
        <div aria-live="polite" className="contact-card">
          <h2>{picked.role}</h2>
          <span className="label">{picked.line}</span>
          <a href={`mailto:${picked.email}`}>{picked.email}</a>
          <div className="contact-turn">
            <button
              aria-label="Turn the gear back"
              className="contact-arrow"
              onClick={() => turnBy(-1)}
              type="button"
            >
              ↺
            </button>
            <button
              className="contact-copy"
              onClick={copyAddress}
              type="button"
            >
              {copied ? "Copied" : "Copy"}
            </button>
            <button
              aria-label="Turn the gear forward"
              className="contact-arrow"
              onClick={() => turnBy(1)}
              type="button"
            >
              ↻
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
