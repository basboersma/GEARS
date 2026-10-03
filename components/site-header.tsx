"use client";

import "./site-header.css";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { JOIN_URL } from "@/lib/routes";

//one list for the desktop nav and the phone menu
const PAGES = [
  { href: "/", label: "Home" },
  { href: "/activities", label: "Teams" },
  { href: "/membership", label: "Membership" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  //this way home gets no appendix, while all others are subpages with some slash
  const isCurrent = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link aria-label="GEARS home" className="topbar-brand" href="/">
          <Image
            alt="GEARS"
            height={228}
            priority
            src="/gears_branding/gears_logo.png"
            width={1092}
          />
        </Link>

        <nav
          aria-label="Main"
          className="topbar-nav"
          data-open={menuOpen}
          id="topbar-nav"
        >
          {PAGES.map((page) => (
            <Link
              aria-current={isCurrent(page.href) ? "page" : undefined}
              href={page.href}
              key={page.href}
              onClick={closeMenu}
            >
              {page.label}
            </Link>
          ))}
          <Link className="topbar-nav-login" href="/login" onClick={closeMenu}>
            Log in
          </Link>
        </nav>

        <div className="topbar-actions">
          <Link className="topbar-login" href="/login">
            Log in
          </Link>
          <a
            className="topbar-join"
            href={JOIN_URL}
            rel="noopener noreferrer"
            target="_blank"
          >
            Join GEARS
          </a>
          <button
            aria-controls="topbar-nav"
            aria-expanded={menuOpen}
            aria-label="Menu"
            className="topbar-menu"
            onClick={() => setMenuOpen(!menuOpen)}
            type="button"
          >
            {menuOpen ? "×" : "≡"}
          </button>
        </div>
      </div>
    </header>
  );
}
