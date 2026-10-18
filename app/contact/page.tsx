import "./contact.css";
import Image from "next/image";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ContactGear } from "./contact-gear";

//sky: x and y in %, size in px
const SKY = [
  { src: "star", x: 6, y: 18, size: 4 },
  { src: "star", x: 14, y: 62, size: 4 },
  { src: "star-coral", x: 22, y: 30, size: 4 },
  { src: "star", x: 31, y: 78, size: 4 },
  { src: "star", x: 38, y: 12, size: 4 },
  { src: "star-coral", x: 47, y: 55, size: 4 },
  { src: "star", x: 58, y: 22, size: 4 },
  { src: "star", x: 66, y: 70, size: 4 },
  { src: "star-coral", x: 74, y: 40, size: 4 },
  { src: "star", x: 83, y: 15, size: 4 },
  { src: "star", x: 91, y: 58, size: 4 },
  { src: "star-coral", x: 96, y: 30, size: 4 },
  { src: "gear-rust", x: 8, y: 34, size: 28 },
  { src: "gear-rust", x: 18, y: 74, size: 44 },
  { src: "gear-grey", x: 72, y: 82, size: 24 },
  { src: "gear-grey", x: 88, y: 26, size: 34 },
];

export default function ContactPage() {
  return (
    <div className="site">
      <SiteHeader />

      <main className="contact">
        <div className="contact-space">
          {SKY.map((item) => (
            <Image
              alt=""
              className="contact-sky"
              height={item.size}
              key={`${item.x}-${item.y}`}
              src={`/contact/${item.src}.svg`}
              style={{ left: `${item.x}%`, top: `${item.y}%` }}
              width={item.size}
            />
          ))}
          <p className="label">Contact</p>
          <h1>
            Talk to <span>the board</span>
          </h1>
          {/*a letter on its way down*/}
          <Image
            alt=""
            className="contact-chute"
            height={80}
            src="/contact/chute.svg"
            width={60}
          />
        </div>

        <div className="contact-dusk">
          <p>Interested in collaborating, sponsoring or just curious?</p>
          <p>Spin the gear to pick the right person.</p>
        </div>

        <ContactGear />
      </main>

      <SiteFooter />
    </div>
  );
}
