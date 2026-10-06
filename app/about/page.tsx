import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function AboutPage() {
  return (
    <div className="site">
      <SiteHeader />

      <main>
        <section className="section section-alt" id="about">
          <div className="section-header">
            <h2>About GEARS</h2>
            <p>
              GEARS is a student-led STEM association that provides
              opportunities for challenge-based learning through
              interdisciplinary projects, competitions, workshops, and industry
              collaborations. Our mission is to help students develop practical
              skills, gain real world experience, and build meaningful
              connections while working on innovative solutions to technical and
              societal changes.
            </p>
            <br />
            <h2>What We Do</h2>
            <p>GEARS supports students by:</p>
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
            <p>
              Bureaucracy is the most time-consuming part of starting a new
              team. Our mission is to facilitate the formation and growth of
              teams competing in student challenges by allowing teams to focus
              on the quality of the R&amp;D.
            </p>
          </div>

          <div className="grid-3 grid">
            <article className="card">
              <h3>Team Perks</h3>
              <p>
                Facilitated bureaucracy process for new and established teams.
              </p>
            </article>
            <article className="card">
              <h3>Social</h3>
              <p>
                Meet like-minded students at our monthly socials, game nights
                and informal project evenings in the GEARS room.
              </p>
            </article>
            <article className="card">
              <h3>Study</h3>
              <p>
                Get support with hard courses through workshops, project reviews
                and peer-to-peer tutoring in robotics-related topics.
              </p>
            </article>
            <article className="card">
              <h3>Career</h3>
              <p>
                Explore future paths through company visits, tech talks and
                networking events with our industrial partners.
              </p>
            </article>
          </div>

          <br />

          <div className="section-header">
            <h2>GEARS Organisational Objectives</h2>
            <p>
              The aim of the association is to offer students a platform through
              which they can participate in and are stimulated to engage in
              challenge-based learning, by allowing members to participate in
              various committees corresponding to various STEM projects and
              competitions where they can gain experience and learn to work
              together in a diverse, international environment.
            </p>
            <br />
            <h3>Objectives</h3>
            <ul>
              <li>
                Providing committees with seed-funding to enable them to enter
                the corresponding competition or project
              </li>
              <li>
                Providing committees with contact with various sponsors and
                organisations through its network
              </li>
              <li>Maintain a website and various social media</li>
              <li>
                Organise events aimed at connecting its members and university
                students.
              </li>
            </ul>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
