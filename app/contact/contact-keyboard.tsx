"use client";

import { useState } from "react";

//one key per address, board comes first and is picked when the page opens
const CONTACTS = [
  { role: "Board", email: "board@gearsnl.org", hint: "Not sure who? Start here" },
  { role: "Chair", email: "chair@gearsnl.org" },
  { role: "Secretary", email: "secretary@gearsnl.org" },
  { role: "Treasurer", email: "treasurer@gearsnl.org" },
  { role: "External affairs", email: "extern@gearsnl.org" },
];

const SOCIALS = [
  { label: "LinkedIn", href: "https://www.linkedin.com/company/gearsnl/" },
  { label: "Instagram", href: "https://www.instagram.com/gearsnl/" },
];

//a keyboard of the board: press a key and the screen shows who you reach
export function ContactKeyboard() {
  const [picked, setPicked] = useState(CONTACTS[0]);
  const [copied, setCopied] = useState(false);

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(picked.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      //clipboard blocked by the browser, the mailto link still works
    }
  };

  return (
    <div className="contact-device">
      <div aria-live="polite" className="contact-screen">
        <span className="contact-label">{picked.role}</span>
        <div className="contact-screen-row">
          <a className="contact-screen-mail" href={`mailto:${picked.email}`}>
            {picked.email}
          </a>
          <button className="contact-copy" onClick={copyAddress} type="button">
            {copied ? "Copied" : "Copy address"}
          </button>
        </div>
      </div>

      <fieldset className="contact-keys">
        <legend className="sr-only">Pick who to contact</legend>

        {CONTACTS.map((contact) => (
          <button
            aria-pressed={contact === picked}
            className={
              contact === CONTACTS[0]
                ? "contact-key contact-key-board"
                : "contact-key"
            }
            key={contact.email}
            onClick={() => setPicked(contact)}
            type="button"
          >
            <span className="contact-label">{contact.role}</span>
            {contact.hint && <span>{contact.hint}</span>}
          </button>
        ))}

        {SOCIALS.map((social) => (
          <a
            className="contact-key"
            href={social.href}
            key={social.label}
            rel="noopener noreferrer"
            target="_blank"
          >
            <span className="contact-label">{social.label}</span>
            <span aria-hidden="true">↗</span>
          </a>
        ))}
      </fieldset>
    </div>
  );
}
