/** Motion values for the research-area slides (spec 4.3). Springs use Apple's two numbers: response, damping ratio. */
export const SLIDES = {
  response: 0.5, // seconds, roughly the time to arrive
  damping: 1, // tabs, arrows and keys: arrive without overshoot
  flickDamping: 0.86, // after a flick the hand gave the slide momentum, so a little overshoot reads as physical
  fanResponse: 0.3,
  flick: 0.11, // px per ms in the drag direction
  dragMax: 160, // or a drag past min(160px, 20% of the travel)
  dragShare: 0.2,
  step: 18, // px between pile levels; 8 on phones
  stepPhone: 8,
  shrink: 0.035, // per pile level
  wash: 0.5,
  fan: 1.6, // hovering the pile with a mouse spreads it
  wheelPage: 40, // px of sideways trackpad travel before a swipe pages
  wheelIdle: 160, // ms of quiet that ends a trackpad swipe
} as const;

export type Pose = { x: number; scale: number; shade: number; opacity: number };

/**
 * Where a slide sits, from its distance to the current position: `d = index − pos`. Ahead (d > 0) it waits
 * `travel` px to the right per step; behind, it joins the pile just left of the stage.
 */
export function pose(
  d: number,
  o: { travel: number; step: number; fan: number; pulledPastEnd: boolean },
): Pose {
  if (d >= 0 || o.pulledPastEnd) return { x: d * o.travel, scale: 1, shade: 0, opacity: 1 };
  const level = Math.min(-d, 3);
  return {
    x: -level * o.step * o.fan,
    scale: 1 - level * SLIDES.shrink,
    shade: Math.min(-d, 1) * SLIDES.wash,
    opacity: Math.min(1, Math.max(0, 4 + d)), // the fourth level down fades away
  };
}

/** Apple's rubber band: past either end the stage follows less and less the further it is pulled. */
const band = (over: number, dim: number) => (over * dim * 0.55) / (dim + 0.55 * over);

export function rubber(p: number, count: number, travel: number): number {
  const dim = travel / 2;
  if (p < 0) return -band(-p * travel, dim) / travel;
  if (p > count - 1) return count - 1 + band((p - count + 1) * travel, dim) / travel;
  return p;
}

/** Where a drag lands: a flick or a long enough drag moves one slide; anything less springs back. */
export function snapTarget(g: { from: number; dx: number; vx: number; travel: number; count: number }): number {
  const flick = Math.abs(g.vx) > SLIDES.flick && Math.sign(g.vx) === Math.sign(g.dx);
  const far = Math.abs(g.dx) > Math.min(SLIDES.dragMax, g.travel * SLIDES.dragShare);
  const to = flick || far ? g.from - Math.sign(g.dx) : g.from;
  return Math.min(g.count - 1, Math.max(0, to));
}

/** Response (seconds) and damping ratio → spring stiffness k and friction c. */
export function springOf(response: number, damping: number): { k: number; c: number } {
  const w = (2 * Math.PI) / response;
  return { k: w * w, c: 2 * damping * w };
}

/** A sideways trackpad swipe pages one slide once it has clearly started: −1, 0 or +1. */
export function wheelPage(sum: number): -1 | 0 | 1 {
  if (Math.abs(sum) < SLIDES.wheelPage) return 0;
  return sum > 0 ? 1 : -1;
}
