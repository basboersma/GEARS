export function SiteFooter() {
  return (
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
          <a href="/termsandconditions.html">Terms and Conditions for Membership</a>
        </span>
      </div>
    </footer>
  );
}
