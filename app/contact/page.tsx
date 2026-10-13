import "./contact.css";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { COORDINATES } from "@/lib/location";
import { ContactKeyboard } from "./contact-keyboard";

export default function ContactPage() {
  return (
    <div className="site">
      <SiteHeader />

      <main className="contact">
        <div className="contact-head">
          <div>
            <p className="contact-label">Contact &amp; partners</p>
            <h1>
              Talk to
              <br />
              the board
            </h1>
          </div>
          <p>
            Interested in collaborating, sponsoring hardware or inviting us for
            a demo? Reach out to the GEARS board.
          </p>
        </div>

        <ContactKeyboard />

        <div className="contact-visit">
          <p>
            <span className="contact-label">Visit</span>
            Nijenborgh 4
            <br />
            9747 AG Groningen
          </p>
          <p>
            <span className="contact-label">Where</span>
            {COORDINATES}
            <br />
            Zernike campus
          </p>
          <p>
            <span className="contact-label">Registered</span>
            KVK 42017832
          </p>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
