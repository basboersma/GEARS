import EMBLEM_PARTS from "@/components/emblem-journey/emblem-parts.json";
import { TEAMS } from "./teams";
import { SPRITES } from "./yard-sprites";

export const ROWS = 64; //yard height in pixels
export const GEAR = 30; //emblem size in pixels
const FLOOR = 0.74; //where the sand starts

//winter garden colours
const YARD = {
  steel: "#5e3f30",
  glass: "#dcebf3",
  office: "#aebfcc",
  window: "#8ea3b3",
  leaf: "#6f8f4e",
  leafDark: "#4f6e3a",
  edge: "#d6d2cc",
  sand: "#c9765c",
  sandLight: "#dd9a80",
  sandDark: "#a85b45",
  gravel: "#b5aea6",
  gravelDark: "#8f8880",
};

//speed of the gear, in pixels per frame
const PROPS: Record<string, [keyof typeof SPRITES, number, number][]> = {
  makercie: [
    ["rover", 13, -14],
    ["flag", 36, -12],
  ],
  kiwi: [["pad", -4, -7]],
  start: [["sign", -4, -11]],
};

//colours for the emblem and the props
const ink: Record<string, string> = { o: "#c4553d", s: "#c9c3bc", w: "#fff" };

function box(
  ctx: CanvasRenderingContext2D,
  colour: string,
  x: number,
  y: number,
  w: number,
  h: number
) {
  ctx.fillStyle = colour;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function sprite(
  ctx: CanvasRenderingContext2D,
  name: keyof typeof SPRITES,
  x: number,
  y: number
) {
  SPRITES[name].forEach((row, dy) => {
    for (let dx = 0; dx < row.length; dx++) {
      if (row[dx] !== ".") {
        box(ctx, ink[row[dx]], x + dx, y + dy, 1, 1);
      }
    }
  });
}

//a row of trees behind the glass
function paintTrees(
  ctx: CanvasRenderingContext2D,
  width: number,
  back: number,
  random: () => number
) {
  for (let i = 0; i < 8; i++) {
    const x = ((i + 0.3 + random() * 0.5) * width) / 8;
    const top = 10 + random() * 10;
    box(ctx, YARD.steel, x, top + 6, 1, back - top - 4);
    for (let leaf = 0; leaf < 40; leaf++) {
      const angle = random() * Math.PI * 2;
      const reach = random() * 6;
      const colour = random() < 0.4 ? YARD.leafDark : YARD.leaf;
      box(
        ctx,
        colour,
        x + Math.cos(angle) * reach * 1.2,
        top + 4 + Math.sin(angle) * reach,
        2,
        2
      );
    }
  }
}

//static part, painted once per size
export function paintBackdrop(width: number, height: number) {
  const css = getComputedStyle(document.documentElement);
  ink.k = css.getPropertyValue("--gears-ink").trim();
  ink.c = css.getPropertyValue("--gears-coral").trim();

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return canvas;
  }
  //same rocks every redraw
  let seed = 7;
  const random = () => {
    seed = (seed * 16_807) % 2_147_483_647;
    return seed / 2_147_483_647;
  };
  const ground = Math.round(height * FLOOR);
  const back = ground - 14;

  //glass wall, building behind, steel grid
  box(ctx, YARD.glass, 0, 0, width, back);
  box(ctx, YARD.office, width * 0.12, 8, width * 0.7, back - 8);
  for (let y = 11; y < back; y += 4) {
    box(ctx, YARD.window, width * 0.12, y, width * 0.7, 1);
  }
  for (let x = 2; x < width; x += 13) {
    box(ctx, YARD.steel, x, 0, 1, back);
  }
  for (const y of [5, 17, back - 1]) {
    box(ctx, YARD.steel, 0, y, width, 1);
  }

  paintTrees(ctx, width, back, random);

  //sand, gravel heap, rocks
  box(ctx, YARD.edge, 0, back, width, 3);
  box(ctx, YARD.sand, 0, back + 3, width, height - back);
  for (let i = 0; i < width; i++) {
    const colour = random() < 0.5 ? YARD.sandLight : YARD.sandDark;
    box(
      ctx,
      colour,
      random() * width,
      back + 4 + random() * (height - back),
      1,
      1
    );
  }
  for (let x = 0; x < width * 0.2; x++) {
    const top = back - 6 + (x / (width * 0.2)) ** 1.6 * 12 + Math.sin(x / 2.3);
    for (let y = Math.round(top); y < ground + 2; y++) {
      box(ctx, random() < 0.25 ? YARD.gravelDark : YARD.gravel, x, y, 1, 1);
    }
  }
  for (let i = 0; i < 10; i++) {
    box(
      ctx,
      ink.s,
      width * (0.22 + random() * 0.78),
      ground + 2 + random() * (height - ground - 4),
      2,
      2
    );
  }

  for (const team of TEAMS) {
    for (const [name, dx, dy] of PROPS[team.id] ?? []) {
      sprite(ctx, name, team.spot * width + dx, ground + dy);
    }
  }
  return canvas;
}

