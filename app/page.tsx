import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
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
        <section className="hero">
          <div className="hero-content">
            <div className="hero-logo-wrapper">
              <Image
                alt="GEARS Robotics & Engineering Association"
                className="hero-logo"
                height={180}
                src="/gears_branding/gears_logo.png"
                width={420}
              />
            </div>
            <p className="hero-tagline">
              Gronigen Engineering and Robotics Study Association
            </p>
            <h1>Platform for STEM student challenges.</h1>
            <p className="hero-lead">
              GEARS is a student-led STEM association that provides
              opportunities for challenge-based learning through
              interdisciplinary projects, competitions, workshops, and industry
              collaborations. Our mission is to help students develop practical
              skills, gain real world experience, and build meaningful
              connections while working on innovative solutions to technical and
              societal changes.
            </p>

            <div className="hero-actions">
              <Link className="btn btn-primary" href="/login">
                JOIN GEARS
              </Link>
            </div>
          </div>
        </section>

        <section className="section section-alt">
          <div className="section-header">
            <h2>What We Do</h2>
            <p>
              GEARS supports students by:
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
            </p>
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
