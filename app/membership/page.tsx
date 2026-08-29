import Link from "next/link";

export default function MembershipPage() {
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
        <section className="section" id="membership">
          <div className="membership">
            <div className="membership-info">
              <div className="membership-heading">
                <h2>Become a member</h2>
                <p>
                  Membership is open to all students interested in robotics,
                  engineering, and innovation. Join to build, compete,
                  collaborate, and shape the future of GEARS together.
                </p>
              </div>
              <ul>
                <li>Apply to join one of our active competition teams</li>
                <li>
                  Support the association through communication, events,
                  outreach, and operations
                </li>
                <li>
                  Access member-only build sessions, labs, and project evenings
                </li>
                <li>
                  Priority access to workshops, company visits, and GEARS events
                </li>
              </ul>
              <p className="membership-note">
                For now, membership registration is handled via Google Forms.
                After you sign up, we will contact you by email with the next
                steps and payment details.
              </p>
            </div>

            <div className="membership-actions">
              <div className="membership-pricing-card">
                <span className="membership-price-badge">
                  Limited launch offer
                </span>
                <span className="membership-price-highlight">
                  First 25 members: only €2.50
                </span>
                <span className="membership-price">Then €10 per year</span>
                <Link className="btn btn-primary membership-btn" href="/login">
                  Fill in membership form
                </Link>
              </div>
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
