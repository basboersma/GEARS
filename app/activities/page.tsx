import "./activities.css";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { PixelPhoto } from "./pixel-photo";
import { TeamsYard } from "./teams-yard";

export default function ActivitiesPage() {
  return (
    <div className="site">
      <SiteHeader />

      <main className="teams">
        <section className="teams-top" id="teams">
          <div className="teams-head">
            <h1>
              Visit the teams <span>on the Mars Yard</span>
            </h1>
            <p className="teams-label">Roll to pick a team</p>
          </div>

          <TeamsYard />
        </section>

        <section className="mars-yard">
          <PixelPhoto
            alt="A rover on the Mars Yard"
            className="mars-yard-photo"
            sizes="(max-width: 768px) 100vw, 66vw"
            src="/journey/makercie-05.jpg"
          />
          <div className="mars-yard-text">
            <div>
              <p className="teams-label">Dedicated testing area for teams</p>
              <h2>The Mars Yard</h2>
            </div>
            <dl>
              <div>
                <dt className="teams-label">Area</dt>
                <dd>About 71 m²</dd>
              </div>
              <div>
                <dt className="teams-label">Opened</dt>
                <dd>1 December 2023</dd>
              </div>
              <div>
                <dt className="teams-label">Where</dt>
                <dd>Winter Garden, Energy Academy</dd>
              </div>
            </dl>
            <p>
              Martian terrain for teams to test on. The Mars Yard is open for the public, so anyone can come and see!
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
