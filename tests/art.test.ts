import { describe, it, expect } from 'vitest';
import { areaArt } from '../src/lib/art';
import { ART_KINDS } from '../src/lib/schemas';

describe('areaArt', () => {
  it('draws the same picture for the same seed', () => expect(areaArt('wave', '#2f5fd0', 7)).toBe(areaArt('wave', '#2f5fd0', 7)));
  it('draws a different picture for another seed', () =>
    expect(areaArt('wave', '#2f5fd0', 7)).not.toBe(areaArt('wave', '#2f5fd0', 8)));
  it('gives every style a playing part in the area colour', () => {
    for (const kind of ART_KINDS) {
      const svg = areaArt(kind, '#123456', 1);
      expect(svg, kind).toContain('class="anim');
      expect(svg, kind).toContain('#123456');
    }
  });
});
