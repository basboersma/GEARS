import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Tonight } from "./tonight";

export default function AboutPage() {
  return (
    <div className="site">
      <SiteHeader />
      <Tonight />
      <SiteFooter />
    </div>
  );
}
