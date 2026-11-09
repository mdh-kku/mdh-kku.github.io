// Pure helpers for scripts/import-publications.mjs. No network and no files here, so tests can call them directly.

/** @typedef {{ id: string, topics?: RegExp, titles?: RegExp }} AreaRule */

/** "https://openalex.org/W123" → "W123". */
const short = (url) => (url ? String(url).split('/').pop() : undefined);

/** Drops null and undefined fields, so publications.json carries only what OpenAlex knows. */
const clean = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== null));

/**
 * The raw one-line value of `key:` in a Markdown file's frontmatter, without surrounding quotes or a trailing
 * `# comment` (the README templates carry one on each optional line).
 * @param {string} markdown
 * @param {string} key
 * @returns {string | undefined}
 */
export function frontmatterField(markdown, key) {
  const front = markdown.replace(/\r\n/g, '\n').match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
  const line = front.split('\n').find((l) => l.startsWith(`${key}:`));
  if (line === undefined) return undefined;
  const value = line.slice(key.length + 1).trim();
  const quoted = value.match(/^(['"])(.*?)\1/);
  return quoted ? quoted[2] : value.replace(/\s+#.*$/, '');
}

/**
 * "[A1, A2]" → ["A1", "A2"].
 * @param {string | undefined} value
 * @returns {string[]}
 */
export function parseIdList(value) {
  if (!value) return [];
  return value
    .replace(/^\[|\]$/g, '')
    .split(',')
    .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean);
}

/** Errata and paratext are notices about a work, not works. */
export function isExcluded(work) {
  return work.type === 'erratum' || work.type === 'paratext';
}

/**
 * The links a publication row can offer. A free copy is kept only when it is somewhere the DOI and the publisher's
 * page are not, and only when there is no direct PDF.
 */
export function linksOf(work) {
  const best = work.best_oa_location ?? {};
  const url = work.primary_location?.landing_page_url ?? undefined;
  const pdf = best.pdf_url ?? undefined;
  const page = best.landing_page_url;
  const free = !pdf && page && page !== work.doi && page !== url && !page.includes('doi.org/') ? page : undefined;
  return clean({ doi: work.doi, pdf, free, free_at: free ? best.source?.display_name : undefined, url });
}

/**
 * Ids of the areas whose rule matches the work's primary topic (with its field) or its title.
 * @param {AreaRule[]} rules
 * @returns {string[]}
 */
export function areasFor(work, rules) {
  const t = work.primary_topic;
  const topic = t ? `${t.display_name ?? ''} ${t.field?.display_name ?? ''}` : '';
  const title = work.display_name ?? '';
  return rules.filter((r) => (r.topics && topic && r.topics.test(topic)) || (r.titles && r.titles.test(title))).map((r) => r.id);
}

/**
 * One publications.json entry. Co-authors are only counted; no author name is ever copied.
 * @param {Map<string, string>} advisorByAuthor OpenAlex author id → advisor id
 * @param {AreaRule[]} rules
 */
export function toPublication(work, advisorByAuthor, rules) {
  const onIt = new Set(work.authorships.map((a) => advisorByAuthor.get(short(a.author?.id))).filter(Boolean));
  return clean({
    id: short(work.id),
    title: work.display_name,
    year: work.publication_year,
    date: work.publication_date,
    type: work.type,
    venue: work.primary_location?.source?.display_name,
    ...linksOf(work),
    open_access: work.open_access?.is_oa ?? false,
    licence: work.best_oa_location?.license,
    authors: work.authorships.length,
    cited_by: work.cited_by_count ?? 0,
    advisors: [...new Set(advisorByAuthor.values())].filter((id) => onIt.has(id)), // advisor file order
    areas: areasFor(work, rules),
  });
}

/** One entry per work (a paper by two principal investigators is fetched twice), newest first. */
export function mergeWorks(entries) {
  const byId = new Map();
  for (const e of entries) {
    const seen = byId.get(e.id);
    if (seen) seen.advisors = [...new Set([...seen.advisors, ...e.advisors])];
    else byId.set(e.id, { ...e, advisors: [...e.advisors] });
  }
  const key = (e) => e.date ?? `${e.year}-01-01`;
  return [...byId.values()].sort((a, b) => key(b).localeCompare(key(a)));
}

/**
 * OpenAlex author id → advisor id, from advisor files that have an `openalex:` line. A deleted file contributes
 * nothing, so a principal investigator who withdraws is never imported again.
 * @param {{ id: string, markdown: string }[]} files
 * @returns {Map<string, string>}
 */
export function advisorAuthorMap(files) {
  const map = new Map();
  for (const f of files) for (const author of parseIdList(frontmatterField(f.markdown, 'openalex'))) map.set(author, f.id);
  return map;
}
