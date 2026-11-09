import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const readme = readFileSync('README.md', 'utf8').replace(/\r\n/g, '\n');
const blocks = [...readme.matchAll(/```md\n([\s\S]*?)```/g)].map((m) => m[1]);
const lines = blocks.flatMap((b) => b.split('\n'));

/** Values of uncommented `key:` lines in the templates, ignoring trailing # comments. */
const values = (key: string) =>
  lines
    .filter((l) => new RegExp(`^\\s*${key}:`).test(l))
    .map((l) => l.replace(/\s#.*$/, '').split(':').slice(1).join(':').trim())
    .filter(Boolean);

// Fields a maintainer must write: left empty, so an unedited copy fails the build instead of going live.
const MUST_WRITE = ['name', 'name_th', 'cohort', 'consent', 'consent_date', 'research_interest',
  'thesis_topic', 'title', 'department', 'summary', 'year', 'area', 'date', 'kind', 'detail', 'confirmed_by', 'alt',
  'description', 'color', 'art', 'order', 'what', 'since', 'ongoing'];
// Optional fields with example values: commented out, so examples can't go live by accident.
const OPTIONAL = ['photo', 'photo_alt', 'image', 'image_alt', 'profile_url', 'link', 'next', 'contributors',
  'orcid', 'scholar', 'github', 'linkedin', 'email', 'source_url',
  'match_topics', 'match_titles', 'url', 'logo', 'logo_alt', 'projects', 'openalex'];

describe('README templates', () => {
  it('found all seven templates', () => expect(blocks.length).toBeGreaterThanOrEqual(7));
  it('leave every must-write field empty', () => {
    for (const k of MUST_WRITE) expect(values(k), k).toEqual([]);
  });
  it('comment out optional example values', () => {
    for (const k of OPTIONAL) expect(values(k), k).toEqual([]);
  });
});

describe('README: removing someone', () => {
  const section = readme.split('## Remove someone')[1]?.split('\n## ')[0] ?? '';
  it('covers photos they appear in, contributor names and git history', () => {
    expect(section).toMatch(/hero photo/i);
    expect(section).toMatch(/project image/i);
    expect(section).toMatch(/contributors/);
    expect(section).toMatch(/history/i);
  });
  it('tells the maintainer to re-run the publication import', () => expect(section).toMatch(/import-publications/));
});

describe('README: importing publications', () => {
  const section = readme.split('## Import publications')[1]?.split('\n## ')[0] ?? '';
  it('explains the import, the API key and the corrections file', () => {
    expect(section).toContain('OPENALEX_API_KEY');
    expect(section).toContain('publication-corrections.json');
  });
});
