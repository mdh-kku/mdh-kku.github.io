import { describe, it, expect } from 'vitest';
import { z } from 'astro/zod';
import {
  personSchema, advisorSchema, projectSchema, updateSchema, siteSchema,
  areaSchema, publicationSchema, correctionSchema, collaboratorSchema,
} from '../src/lib/schemas';

const img = () => z.string();
const ref = () => z.string();
const person = {
  name: 'Ann Alpha', name_th: 'แอน', cohort: 2023, consent: true, consent_date: '2026-11-01',
  research_interest: 'Focuses on machine learning for early warning.',
  thesis_topic: 'Predicting deterioration from vital signs.', advisors: ['adv-one'],
};
const ok = (s: z.ZodType, v: unknown) => s.safeParse(v).success;

describe('person', () => {
  const P = personSchema(img, ref);
  it('accepts a complete consented person', () => expect(ok(P, person)).toBe(true));
  it('rejects consent: false', () => expect(ok(P, { ...person, consent: false })).toBe(false));
  it('rejects missing consent', () => { const { consent: _, ...rest } = person; expect(ok(P, rest)).toBe(false); });
  it('requires photo_alt when photo is set', () => expect(ok(P, { ...person, photo: 'a.jpg' })).toBe(false));
  it('requires at least one advisor', () => expect(ok(P, { ...person, advisors: [] })).toBe(false));
});

describe('update', () => {
  const U = updateSchema(ref);
  const base = { date: '2025-12-03', title: 'Two awards at i-CREATE 2025', detail: 'x', confirmed_by: 'Gongpop' };
  it('rejects an award without source_url', () => expect(ok(U, { ...base, kind: 'award' })).toBe(false));
  it('accepts a milestone without source_url', () => expect(ok(U, { ...base, kind: 'milestone' })).toBe(true));
  it('rejects an unknown kind', () => expect(ok(U, { ...base, kind: 'news' })).toBe(false));
});

describe('dates', () => {
  const U = updateSchema(ref);
  const base = { title: 'x', kind: 'milestone', detail: 'x', confirmed_by: 'Gongpop' };
  it('accepts ISO dates and the Date objects YAML makes from them', () => {
    expect(ok(U, { ...base, date: '2025-12-03' })).toBe(true);
    expect(ok(U, { ...base, date: new Date('2025-12-03') })).toBe(true);
  });
  it('rejects day-first dates instead of misreading them as another month', () => {
    expect(ok(U, { ...base, date: '03/12/2025' })).toBe(false);
    expect(ok(personSchema(img, ref), { ...person, consent_date: '15/11/2026' })).toBe(false);
  });
});

describe('advisor, project, site', () => {
  const adv = { name: 'Tess Advisor, MD', title: 'Asst. Prof.', department: 'Medicine', research_interest: 'Clinical informatics and decision support.', consent: true };
  it('advisor needs consent', () => { const { consent: _, ...rest } = adv; expect(ok(advisorSchema(img), rest)).toBe(false); });
  it('project summary is one line (≤120 chars)', () =>
    expect(ok(projectSchema(img, ref), { name: 'Alpha', summary: 'x'.repeat(121), year: 2024, area: 'Rehabilitation' })).toBe(false));
  it('site email must be valid when present', () => {
    expect(ok(siteSchema, { email: 'not-an-email' })).toBe(false);
    expect(ok(siteSchema, {})).toBe(true);
  });
});

describe('area', () => {
  const area = { name: 'Imaging', description: 'Fake imaging area for tests.', color: '#0f8a86', art: 'cells', order: 2 };
  it('accepts a complete area', () => expect(ok(areaSchema, area)).toBe(true));
  it('rejects a colour that is not a hex code', () => expect(ok(areaSchema, { ...area, color: 'teal' })).toBe(false));
  it('rejects an unknown picture style', () => expect(ok(areaSchema, { ...area, art: 'clouds' })).toBe(false));
  it('rejects a match pattern that does not compile', () =>
    expect(ok(areaSchema, { ...area, match_titles: '(unclosed' })).toBe(false));
});

describe('advisor OpenAlex ids', () => {
  const adv = { name: 'Tess Advisor, MD', title: 'Asst. Prof.', department: 'Medicine', research_interest: 'Clinical informatics and decision support.', consent: true };
  it('accepts OpenAlex author ids', () => expect(ok(advisorSchema(img), { ...adv, openalex: ['A5027417160'] })).toBe(true));
  it('rejects an id without the A prefix', () => expect(ok(advisorSchema(img), { ...adv, openalex: ['5027417160'] })).toBe(false));
});

describe('publication', () => {
  const P = publicationSchema(ref);
  const pub = { title: 'x', year: 2026, type: 'article', open_access: true, authors: 3, advisors: ['adv-one'] };
  it('accepts a minimal publication', () => expect(ok(P, pub)).toBe(true));
  it('needs at least one advisor', () => { const { advisors: _, ...rest } = pub; expect(ok(P, rest)).toBe(false); });
  it('rejects a doi that is not a URL', () => expect(ok(P, { ...pub, doi: 'not a url' })).toBe(false));
  it('rejects zero authors', () => expect(ok(P, { ...pub, authors: 0 })).toBe(false));
});

describe('correction', () => {
  const C = correctionSchema(ref);
  it('accepts hiding a work', () => expect(ok(C, { hidden: true })).toBe(true));
  it('accepts replacing the areas', () => expect(ok(C, { areas: ['imaging-fx'] })).toBe(true));
});

describe('collaborator', () => {
  const C = collaboratorSchema(img, ref);
  const collab = { name: 'Fake Clinic', kind: 'organisation', what: 'x', since: 2024, ongoing: true, consent: true };
  it('accepts a consented collaborator', () => expect(ok(C, collab)).toBe(true));
  it('rejects consent: false', () => expect(ok(C, { ...collab, consent: false })).toBe(false));
  it('requires logo_alt when logo is set', () => expect(ok(C, { ...collab, logo: 'logo.png' })).toBe(false));
});

describe('links', () => {
  const pub = { title: 'x', year: 2026, type: 'article', open_access: true, authors: 3, advisors: ['adv-one'] };
  it('rejects links that are not http(s), so imported data cannot ship a script link', () => {
    expect(ok(publicationSchema(ref), { ...pub, pdf: 'javascript:alert(1)' })).toBe(false);
    expect(ok(publicationSchema(ref), { ...pub, url: 'data:text/html,x' })).toBe(false);
    expect(ok(projectSchema(img, ref), { name: 'Alpha', summary: 'x', year: 2024, area: 'a', link: 'javascript:alert(1)' })).toBe(false);
    expect(ok(siteSchema, { facebook: 'javascript:alert(1)' })).toBe(false);
  });
  it('accepts ordinary web addresses', () =>
    expect(ok(publicationSchema(ref), { ...pub, doi: 'https://doi.org/10.0000/x', pdf: 'http://example.org/x.pdf' })).toBe(true));
});

describe('site extras', () => {
  const principle = { title: 'Fake principle', line: 'Fake line.' };
  it('rejects a facebook value that is not a URL', () => expect(ok(siteSchema, { facebook: 'nope' })).toBe(false));
  it('rejects more than six principles', () =>
    expect(ok(siteSchema, { principles: Array.from({ length: 7 }, () => principle) })).toBe(false));
  it('still accepts an empty site file', () => expect(ok(siteSchema, {})).toBe(true));
});
