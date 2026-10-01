import { STEPS } from "./steps";

//the whole journey runs on one number, `time`, taken from how far you scrolled.
//it goes from 0 to STEPS.length + 1, one unit per stage:
//  stage -1           the full emblem (opening)
//  stage 0..last step one part pulled forward
//  stage STEPS.length the emblem back in one piece (closing)
//each unit starts with a short move into the next stage, then holds still
//for the rest so there's time to read the text.

export const OPENING_STAGE = -1;
export const CLOSING_STAGE = STEPS.length;
export const TIMELINE_LENGTH = STEPS.length + 1;

const TRANSITION_START = 0.25;
const TRANSITION_LENGTH = 0.4;

//the text switches a bit before the move is done
const TEXT_SWITCH_POINT = 0.35;

export interface Moment {
  from: number;
  to: number;
  mix: number; //0 = fully at `from`, 1 = fully at `to`
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

//eases in and out so moves don't start or stop with a jerk
const smoothstep = (x: number) => x * x * (3 - 2 * x);

export function timeFromScroll(scrolled: number, scrollable: number): number {
  return clamp(
    (scrolled / Math.max(1, scrollable)) * TIMELINE_LENGTH,
    0,
    TIMELINE_LENGTH
  );
}

export function momentAt(time: number): Moment {
  const to = clamp(
    Math.floor(time - TRANSITION_START),
    OPENING_STAGE,
    CLOSING_STAGE
  );
  const from = Math.max(OPENING_STAGE, to - 1);
  const progress = clamp(
    (time - to - TRANSITION_START) / TRANSITION_LENGTH,
    0,
    1
  );

  return { from, to, mix: smoothstep(progress) };
}

export function stageAt(time: number): number {
  const { from, to, mix } = momentAt(time);
  return mix < TEXT_SWITCH_POINT ? from : to;
}
