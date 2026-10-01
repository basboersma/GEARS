import "../legal.css";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function PrivacyPolicyPage() {
  return (
    <div className="site">
      <SiteHeader />
      <main className="legal">
        <div className="legal-inner">
          <h1>Privacy Policy</h1>
          <p className="legal-updated">Last updated: 29 September 2026</p>

          <p>
            GEARS (Groningen Engineering and Robotics Study association) is responsible for the
            personal data we process about our members and the people who contact us. This policy
            explains what we collect, why we collect it, and what rights you have. GEARS is
            registered with the Dutch Chamber of Commerce under KVK 42017832, at Nijenborgh 4,
            9747 AG Groningen. For any privacy question, email{" "}
            <a href="mailto:board@gearsnl.org">board@gearsnl.org</a>.
          </p>

          <h2>What we collect</h2>
          <ul>
            <li>
              Membership details: first name, any infix, last name, gender, date of birth, email,
              phone number, address, student number, study programme, study phase, and expected
              graduation year.
            </li>
            <li>
              Payment details: your IBAN and, where you provide it, your BIC, used to collect the
              yearly membership fee by SEPA direct debit.
            </li>
            <li>
              Account details: when you sign in with Google, Microsoft, or SURFconext, we receive
              your name and email from that provider to create and secure your account.
            </li>
            <li>Communication: the messages you send us and your newsletter preference.</li>
          </ul>

          <h2>Why we use your data</h2>
          <ul>
            <li>To run your membership and give you access to teams, events, and facilities. Legal basis: our membership agreement.</li>
            <li>To collect the membership fee. Legal basis: our membership agreement and your SEPA mandate.</li>
            <li>To send you the newsletter and association updates. Legal basis: your consent, which you can withdraw at any time.</li>
            <li>To keep the association running, improve our activities, and keep our systems secure. Legal basis: our legitimate interest.</li>
            <li>To meet legal and financial obligations, such as keeping accounting records. Legal basis: a legal obligation.</li>
          </ul>

          <h2>Who we share it with</h2>
          <p>
            We do not sell your data. We share it only with the service providers that help us run
            GEARS, and only as far as they need it: SURFconext, Google, and Microsoft for sign-in,
            our email provider for account and newsletter emails, and our hosting and infrastructure
            provider. While membership sign-up runs through Google Forms, your form answers are also
            processed by Google. These providers act on our behalf under agreements that require
            them to protect your data. We may also share data where the law requires it.
          </p>

          <h2>How long we keep it</h2>
          <p>
            We keep your membership data for as long as you are a member and for a reasonable period
            afterwards. Financial records are kept for seven years, as Dutch law requires. After
            these periods we delete or anonymise your data.
          </p>

          <h2>How we protect it</h2>
          <p>
            We use appropriate technical and organisational measures to protect your data, including
            access controls and secure sign-in. No system is perfectly secure, so if you notice a
            problem, please tell us.
          </p>

          <h2>Your rights</h2>
          <p>
            You can ask us to give you a copy of your data, correct it, delete it, restrict how we
            use it, or hand it over to another organisation. You can also object to certain uses and
            withdraw any consent you gave. To use any of these rights, email{" "}
            <a href="mailto:board@gearsnl.org">board@gearsnl.org</a>. You also have the right to
            lodge a complaint with the Dutch Data Protection Authority,{" "}
            <a href="https://www.autoriteitpersoonsgegevens.nl" target="_blank" rel="noopener noreferrer">
              Autoriteit Persoonsgegevens
            </a>
            .
          </p>

          <h2>Cookies</h2>
          <p>
            We use only the cookies needed to keep you signed in and to keep the site working. We do
            not use them to track you across other websites.
          </p>

          <h2>Changes to this policy</h2>
          <p>
            We may update this policy. We will post the new version here and change the date above.
            For significant changes we will let members know.
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
