import "../legal.css";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function TermsPage() {
  return (
    <div className="site">
      <SiteHeader />
      <main className="legal">
        <div className="legal-inner">
          <h1>Terms and Conditions for Membership</h1>
          <p className="legal-updated">Last updated: 29 September 2026</p>

          <p>
            These terms apply to membership of GEARS (Groningen Engineering and Robotics Study
            association), registered with the Dutch Chamber of Commerce under KVK 42017832. By
            becoming a member you agree to these terms.
          </p>

          <h2>Membership</h2>
          <p>
            Membership is open to students who are interested in robotics, engineering, and
            innovation. You become a member once we have processed your registration and received
            your first payment. Membership is personal and cannot be transferred to someone else.
          </p>

          <h2>Fees</h2>
          <p>
            Membership costs 10 euro per year. As a launch offer, the first 25 members pay 2.50 euro
            for their first year, after which the normal fee of 10 euro per year applies.
          </p>

          <h2>Payment and SEPA mandate</h2>
          <p>
            You pay by SEPA direct debit from the account you provide. By joining and giving us your
            IBAN, you authorise GEARS to collect the membership fee from your account by SEPA direct
            debit, and you authorise your bank to make these payments. If you do not agree with a
            payment, you can ask your bank for a refund under the conditions of your agreement with
            them, normally within eight weeks of the date it was debited.
          </p>

          <h2>Duration and renewal</h2>
          <p>
            Membership runs for one year and renews automatically for another year unless you
            cancel. We will let you know before a renewal payment is taken.
          </p>

          <h2>Cancellation</h2>
          <p>
            You can cancel your membership by emailing{" "}
            <a href="mailto:board@gearsnl.org">board@gearsnl.org</a>. Cancellation takes effect at
            the end of your current membership year. Fees already paid are not refunded, except
            where the law requires it.
          </p>

          <h2>Conduct</h2>
          <p>
            As a member you follow our code of conduct and treat other members, staff, and partners
            with respect. We may suspend or end a membership if these terms or the code of conduct
            are seriously or repeatedly broken.
          </p>

          <h2>Liability</h2>
          <p>
            GEARS organises its activities with care, but we cannot accept liability for damage or
            loss, except where it is caused by our intent or gross negligence, or where the law does
            not allow us to limit our liability. You take part in activities at your own
            responsibility.
          </p>

          <h2>Changes to these terms</h2>
          <p>
            We may change these terms. We will post the new version here and, for important changes,
            let members know. If you do not agree with a change, you can cancel your membership.
          </p>

          <h2>Governing law</h2>
          <p>
            Dutch law applies to these terms and to your membership. Any dispute will be brought
            before the competent court in the Netherlands.
          </p>

          <h2>Contact</h2>
          <p>
            GEARS, Nijenborgh 4, 9747 AG Groningen. Email{" "}
            <a href="mailto:board@gearsnl.org">board@gearsnl.org</a>.
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
