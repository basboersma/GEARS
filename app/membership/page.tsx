import "./membership.css";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { JOIN_URL } from "@/lib/routes";
import { SpinningEmblem } from "./components/SpinningEmblem";
import { CONTACT_EMAIL, MEMBERSHIP } from "./data";

export default function MembershipPage() {
  return (
    <div className="mv-root">
      <SiteHeader />

      <main className="mv-wrap mv-page">
        <section className="mv-hero">
          <div>
            <h1 className="mv-title">Become a member</h1>
            <div className="mv-lede">
              <p>
                Membership is open to all students interested in robotics, engineering, and
                innovation. Join to build, compete, collaborate, and shape the future of GEARS
                together.
              </p>
              <ul className="mv-list">
                <li>Apply to join one of our active competition teams</li>
                <li>Support the association through communication, events, outreach, and operations</li>
                <li>Access build sessions, labs, and project evenings, open to members</li>
                <li>Priority access to workshops, company visits, and GEARS events</li>
              </ul>
              <p>
                <b>Membership is {MEMBERSHIP.price} for the {MEMBERSHIP.period}</b>, and the first{" "}
                {MEMBERSHIP.launchSpots} members pay just {MEMBERSHIP.launchPrice}.
              </p>
              <p className="mv-note">
                After you sign up, we&apos;ll contact you by email with the next steps and payment
                details.
              </p>
            </div>
          </div>

          <SpinningEmblem />
        </section>

        <section className="mv-ready">
          <div className="mv-ready-bar" />
          <div className="mv-ready-body">
            <h2>Ready to join GEARS?</h2>
            <p>
              Join a growing community of student builders with access to competition teams,
              exclusive build nights, workshops and direct connections to industry.
            </p>
            <a
              className="mv-btn mv-btn-primary mv-btn-lg"
              href={JOIN_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Become a member
            </a>
            <p className="mv-q">
              Questions? <a href={`mailto:${CONTACT_EMAIL}`}>Email us</a>.
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
