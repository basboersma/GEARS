import Link from "next/link";

export default function ActivitiesPage() {
  return (
    <div className="site">
      <header className="site-header">
        <div className="site-header-inner">
          <div className="brand">
            <div className="brand-text">
              <div aria-label="GEARS logo" className="brand-logo" role="img">
                G
              </div>
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
        <section className="section" id="teams">
          <div className="section-header">
            <h2>Teams</h2>
            <p>
              Join one of our project teams to work on robotics and engineering
              challenges throughout the year.
            </p>
          </div>

          <div className="grid-3 grid">
            <article className="card">
              <h3>Makercie Rover Team</h3>
              <p>
                Makercie is a student rover team focused on space exploration
                and challenge-based engineering. Founded in 2023, the team has
                grown into an interdisciplinary group from the University of
                Groningen and Hanze, and won the Remote Formula of the European
                Rover Challenge.
              </p>
              <ul className="card-list">
                <li>
                  Learn more at{" "}
                  <a
                    href="https://makercie.nl/"
                    rel="noreferrer"
                    target="_blank"
                  >
                    makercie.nl
                  </a>
                </li>
                <li>On-site and remote rover challenge experience</li>
                <li>Interdisciplinary engineering team structure</li>
              </ul>
            </article>

            <article className="card">
              <h3>Kiwi Aerospace CanSat Team</h3>
              <p>
                Kiwi Aerospace is a six-member engineering student team
                competing in the World CanSat Challenge 2026 in Mexico City,
                hosted by UNAM and PEU. The team designs, builds, and launches a
                2U model satellite with full end-to-end ownership across the
                mission lifecycle.
              </p>
              <ul className="card-list">
                <li>Real-time telemetry and environmental sensing payload</li>
                <li>
                  Custom autogyro controlled descent and safe egg recovery
                </li>
                <li>From design reviews to flight operations and analysis</li>
              </ul>
            </article>

            <article className="card">
              <h3>Coming Soon</h3>
              <p>New activity updates will be announced here soon.</p>
            </article>
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
