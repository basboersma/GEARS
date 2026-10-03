import "./site-footer.css";
import Image from "next/image";
import Link from "next/link";
// import { MEMBERSHIP_BASE } from "@/lib/routes";

//charcoal band at the bottom of every page
export function SiteFooter() {
  return (
    <footer className="page-footer">
      <div className="page-footer-grid">
        <div className="page-footer-about">
          <Image alt="" height={714} src="/gears-logo-grey.png" width={764} />
          <p>
            Groningen Engineering and Robotics Study Association. Platform for
            facilitating student teams.
          </p>
        </div>

        <div className="page-footer-col">
          <p className="page-footer-label">Visit</p>
          <span>Nijenborgh 4</span>
          <span>9747 AG Groningen</span>
          <span>KVK 42017832</span>
        </div>

        <div className="page-footer-col">
          <p className="page-footer-label">Contact</p>
          <a href="mailto:board@gearsnl.org">board@gearsnl.org</a>
          <a
            href="https://www.linkedin.com/company/gearsnl/"
            rel="noopener noreferrer"
            target="_blank"
          >
            LinkedIn ↗
          </a>
          <a
            href="https://www.instagram.com/gearsnl/"
            rel="noopener noreferrer"
            target="_blank"
          >
            Instagram ↗
          </a>
        </div>

        <nav aria-label="Footer" className="page-footer-col">
          <p className="page-footer-label">Pages</p>
          <Link href="/activities">Teams</Link>
          <Link href="/membership">Membership</Link>
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
        </nav>
      </div>

      <div className="page-footer-meta">
        <span>© {new Date().getFullYear()} GEARS</span>
        <span className="page-footer-legal">
          <Link href="/privacy">Privacy policy</Link>
          <Link href="/terms">Terms and Conditions</Link>
        </span>
      </div>
    </footer>
  );
}
