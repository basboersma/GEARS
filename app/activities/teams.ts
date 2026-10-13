export interface Team {
  id: string;
  name: string;
  short: string; //label on phones
  kind: string;
  spot: number; //0 left, 1 right
  text: string;
  bullets: string[];
  photo?: { src: string; alt: string };
  link?: { label: string; href: string };
}

export const TEAMS: Team[] = [
  {
    id: "makercie",
    name: "Makercie",
    short: "Makercie",
    kind: "European Rover Challenge team",
    spot: 0.22,
    text: "Makercie is a student rover team focused on space exploration and challenge-based engineering. Founded in 2023, the team has grown into an interdisciplinary group from the University of Groningen and Hanze, and won the Remote Formula of the European Rover Challenge.",
    bullets: [
      "Challenge: On-site and remote rover challenge",
      "Team: Interdisciplinary team, with students from the University of Groningen and Hanze",
      "Results: Won the Remote European Rover Challenge, in 2023",
    ],
    photo: {
      src: "/journey/makercie-07.jpg",
      alt: "",
    },
    link: { label: "makercie.nl", href: "https://makercie.nl/" },
  },
  {
    id: "kiwi",
    name: "Kiwi Aerospace",
    short: "Kiwi",
    kind: "CanSat team",
    spot: 0.56,
    text: "Kiwi Aerospace is a student team from the University of Groningen and the Hanze University of Applied Sciences. Their mini-satellite KSAT1 took them to the international CanSat finals in Mexico City, where they finished in the global top 10. Twenty teams made it to the finals on 24 May 2026 at UNAM. Counting the European preliminary round, the team faced as many as 137 teams.",
    bullets: [
      "Challenge: KSAT1, a mini-satellite no bigger than a milk carton, launched from 400 metres",
      "Team: Interdisciplinary team with students from the University of Groningen and Hanze",
      "Results: Achieved global top 10 at the international CanSat finals in Mexico City, in 2026",
    ],
    photo: {
      src: "/journey/kiwi-mexico.jpg",
      alt: "",
    },
  },
  {
    id: "start",
    name: "Your team?",
    short: "You?",
    kind: "Start your own team",
    spot: 0.86,
    text: "Come up with a competition idea! GEARS will help you get started and offer your team a seed funding of up to €8000. We are here to help you bring your idea to life. Get in touch with us to learn more!",
    bullets: [],
    link: {
      label: "Seed fund rules",
      href: "/fse-student-challenge-seed-fund.pdf",
    },
  },
];
