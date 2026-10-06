import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function ContactPage() {
  return (
    <div className="site">
      <SiteHeader />

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

      <SiteFooter />
    </div>
  );
}
