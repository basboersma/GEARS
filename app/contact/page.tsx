import Image from "next/image";
import Link from "next/link";

export default function ContactPage() {
  return (
    <div className="site">
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
            <Link href="/membership">Membership</Link>
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/login">Login</Link>
            <Link className="nav-cta" href="/login">
              JOIN GEARS
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="section section-alt" id="contact">
          <div className="section-header">
            <h2>Contact &amp; partners</h2>
            <p>
              Interested in collaborating, sponsoring hardware or inviting us
              for a demo? Reach out to the GEARS board.
            </p>
          </div>

          <div className="contact-grid">
            <div>
              <h3>Contact</h3>
              <p>
                Board: <a href="mailto:board@gearsnl.org">board@gearsnl.org</a>
              </p>
              <p>
                Chair: <a href="mailto:chair@gearsnl.org">chair@gearsnl.org</a>
              </p>
              <p>
                Secretary:{" "}
                <a href="mailto:secretary@gearsnl.org">secretary@gearsnl.org</a>
              </p>
              <p>
                Treasurer:{" "}
                <a href="mailto:treasurer@gearsnl.org">treasurer@gearsnl.org</a>
              </p>
              <p>
                External Affairs:{" "}
                <a href="mailto:extern@gearsnl.org">extern@gearsnl.org</a>
              </p>
              <p>
                <a href="https://www.linkedin.com/company/gearsnl/">Linkedin</a>
              </p>
              <p>
                <a href="https://www.instagram.com/gearsnl?igsh=dTI2czI4d3M2ZmRl&utm_source=qr">
                  Instagram
                </a>
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-info">
          <strong>GEARS</strong>
          <span>KVK: 42017832</span>
          <span>Nijenborgh 4, 9747 AG, Groningen</span>
          <span>Platform for facilitating student teams.</span>
        </div>

        <div className="footer-meta">
          <span>© {new Date().getFullYear()} GEARS</span>
          <span className="footer-links">
            <a href="/privacy.html">Privacy policy</a>
            <a href="/termsandconditions.html">
              Terms and Conditions for Membership
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
