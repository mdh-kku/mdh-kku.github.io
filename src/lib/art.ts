import type { Art } from './schemas';

/** Seeded random numbers (mulberry32), so a slide's picture comes out the same on every build. */
function seeded(seed: number): () => number {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const f = (v: number) => v.toFixed(1);

// Pictures drawn from data-like marks, never an illustration or a photo. Parts with class `anim` play
// (ResearchAreas.astro holds their keyframes) until real, consented footage replaces them.
const ART: Record<Art, (c: string, r: () => number) => string> = {
  // A voice: bars that rise and fall like speech.
  wave(c, r) {
    let s = '';
    for (let i = 0; i < 44; i++) {
      const x = 24 + i * (332 / 43);
      const env = Math.sin((Math.PI * i) / 43);
      const h = 10 + env * (50 + r() * 90);
      s += `<line class="anim talk" style="animation-duration:${(1.1 + r() * 0.9).toFixed(2)}s;animation-delay:-${(r() * 2).toFixed(2)}s" x1="${f(x)}" y1="${f(110 - h / 2)}" x2="${f(x)}" y2="${f(110 + h / 2)}" stroke="${c}" stroke-width="3.4" stroke-linecap="round" opacity="${(0.3 + env * 0.7).toFixed(2)}"/>`;
    }
    return s;
  },
  // Filtration: lines that drift like flow.
  flow(c, r) {
    let s = '';
    for (let k = 0; k < 9; k++) {
      const y = 30 + k * 20;
      const a = 24 + r() * 36;
      const b = 24 + r() * 36;
      s += `<path d="M-10 ${y} C 110 ${f(y - a)}, 250 ${f(y + b)}, 390 ${f(y - 12 + r() * 24)}" fill="none" stroke="${c}" stroke-width="${k === 4 ? 3 : 1.8}" opacity="${(0.25 + k * 0.08).toFixed(2)}"/>`;
    }
    return `<g class="anim drift">${s}</g>`;
  },
  // A tissue slide: some cells get picked out, the way a model flags them.
  cells(c, r) {
    const pts: [number, number, number][] = [];
    for (let t = 0; t < 500 && pts.length < 34; t++) {
      const x = 18 + r() * 344;
      const y = 18 + r() * 184;
      const rad = 9 + r() * 9;
      if (pts.every((p) => Math.hypot(p[0] - x, p[1] - y) > p[2] + rad + 4)) pts.push([x, y, rad]);
    }
    return pts
      .map(
        ([x, y, rad], i) =>
          `<circle cx="${f(x)}" cy="${f(y)}" r="${f(rad)}" fill="${c}" fill-opacity=".13" stroke="${c}" stroke-opacity=".38"/>` +
          `<circle cx="${f(x + rad * 0.2)}" cy="${f(y - rad * 0.1)}" r="${f(rad * 0.38)}" fill="${c}" fill-opacity=".72"/>` +
          (i % 8 === 3
            ? `<circle class="anim detect" style="animation-delay:-${(i * 0.37).toFixed(2)}s" cx="${f(x)}" cy="${f(y)}" r="${f(rad + 6)}" fill="none" stroke="${c}" stroke-width="1.6" stroke-dasharray="3 3"/>`
            : ''),
      )
      .join('');
  },
  // A model's decision line, with points on either side.
  scatter(c, r) {
    let s = `<path class="anim march" d="M10 200 C 120 170, 170 70, 370 28" fill="none" stroke="${c}" stroke-width="2.4" stroke-dasharray="6 6"/>`;
    for (let k = 0; k < 64; k++) {
      const x = 16 + r() * 348;
      const y = 14 + r() * 192;
      const above = y < 196 - (x - 10) * 0.46 - Math.sin(x / 60) * 14;
      s += above
        ? `<circle${k % 9 === 0 ? ` class="anim blink" style="animation-delay:-${(k * 0.29).toFixed(2)}s"` : ''} cx="${f(x)}" cy="${f(y)}" r="4" fill="${c}"/>`
        : `<circle cx="${f(x)}" cy="${f(y)}" r="4" fill="none" stroke="${c}" stroke-opacity=".55" stroke-width="1.6"/>`;
    }
    return s;
  },
  // A cell seen from above: particles slowly orbit.
  rings(c, r) {
    let s = '';
    let dots = '';
    for (let k = 1; k <= 6; k++) {
      s += `<circle cx="190" cy="110" r="${k * 16}" fill="none" stroke="${c}" stroke-opacity="${(0.12 + (6 - k) * 0.1).toFixed(2)}" stroke-width="${k === 2 ? 3 : 1.5}"/>`;
    }
    for (let k = 0; k < 28; k++) {
      const a = r() * Math.PI * 2;
      const d = 20 + r() * 90;
      dots += `<circle cx="${f(190 + Math.cos(a) * d)}" cy="${f(110 + Math.sin(a) * d * 0.9)}" r="${f(1.5 + r() * 2.5)}" fill="${c}" fill-opacity="${(0.35 + r() * 0.5).toFixed(2)}"/>`;
    }
    return `${s}<g class="anim orbit">${dots}</g>`;
  },
  // Molecules: a signal runs along the bonds while one candidate pulses.
  hexes(c) {
    const centers = [[70, 70], [140, 112], [212, 70], [284, 112], [182, 176], [60, 166], [330, 48]];
    const ring = (cx: number, cy: number, R: number, on: boolean) => {
      const v: [number, number][] = [];
      for (let k = 0; k < 6; k++) {
        const a = (Math.PI / 3) * k + Math.PI / 6;
        v.push([cx + R * Math.cos(a), cy + R * Math.sin(a)]);
      }
      const d = `M${v.map((p) => `${f(p[0])} ${f(p[1])}`).join('L')}Z`;
      const g =
        `<path d="${d}" fill="${on ? c : 'none'}" fill-opacity=".18" stroke="${c}" stroke-width="2"/>` +
        v.map((p) => `<circle cx="${f(p[0])}" cy="${f(p[1])}" r="3.2" fill="${c}"/>`).join('');
      return on ? `<g class="anim pulse">${g}</g>` : g;
    };
    let s = '';
    for (let k = 0; k < centers.length - 1; k++) {
      s += `<line class="anim march" x1="${centers[k][0]}" y1="${centers[k][1]}" x2="${centers[k + 1][0]}" y2="${centers[k + 1][1]}" stroke="${c}" stroke-opacity=".28" stroke-width="2" stroke-dasharray="2 5"/>`;
    }
    return s + centers.map(([x, y], k) => ring(x, y, 20 + (k % 3) * 4, k === 2)).join('');
  },
};

/** Inner SVG markup for `viewBox="0 0 380 220"`: the same picture for the same seed. */
export function areaArt(kind: Art, color: string, seed: number): string {
  return ART[kind](color, seeded(seed));
}
