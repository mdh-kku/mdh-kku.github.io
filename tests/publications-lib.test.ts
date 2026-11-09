import { describe, it, expect } from 'vitest';
import {
  advisorAuthorMap, areasFor, frontmatterField, isExcluded, linksOf, mergeWorks, parseIdList, toPublication,
} from '../scripts/publications-lib.mjs';

/** A small OpenAlex-shaped work. Author names are here only to prove they never reach the output. */
const work = (o: Record<string, unknown> = {}) => ({
  id: 'https://openalex.org/W1',
  doi: 'https://doi.org/10.0000/w1',
  display_name: 'A fake paper',
  publication_year: 2026,
  publication_date: '2026-03-01',
  type: 'article',
  primary_location: { landing_page_url: 'https://publisher.example/w1', source: { display_name: 'Fake Journal' } },
  best_oa_location: null,
  open_access: { is_oa: false },
  cited_by_count: 2,
  primary_topic: { display_name: 'Cholangiocarcinoma and Gallbladder Cancer Studies', field: { display_name: 'Medicine' } },
  authorships: [
    { author: { id: 'https://openalex.org/A1', display_name: 'Tess Advisor' }, institutions: [] },
    { author: { id: 'https://openalex.org/A9', display_name: 'Una Known' }, institutions: [] },
  ],
  ...o,
});

describe('frontmatter', () => {
  const md = '---\nopenalex: [A1, A2]\nname: X\n---';
  it('reads a one-line value and its id list', () => {
    expect(frontmatterField(md, 'openalex')).toBe('[A1, A2]');
    expect(parseIdList(frontmatterField(md, 'openalex'))).toEqual(['A1', 'A2']);
  });
  it('gives undefined for a missing key, and no ids', () => {
    expect(frontmatterField(md, 'orcid')).toBeUndefined();
    expect(parseIdList(undefined)).toEqual([]);
  });
  it('drops surrounding quotes and a trailing comment left from the README template', () => {
    const tpl = "---\nmatch_titles: 'dysphagia|aphasia'   # optional, one line\nopenalex: [A1]   # one line\n---";
    expect(frontmatterField(tpl, 'match_titles')).toBe('dysphagia|aphasia');
    expect(parseIdList(frontmatterField(tpl, 'openalex'))).toEqual(['A1']);
  });
});

describe('works', () => {
  it('leaves out errata and paratext', () => {
    expect(isExcluded({ type: 'erratum' })).toBe(true);
    expect(isExcluded({ type: 'paratext' })).toBe(true);
    expect(isExcluded({ type: 'article' })).toBe(false);
  });

  it('keeps a direct PDF and then needs no free copy', () => {
    const l = linksOf(work({ best_oa_location: { pdf_url: 'https://example.org/w1.pdf', landing_page_url: 'https://europepmc.org/w1', source: { display_name: 'Europe PMC' } } }));
    expect(l.pdf).toBe('https://example.org/w1.pdf');
    expect(l.free).toBeUndefined();
  });
  it('gives no free copy when the free page is the DOI itself', () => {
    const l = linksOf(work({ best_oa_location: { pdf_url: null, landing_page_url: 'https://doi.org/10.0000/w1', source: { display_name: 'Fake Journal' } } }));
    expect(l.free).toBeUndefined();
  });
  it('names the site of a free copy elsewhere', () =>
    expect(linksOf(work({ best_oa_location: { pdf_url: null, landing_page_url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC1', source: { display_name: 'PubMed Central' } } }))).toEqual({
      doi: 'https://doi.org/10.0000/w1',
      free: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC1',
      free_at: 'PubMed Central',
      url: 'https://publisher.example/w1',
    }));

  const rules = [{ id: 'cca', topics: /cholangiocarcinoma/i }, { id: 'ai', titles: /machine learning/i }];
  it('assigns areas by topic or by title, possibly several', () => {
    expect(areasFor(work(), rules)).toEqual(['cca']);
    expect(areasFor(work({ primary_topic: null, display_name: 'Machine learning for X' }), rules)).toEqual(['ai']);
    expect(areasFor(work({ primary_topic: null }), rules)).toEqual([]);
    expect(areasFor(work({ display_name: 'Machine learning for cholangiocarcinoma' }), rules)).toEqual(['cca', 'ai']);
  });

  it('maps a work to an entry naming only the lab people on it', () => {
    const p = toPublication(work(), new Map([['A1', 'adv-one']]), rules);
    expect(p).toEqual({
      id: 'W1',
      title: 'A fake paper',
      year: 2026,
      date: '2026-03-01',
      type: 'article',
      venue: 'Fake Journal',
      doi: 'https://doi.org/10.0000/w1',
      url: 'https://publisher.example/w1',
      open_access: false,
      authors: 2,
      cited_by: 2,
      advisors: ['adv-one'],
      areas: ['cca'],
    });
    expect(JSON.stringify(p)).not.toMatch(/Una Known|Tess Advisor/);
  });
  it('finds no advisor when no author is a lab member', () =>
    expect(toPublication(work(), new Map([['A7', 'adv-x']]), []).advisors).toEqual([]));

  it('merges one work found through two advisors, newest first', () => {
    const a = { id: 'W1', year: 2026, date: '2026-03-01', advisors: ['adv-one'] };
    const older = { id: 'W2', year: 2020, advisors: ['adv-two'] };
    expect(mergeWorks([older, a, { ...a, advisors: ['adv-two'] }])).toEqual([{ ...a, advisors: ['adv-one', 'adv-two'] }, older]);
  });
});

describe('advisorAuthorMap', () => {
  it('maps every OpenAlex id in a file, and nothing from a file without the line', () => {
    const m = advisorAuthorMap([
      { id: 'adv-one', markdown: '---\nname: T\nopenalex: [A1, A2]\n---' },
      { id: 'adv-two', markdown: '---\nname: R\n---' },
    ]);
    expect([...m]).toEqual([['A1', 'adv-one'], ['A2', 'adv-one']]);
  });
});
