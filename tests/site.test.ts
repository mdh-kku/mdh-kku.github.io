import { describe, it, expect } from 'vitest';
import * as s from '../src/lib/site';

const d = (x: string) => ({ id: x, date: new Date(x) });

describe('display rules', () => {
  it('orders projects: featured first, then newest year, at most 6', () => {
    const p = [{ id: 'a', featured: false, year: 2023 }, { id: 'b', featured: true, year: 2022 }, { id: 'c', featured: false, year: 2025 }];
    expect(s.orderProjects(p).map(x => x.id)).toEqual(['b', 'c', 'a']);
    expect(s.orderProjects(Array.from({ length: 8 }, (_, i) => ({ id: `${i}`, featured: false, year: 2020 + i })))).toHaveLength(6);
  });
  it('shows the 4 newest updates, newest first', () => {
    const u = ['2024-01-10', '2025-12-03', '2025-02-01', '2024-06-01', '2025-08-15'].map(d);
    expect(s.latestFirst(u).map(x => x.id)).toEqual(['2025-12-03', '2025-08-15', '2025-02-01', '2024-06-01']);
  });
  it('hides sections under 3 items', () => { expect(s.showSection(2)).toBe(false); expect(s.showSection(3)).toBe(true); });
  it('writes thesis and about copy', () => {
    expect(s.thesesHeadline(1)).toBe('One thesis underway.');
    expect(s.thesesHeadline(9)).toBe('Nine theses underway.');
    expect(s.thesesHeadline(12)).toBe('12 theses underway.');
    expect(s.aboutLead(1).startsWith('One medical student earning')).toBe(true);
    expect(s.aboutLead(9)).toBe('Nine medical students earning an MSc in Data Science and Health Informatics alongside the MD, working with faculty advisors at the Faculty of Medicine, Khon Kaen University.');
  });
  it('never writes "0 medical students" before anyone is added', () =>
    expect(s.aboutLead(0)).toBe('Medical students earning an MSc in Data Science and Health Informatics alongside the MD, working with faculty advisors at the Faculty of Medicine, Khon Kaen University.'));
  it('finds who an advisor supervises', () =>
    expect(s.supervisedBy('adv-one', [{ id: 'ann-a', advisorIds: ['adv-one'] }, { id: 'ben-b', advisorIds: ['adv-two'] }])).toEqual(['ann-a']));
  it('builds a mailto link with an encoded subject', () =>
    expect(s.mailtoHref('lab@kku.ac.th', 'Collaboration with MDH')).toBe('mailto:lab@kku.ac.th?subject=Collaboration%20with%20MDH'));
  it('shows hero photos only when there are at least 4, at most 4', () => {
    expect(s.heroPhotosToShow([1, 2, 3])).toEqual([]);
    expect(s.heroPhotosToShow([1, 2, 3, 4, 5])).toEqual([1, 2, 3, 4]);
  });
  it('must() keeps falsy values and throws only on undefined', () => {
    expect(s.must(0, 'm')).toBe(0);
    const msg = 'Project "alpha" lists people "zed", but there is no file people/zed.md';
    expect(() => s.must(undefined, msg)).toThrow(msg);
  });
});
