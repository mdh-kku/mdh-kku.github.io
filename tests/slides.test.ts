import { describe, it, expect } from 'vitest';
import { pose, rubber, snapTarget, springOf, wheelPage } from '../src/lib/slides';

const base = { travel: 1300, step: 18, fan: 1, pulledPastEnd: false };

describe('pose', () => {
  it('puts the current slide in place', () => expect(pose(0, base)).toEqual({ x: 0, scale: 1, shade: 0, opacity: 1 }));
  it('keeps the next slide waiting off-screen to the right', () => expect(pose(1, base).x).toBe(1300));
  it('piles a seen slide just left, a little smaller and washed out', () => {
    const p = pose(-1, base);
    expect(p.x).toBe(-18);
    expect(p.scale).toBeCloseTo(0.965);
    expect(p.shade).toBe(0.5);
    expect(p.opacity).toBe(1);
  });
  it('fades out the fourth level of the pile', () => {
    const p = pose(-4, base);
    expect(p.x).toBe(-54);
    expect(p.opacity).toBe(0);
  });
  it('lets the last slide follow a pull past the end', () =>
    expect(pose(-1, { ...base, travel: 1000, pulledPastEnd: true }).x).toBe(-1000));
});

describe('snapTarget', () => {
  const at = (o: Partial<Parameters<typeof snapTarget>[0]>) =>
    snapTarget({ from: 1, dx: 0, vx: 0, travel: 1300, count: 4, ...o });
  it('moves one slide on a flick', () => expect(at({ dx: -30, vx: -0.2 })).toBe(2));
  it('springs back from a short, slow drag', () => expect(at({ dx: -30, vx: -0.05 })).toBe(1));
  it('moves after a long drag', () => expect(at({ dx: -200 })).toBe(2));
  it('needs only 20% of a short travel', () => expect(at({ dx: -120, travel: 500 })).toBe(2));
  it('stops at the last slide', () => expect(at({ from: 3, dx: -300 })).toBe(3));
  it('never moves more than one slide per gesture', () => expect(at({ dx: -5000, vx: -9 })).toBe(2));
});

describe('rubber band and springs', () => {
  it('resists a pull past the first slide', () => {
    const r = rubber(-0.5, 4, 1000);
    expect(r).toBeGreaterThan(-0.5);
    expect(r).toBeLessThan(0);
  });
  it('leaves positions between the ends alone', () => expect(rubber(1.4, 4, 1000)).toBe(1.4));
  it("turns Apple's response and damping into stiffness and friction", () => {
    const s = springOf(0.5, 1);
    expect(s.k).toBeCloseTo(157.91, 1);
    expect(s.c).toBeCloseTo(25.13, 1);
  });
});

describe('wheelPage', () => {
  it('waits for a clear sideways trackpad swipe, then pages one slide', () => {
    expect(wheelPage(39)).toBe(0);
    expect(wheelPage(-39)).toBe(0);
    expect(wheelPage(40)).toBe(1);
    expect(wheelPage(-55)).toBe(-1);
  });
});
