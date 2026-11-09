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

describe('peopleCards', () => {
  const people = [
    { id: 'cara-c', name: 'Cara Gamma', nameTh: 'คาร่า', researchInterest: 'Kidney care research.', thesisTopic: 'Kidney care at home.',
      advisors: [{ id: 'adv-one', label: 'Asst. Prof. Tess Advisor, MD' }, { id: 'adv-two', label: 'Assoc. Prof. Rex Mentor, PhD' }], links: {} },
    { id: 'ann-a', name: 'Ann Alpha', nameTh: 'แอน', researchInterest: 'Early warning research.', thesisTopic: 'Early warning.',
      advisors: [{ id: 'adv-one', label: 'Asst. Prof. Tess Advisor, MD' }], links: { orcid: 'https://orcid.org/1', email: 'ann@example.org' } },
  ];
  const advisors = [
    { id: 'adv-one', name: 'Tess Advisor, MD', title: 'Asst. Prof.', label: 'Asst. Prof. Tess Advisor, MD', department: 'Rehabilitation Medicine',
      researchInterest: 'Decision support.', supervises: [{ id: 'ann-a', name: 'Ann Alpha' }, { id: 'cara-c', name: 'Cara Gamma' }] },
    { id: 'adv-two', name: 'Rex Mentor, PhD', title: 'Assoc. Prof.', label: 'Assoc. Prof. Rex Mentor, PhD', department: 'Biostatistics',
      researchInterest: 'Longitudinal models.', supervises: [{ id: 'cara-c', name: 'Cara Gamma' }], orcid: 'https://orcid.org/2' },
  ];
  const cards = s.peopleCards(people, advisors);
  const by = (name: string) => cards.find((c) => c.name === name)!;

  it('puts students and principal investigators in one A-to-Z list', () => {
    expect(cards.map((c) => c.name)).toEqual(['Ann Alpha', 'Cara Gamma', 'Rex Mentor, PhD', 'Tess Advisor, MD']);
    expect(cards.map((c) => c.role)).toEqual(['Student', 'Student', 'Principal investigator', 'Principal investigator']);
  });
  it('says who a student works with, from the advisor files', () => {
    expect(by('Ann Alpha').relation).toBe('Advisor: Tess Advisor, MD');
    expect(by('Cara Gamma').relation).toBe('Advisors: Tess Advisor, MD · Rex Mentor, PhD');
    expect(by('Cara Gamma').linked).toEqual(['pi-adv-one', 'pi-adv-two']);
    expect(by('Cara Gamma').line).toBe('Kidney care at home.');
  });
  it('derives who a principal investigator advises', () => {
    const tess = by('Tess Advisor, MD');
    expect([tess.key, tess.anchor, tess.kind]).toEqual(['pi-adv-one', 'pi-adv-one', 'pi']);
    expect(tess.relation).toBe('Advises: Ann Alpha · Cara Gamma');
    expect(tess.linked).toEqual(['ann-a', 'cara-c']);
    expect(tess.line).toBe('Rehabilitation Medicine · Decision support.');
  });
  it('makes initials and links', () => {
    expect(by('Ann Alpha').initials).toBe('AA');
    expect(by('Tess Advisor, MD').initials).toBe('TA');
    expect(by('Ann Alpha').links).toEqual([{ label: 'ORCID', href: 'https://orcid.org/1' }, { label: 'Email', href: 'mailto:ann@example.org' }]);
    expect(by('Rex Mentor, PhD').links).toEqual([{ label: 'ORCID', href: 'https://orcid.org/2' }]);
  });
  it('writes CSS that lights up the people a card works with, on hover and on focus', () => {
    const css = s.peopleLinkCss([{ key: 'cara-c', linked: ['pi-adv-one', 'pi-adv-two'] }, { key: 'lone', linked: [] }], '.grid');
    expect(css).toContain('.grid:has([data-key="cara-c"]:hover) :is([data-key="pi-adv-one"],[data-key="pi-adv-two"])');
    expect(css).toContain('.grid:has([data-key="cara-c"]:focus-within) :is(');
    expect(css).toContain('@media (hover:hover) and (pointer:fine)');
    expect(css).not.toContain('"lone"');
  });
});
