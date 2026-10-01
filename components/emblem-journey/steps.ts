//text and photos for the homepage emblem journey, in scroll order.
//each step pulls one part of the emblem forward:
//  piece  - id of the part (see emblem-parts.json)
//  focus  - where the part goes in the 3D scene, so the camera can move there
//  photos - what's on the part's front: one photo, or three (big one first)

export interface Step {
  title: string;
  description: string;
  link: string; //text for `href`, says where the link goes
  href: string;
  piece: string;
  focus: [number, number];
  photos: string[];
}

export const STEPS: Step[] = [
  {
    title: "Challenge",
    description: "Start with an idea, a problem or a student challenge. Explore it through an interdisciplinary STEM project.",
    link: "About GEARS",
    href: "/about",
    piece: "support",
    focus: [-6, -4],
    photos: [
      "/journey/makercie-10.jpg",
      "/journey/makercie-09.jpg",
      "/journey/makercie-04.jpg",
    ],
  },
  {
    title: "Team",
    description:
      "Bring different skills together. GEARS helps with the paperwork so your team can focus on the project.",
    link: "Membership",
    href: "/membership",
    piece: "projects",
    focus: [-5, 5],
    photos: [
      "/journey/makercie-07.jpg",
      "/journey/makercie-11.jpg",
      "/journey/makercie-16.jpg",
    ],
  },
  {
    title: "Funding",
    description:
      "GEARS supports teams with seed-funding and connections to sponsors and organisations through its network.",
    link: "Seed fund rules (PDF)",
    href: "/fse-student-challenge-seed-fund.pdf",
    piece: "partners",
    focus: [5, 4],
    photos: [
      "/journey/makercie-02.jpg",
      "/journey/makercie-12.jpg",
      "/journey/makercie-13.jpg",
    ],
  },
  {
    title: "Learn",
    description:
      "Develop your skills together. Workshops and project reviews connect what you study with the challenges.",
    link: "What members get",
    href: "/about",
    piece: "competitions",
    focus: [6, -4],
    photos: [
      "/journey/makercie-08.jpg",
      "/journey/makercie-12.jpg",
      "/journey/makercie-00.jpg",
    ],
  },
  {
    title: "Build",
    description:
      "Put your ideas into practice. Work together on interdisciplinary projects and gain hands-on experience, through Research and Development.",
    link: "See the teams",
    href: "/activities#teams",
    piece: "learning",
    focus: [0, -7],
    photos: [
      "/journey/makercie-13.jpg",
      "/journey/makercie-00.jpg",
      "/journey/makercie-12.jpg",
    ],
  },
  {
    title: "Results",
    description:
      "Take your work into competitions and beyond. Gain practical experience, new skills and build meaningful connections along the way.",
    link: "makercie.nl",
    href: "https://makercie.nl/",
    piece: "community",
    focus: [9, 0],
    photos: ["/journey/makercie-14.jpg"],
  },
];

export const OPENING = {
  title: "From idea to competition,",
  description:
    "An association for students supporting STEM projects, teams and competitions.",
  cue: "Scroll to explore ↓",
};

export const CLOSING = {
  title: "Together,",
  description: "Helping student teams get started, learn together and build.",
  cue: "Keep scrolling ↓",
};