const kiwi = TEAMS.find((team) => team.id === "kiwi");

//backdrop, the cansat falling over kiwi, the gear on top
export function paintFrame(
  ctx: CanvasRenderingContext2D,
  backdrop: HTMLCanvasElement,
  time: number,
  x: number,
  angle: number
) {
  const { width, height } = ctx.canvas;
  const ground = Math.round(height * FLOOR);
  ctx.drawImage(backdrop, 0, 0);
  if (kiwi) {
    sprite(
      ctx,
      "cansat",
      kiwi.spot * width + 6,
      2 + ((time / 140) % (ground - 18))
    );
  }
  ctx.drawImage(
    paintGear(angle),
    Math.round(x * width - GEAR / 2),
    ground + 7 - GEAR
  );
}

let gear: HTMLCanvasElement | null = null;

//the emblem in coral with an ink outline
function paintGear(angle: number) {
  gear ??= document.createElement("canvas");
  gear.width = GEAR;
  gear.height = GEAR;
  const ctx = gear.getContext("2d");
  if (!ctx) {
    return gear;
  }
  ctx.translate(GEAR / 2, GEAR / 2);
  ctx.rotate(angle);
  ctx.scale(GEAR / 8.2, -GEAR / 8.2); //flip y
  ctx.fillStyle = ink.c;
  for (const { center, outline, holes } of EMBLEM_PARTS) {
    ctx.beginPath();
    for (const ring of [outline, ...holes]) {
      for (const [x, y] of ring) {
        ctx.lineTo(center[0] + x, center[1] + y);
      }
      ctx.closePath();
    }
    ctx.fill("evenodd");
  }

  //hard edges, then the empty pixels around it in ink
  const image = ctx.getImageData(0, 0, GEAR, GEAR);
  const solid = (x: number, y: number) =>
    x >= 0 &&
    y >= 0 &&
    x < GEAR &&
    y < GEAR &&
    image.data[(y * GEAR + x) * 4 + 3] > 110;
  const edge: number[][] = [];
  for (let y = 0; y < GEAR; y++) {
    for (let x = 0; x < GEAR; x++) {
      const near =
        solid(x - 1, y) ||
        solid(x + 1, y) ||
        solid(x, y - 1) ||
        solid(x, y + 1);
      if (!solid(x, y) && near) {
        edge.push([x, y]);
      }
    }
  }
  for (let i = 3; i < image.data.length; i += 4) {
    image.data[i] = image.data[i] > 110 ? 255 : 0;
  }
  ctx.putImageData(image, 0, 0);
  ctx.resetTransform();
  for (const [x, y] of edge) {
    box(ctx, ink.k, x, y, 1, 1);
  }
  return gear;
}
