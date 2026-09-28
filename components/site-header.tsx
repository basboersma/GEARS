import Image from "next/image";
import Link from "next/link";
import { JOIN_URL, MEMBERSHIP_BASE } from "@/lib/routes";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <div className="brand">
          <div className="brand-text">
            <Image
              alt="GEARS logo"
              className="brand-logo"
              height={48}
              src="/gears_branding/gears_logo_small.jpeg"
              width={48}
            />
            <div className="brand-text-lines">
              <span className="brand-name">GEARS</span>
              <span className="brand-subtitle">
                Gronigen Engineering and Robotics Study Association
              </span>
            </div>
          </div>
        </div>

        <nav className="nav">
          <Link href="/">Home</Link>
          <Link href="/activities">Activities</Link>
          <Link href={MEMBERSHIP_BASE}>Membership</Link>
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/login">Login</Link>
          <a className="nav-cta" href={JOIN_URL} target="_blank" rel="noopener noreferrer">
            JOIN GEARS
          </a>
        </nav>
      </div>
    </header>
  );
}
