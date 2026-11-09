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

describe('areas and publications', () => {
  const doi = 'https://doi.org/10.0000/x';
  const labels = (p: Parameters<typeof s.publicationButtons>[0]) => s.publicationButtons(p).map((b) => b.label);

  it('writes the counts line, leaving out zeros', () => {
    expect(s.countsLine(1, 1)).toBe('1 project · 1 publication');
    expect(s.countsLine(0, 4)).toBe('4 publications');
    expect(s.countsLine(0, 0)).toBe('');
  });
  it('writes the stats line', () => {
    const pubs = [{ year: 2026, openAccess: true }, { year: 2020, openAccess: false }, { year: 2025, openAccess: true }];
    expect(s.statsLine(pubs)).toBe('3 works · 2020–2026 · 2 free to read');
    expect(s.statsLine([{ year: 2026, openAccess: false }])).toBe('1 work · 2026 · 0 free to read');
  });
  it('orders newest first by date (else 1 January of the year), then most cited', () => {
    const p = [
      { id: 'u0', year: 2025, citedBy: 0 },
      { id: 'jan', year: 2026, date: new Date('2026-01-15'), citedBy: 0 },
      { id: 'u1', year: 2025, citedBy: 1 },
      { id: 'mar', year: 2026, date: new Date('2026-03-01'), citedBy: 0 },
    ];
    expect(s.byNewest(p).map((x) => x.id)).toEqual(['mar', 'jan', 'u1', 'u0']);
  });
  it('picks recent papers, skipping datasets and preprints', () => {
    const p = [
      { id: 'data', type: 'dataset', year: 2026, date: new Date('2026-04-01'), citedBy: 0, areas: ['a'] },
      { id: 'pre', type: 'preprint', year: 2026, date: new Date('2026-03-15'), citedBy: 0, areas: ['a'] },
      { id: 'art', type: 'article', year: 2026, date: new Date('2026-03-01'), citedBy: 0, areas: ['a'] },
      { id: 'old', type: 'review', year: 2020, citedBy: 9, areas: ['b'] },
    ];
    expect(s.recentPublications(p).map((x) => x.id)).toEqual(['art', 'old']);
    expect(s.latestPublication(p, 'a')?.id).toBe('art');
    expect(s.latestPublication(p, 'none')).toBeUndefined();
  });
  it('shows only areas with a project or a publication, in order', () => {
    const areas = [{ id: 'b', order: 2 }, { id: 'a', order: 1 }, { id: 'empty', order: 0 }];
    expect(s.visibleAreas(areas, [{ area: { id: 'b' } }], [{ areas: ['a'] }]).map((a) => a.id)).toEqual(['a', 'b']);
  });
  it('builds publication buttons', () => {
    expect(labels({ id: 'W1', pdf: 'https://example.org/x.pdf', doi })).toEqual(['PDF', 'DOI']);
    const free = s.publicationButtons({ id: 'W2', free: 'https://example.org/pmc/x', freeAt: 'PubMed Central', doi });
    expect(free.map((b) => b.label)).toEqual(['Free copy', 'DOI']);
    expect(free[0].title).toBe('Free copy at PubMed Central');
    expect(s.publicationButtons({ id: 'W2', free: 'https://example.org/f', doi })[0].title).toBe('Free copy at another site');
    expect(labels({ id: 'W3', free: doi, doi })).toEqual(['DOI']);
    expect(s.publicationButtons({ id: 'W6', url: 'https://example.org/w6' })).toEqual([{ label: 'Link', href: 'https://example.org/w6' }]);
    expect(s.publicationButtons({ id: 'W8' })).toEqual([{ label: 'Link', href: 'https://openalex.org/W8' }]);
  });
  it('never gives two buttons the same address', () =>
    expect(labels({ id: 'W9', pdf: 'https://example.org/x.pdf', url: 'https://example.org/x.pdf' })).toEqual(['PDF']));
  it('counts co-authors, never below zero', () => expect(s.coauthors({ authors: 2, people: [1, 2] })).toBe(0));
  it('labels every type except plain articles', () => {
    expect(s.typeLabel('review')).toBe('Review');
    expect(s.typeLabel('book-chapter')).toBe('Book chapter');
    expect(s.typeLabel('article')).toBe('');
    expect(s.isPaper('review')).toBe(true);
  });
  it('pads slide numbers to two digits', () => expect(s.twoDigits(1)).toBe('01'));
  it('lists the people on publications A to Z, with counts', () =>
    expect(s.peopleOnPublications([
      { people: [{ key: 'pi-b', name: 'Bo' }] },
      { people: [{ key: 'pi-a', name: 'Al' }, { key: 'pi-b', name: 'Bo' }] },
    ])).toEqual([{ key: 'pi-a', name: 'Al', count: 1 }, { key: 'pi-b', name: 'Bo', count: 2 }]));
  it('counts what sits under each area pill, with Other for items in no area', () =>
    expect(s.areaPills([{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }], [{ areas: ['a'] }, { areas: ['a', 'b'] }, { areas: [] }])).toEqual([
      { id: 'a', name: 'A', count: 2 }, { id: 'b', name: 'B', count: 1 }, { id: 'other', name: 'Other', count: 1 },
    ]));
});
