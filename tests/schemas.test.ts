import { describe, it, expect } from 'vitest';
import { z } from 'astro/zod';
import { personSchema, advisorSchema, projectSchema, updateSchema, siteSchema } from '../src/lib/schemas';

const img = () => z.string();
const ref = () => z.string();
const person = {
  name: 'Ann Alpha', name_th: 'แอน', cohort: 2023, consent: true, consent_date: '2026-11-01',
  research_interest: 'Focuses on machine learning for early warning.',
  index_phrase: 'early warning from vital signs',
  thesis_topic: 'Predicting deterioration from vital signs.', advisors: ['adv-one'],
};
const ok = (s: z.ZodType, v: unknown) => s.safeParse(v).success;

describe('person', () => {
  const P = personSchema(img, ref);
  it('accepts a complete consented person', () => expect(ok(P, person)).toBe(true));
  it('rejects consent: false', () => expect(ok(P, { ...person, consent: false })).toBe(false));
  it('rejects missing consent', () => { const { consent: _, ...rest } = person; expect(ok(P, rest)).toBe(false); });
  it('rejects capitals or fewer than 3 words in index_phrase', () => {
    expect(ok(P, { ...person, index_phrase: 'Voice Games' })).toBe(false);
    expect(ok(P, { ...person, index_phrase: 'voice games for speech therapy' })).toBe(true);
  });
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
