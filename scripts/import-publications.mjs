#!/usr/bin/env node
// Imports every work by the consented principal investigators from OpenAlex into src/content/publications.json.
// Run by hand, review the diff, then commit:   node scripts/import-publications.mjs [--dry-run]
// The site itself never calls OpenAlex. Hand corrections live in publication-corrections.json, which this never touches.
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { advisorAuthorMap, frontmatterField, isExcluded, mergeWorks, toPublication } from './publications-lib.mjs';

const CONTENT = 'src/content';
const OUT = join(CONTENT, 'publications.json');
const SELECT = [
  'id', 'doi', 'display_name', 'publication_year', 'publication_date', 'type', 'primary_location',
  'best_oa_location', 'open_access', 'cited_by_count', 'primary_topic', 'authorships',
].join(',');
const KKU = /khon kaen/i;
const dryRun = process.argv.includes('--dry-run');

const readMarkdown = (dir) =>
  existsSync(dir)
    ? readdirSync(dir)
        .filter((f) => f.endsWith('.md'))
        .map((f) => ({ id: basename(f, '.md'), markdown: readFileSync(join(dir, f), 'utf8') }))
    : [];
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Every page of works by these OpenAlex author ids. Stops with a readable message on any non-200 answer. */
async function fetchWorks(authorIds) {
  const works = [];
  for (let cursor = '*'; cursor; ) {
    const url = new URL('https://api.openalex.org/works');
    url.searchParams.set('filter', `authorships.author.id:${authorIds.join('|')}`);
    url.searchParams.set('per-page', '200');
    url.searchParams.set('cursor', cursor);
    url.searchParams.set('select', SELECT);
    if (process.env.OPENALEX_API_KEY) url.searchParams.set('api_key', process.env.OPENALEX_API_KEY);
    const res = await fetch(url);
    // The message names the authors, never the URL, so an API key cannot leak into a terminal log.
    if (res.status !== 200) throw new Error(`OpenAlex answered ${res.status} for ${authorIds.join(', ')}: ${(await res.text()).slice(0, 200)}`);
    const page = await res.json();
    works.push(...page.results);
    cursor = page.meta.next_cursor;
    await sleep(150);
  }
  return works;
}

async function main() {
  const advisorFiles = readMarkdown(join(CONTENT, 'advisors'));
  for (const f of advisorFiles) {
    if (frontmatterField(f.markdown, 'openalex') === '') {
      console.warn(`advisors/${f.id}.md: write openalex on one line, like openalex: [A5027417160]. Skipped.`);
    }
  }
  const byAuthor = advisorAuthorMap(advisorFiles);
  const advisors = [...new Set(byAuthor.values())];
  if (advisors.length === 0) {
    console.log('0 advisors with OpenAlex ids; nothing to import');
    return;
  }

  const rules = readMarkdown(join(CONTENT, 'areas'))
    .map((f) => {
      const pattern = (key) => {
        const value = frontmatterField(f.markdown, key);
        return value ? new RegExp(value, 'i') : undefined;
      };
      return { id: f.id, topics: pattern('match_topics'), titles: pattern('match_titles') };
    })
    .filter((r) => r.topics || r.titles);

  const entries = [];
  const noKku = new Set();
  for (const advisor of advisors) {
    const ids = [...byAuthor].filter(([, a]) => a === advisor).map(([author]) => author);
    const works = (await fetchWorks(ids)).filter((w) => !isExcluded(w));
    console.log(`${advisor}: ${works.length} works`);
    for (const w of works) {
      entries.push(toPublication(w, byAuthor, rules));
      const theirs = w.authorships.filter((a) => ids.includes(String(a.author?.id).split('/').pop()));
      const atKku = theirs.some((a) => (a.institutions ?? []).some((i) => KKU.test(i.display_name ?? '')));
      if (!atKku) noKku.add(w.id);
    }
  }

  const list = mergeWorks(entries);
  const perArea = new Map();
  for (const p of list) for (const a of p.areas) perArea.set(a, (perArea.get(a) ?? 0) + 1);
  for (const [area, n] of perArea) console.log(`  ${area}: ${n}`);
  console.log(`  Other: ${list.filter((p) => p.areas.length === 0).length}`);
  console.log(`${noKku.size} works show no Khon Kaen University affiliation for the advisor; ask them to check those.`);

  if (dryRun) {
    console.log(`Dry run: ${list.length} works found, nothing written.`);
    return;
  }
  writeFileSync(OUT, `${JSON.stringify(list, null, 2)}\n`);
  console.log(`Wrote ${list.length} works to ${OUT}. Review the diff, then commit.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
