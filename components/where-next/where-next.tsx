import "./where-next.css";
import Image from "next/image";
import Link from "next/link";
// import { MEMBERSHIP_BASE } from "@/lib/routes";

const CARDS = [
  {
    label: "Teams",
    title: "Join an existing team or start your own",
    href: "/activities",
    photo: "/journey/makercie-01.jpg",
    alt: "Teams",
    fill: "coral",
  },
  {
    label: "Events",
    title: "Workshops, socials and company visits",
    href: "/about",
    photo: "/journey/makercie-10.jpg",
    alt: "Events",
    fill: "dark",
  },
  {
    label: "Membership",
    title: "Become a member",
    href: "/membership",
    photo: "/journey/makercie-12.jpg",
    alt: "Membership",
    fill: "light",
  },
  {
    label: "Seed fund",
    title: "Apply for seed funding",
    href: "/fse-student-challenge-seed-fund.pdf",
    photo: "/journey/makercie-02.jpg",
    alt: "Seed fund",
    fill: "light",
  },
  {
    label: "Partners",
    title: "Work with us and our partners",
    href: "/contact",
    photo: "/journey/makercie-06.jpg",
    alt: "Partners",
    fill: "coral",
  },
  {
    label: "About",
    title: "Why GEARS exists",
    href: "/about",
    photo: "/journey/makercie-07.jpg",
    alt: "About",
    fill: "dark",
  },
];

export function WhereNext() {
  return (
    <section aria-labelledby="where-next-title" className="where-next">
      <div className="where-next-head">
        <h2 id="where-next-title">
          <span>Where to</span> next
        </h2>
      </div>

      <div className="where-next-grid">
        {CARDS.map((card) => (
          <Link
            className="where-next-card"
            data-fill={card.fill}
            href={card.href}
            key={card.label}
          >
            <Image
              alt={card.alt}
              height={260}
              sizes="(max-width: 768px) 100vw, 33vw"
              src={card.photo}
              width={400}
            />
            <span className="where-next-body">
              <span className="where-next-label">{card.label}</span>
              <span className="where-next-title">{card.title}</span>
              <span aria-hidden="true" className="where-next-arrow">
                →
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
