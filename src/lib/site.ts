/** Pure display rules: ordering, counts, visibility and copy. No Astro imports, so tests can use them directly. */

const WORDS = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Featured projects first, then newest year first. */
export function orderProjects<T extends { featured: boolean; year: number }>(items: T[], max = 6): T[] {
  return [...items].sort((a, b) => Number(b.featured) - Number(a.featured) || b.year - a.year).slice(0, max);
}

/** Newest first. */
export function latestFirst<T extends { date: Date }>(items: T[], max = 4): T[] {
  return [...items].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, max);
}

/** Launch rule: a section with fewer than `min` items stays hidden instead of looking empty. */
export function showSection(count: number, min = 3): boolean {
  return count >= min;
}

/** 1–10 as a word, anything else as digits. */
export function numberWord(n: number): string {
  return WORDS[n - 1] ?? String(n);
}

export function aboutLead(n: number): string {
  // Before anyone is added there is no number to show, never "0 medical students".
  const who = n < 1 ? 'Medical students' : `${cap(numberWord(n))} medical ${n === 1 ? 'student' : 'students'}`;
  return (
    `${who} earning an MSc in Data Science and Health Informatics ` +
    'alongside the MD, working with faculty advisors at the Faculty of Medicine, Khon Kaen University.'
  );
}

/** Ids of the people whose advisors include `advisorId`. */
export function supervisedBy(advisorId: string, people: { id: string; advisorIds: string[] }[]): string[] {
  return people.filter((p) => p.advisorIds.includes(advisorId)).map((p) => p.id);
}

export function mailtoHref(email: string, subject: string): string {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}`;
}

/** The hero shows photos only when there are enough to look intentional. */
export function heroPhotosToShow<T>(photos: T[], min = 4, max = 4): T[] {
  return photos.length < min ? [] : photos.slice(0, max);
}

/** Unwraps a value that must exist; the message tells a maintainer which file to fix. */
export function must<T>(value: T | undefined, message: string): T {
  if (value === undefined) throw new Error(message);
  return value;
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

/** Research areas worth a slide: those with at least one project or publication, in their set order. */
export function visibleAreas<A extends { id: string; order: number }>(
  areas: A[],
  projects: { area: { id: string } }[],
  pubs: { areas: string[] }[],
): A[] {
  const used = new Set([...projects.map((p) => p.area.id), ...pubs.flatMap((p) => p.areas)]);
  return areas.filter((a) => used.has(a.id)).sort((a, b) => a.order - b.order);
}

/** "1 project · 2 publications"; zero parts are left out. */
export function countsLine(projects: number, publications: number): string {
  return [projects && plural(projects, 'project'), publications && plural(publications, 'publication')]
    .filter(Boolean)
    .join(' · ');
}

/** "267 works · 2007–2026 · 178 free to read". Only shown when there is at least one work. */
export function statsLine(pubs: { year: number; openAccess: boolean }[]): string {
  const years = pubs.map((p) => p.year);
  const [first, last] = [Math.min(...years), Math.max(...years)];
  const span = first === last ? `${first}` : `${first}–${last}`;
  return `${plural(pubs.length, 'work')} · ${span} · ${pubs.filter((p) => p.openAccess).length} free to read`;
}

/** Datasets and preprints usually duplicate a paper, so "Recent" and "Latest publication" skip them. */
export function isPaper(type: string): boolean {
  return type !== 'dataset' && type !== 'preprint';
}

const when = (p: { date?: Date; year: number }) => (p.date ?? new Date(Date.UTC(p.year, 0, 1))).getTime();

/** Newest first by publication date (else 1 January of its year), then most cited. */
export function byNewest<T extends { date?: Date; year: number; citedBy: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => when(b) - when(a) || b.citedBy - a.citedBy);
}

export function recentPublications<T extends { type: string; date?: Date; year: number; citedBy: number }>(
  pubs: T[],
  n = 5,
): T[] {
  return byNewest(pubs.filter((p) => isPaper(p.type))).slice(0, n);
}

export function latestPublication<
  T extends { type: string; date?: Date; year: number; citedBy: number; areas: string[] },
>(pubs: T[], areaId: string): T | undefined {
  return recentPublications(pubs.filter((p) => p.areas.includes(areaId)), 1)[0];
}

export type PublicationButton = { label: 'PDF' | 'Free copy' | 'DOI' | 'Link'; href: string; title?: string };

/** PDF, then a free copy on another site, then the DOI (else the publisher's page, else OpenAlex). Never two to one place. */
export function publicationButtons(p: {
  id: string;
  pdf?: string;
  free?: string;
  freeAt?: string;
  doi?: string;
  url?: string;
}): PublicationButton[] {
  const buttons: PublicationButton[] = [];
  if (p.pdf) buttons.push({ label: 'PDF', href: p.pdf });
  if (p.free && ![p.doi, p.url, p.pdf].includes(p.free)) {
    buttons.push({ label: 'Free copy', href: p.free, title: `Free copy at ${p.freeAt ?? 'another site'}` });
  }
  const last: PublicationButton = p.doi
    ? { label: 'DOI', href: p.doi }
    : { label: 'Link', href: p.url ?? `https://openalex.org/${p.id}` };
  if (!buttons.some((b) => b.href === last.href)) buttons.push(last);
  return buttons;
}

/** Co-authors outside the lab are counted, never named. */
export function coauthors(p: { authors: number; people: unknown[] }): number {
  return Math.max(0, p.authors - p.people.length);
}

const TYPE_LABELS: Record<string, string> = {
  review: 'Review',
  dataset: 'Dataset',
  preprint: 'Preprint',
  'conference-paper': 'Conference paper',
  'conference-abstract': 'Conference abstract',
  'book-chapter': 'Book chapter',
  'reference-entry': 'Reference entry',
  letter: 'Letter',
};

/** A label for every type except a plain article. */
export function typeLabel(type: string): string {
  return TYPE_LABELS[type] ?? '';
}

export function twoDigits(n: number): string {
  return String(n).padStart(2, '0');
}

/** The lab people who appear on publications, A to Z, with how many works each: the "Person" filter. */
export function peopleOnPublications(pubs: { people: { key: string; name: string }[] }[]) {
  const byKey = new Map<string, { key: string; name: string; count: number }>();
  for (const p of pubs.flatMap((w) => w.people)) {
    byKey.set(p.key, { key: p.key, name: p.name, count: (byKey.get(p.key)?.count ?? 0) + 1 });
  }
  return [...byKey.values()].sort((a, b) => a.name.localeCompare(b.name));
}

type Img = import('astro').ImageMetadata;

/** One card in the People grid: a student or a principal investigator, shown as equals. */
export type PersonCardData = {
  key: string;
  anchor: string;
  kind: 'student' | 'pi';
  name: string;
  role: 'Student' | 'Principal investigator';
  /** A student's thesis topic; a principal investigator's department · research interest. */
  line: string;
  /** "Advisor: …" on a student, "Advises: …" on a principal investigator; empty when there is no one. */
  relation: string;
  /** Keys of the cards to light up alongside this one. */
  linked: string[];
  initials: string;
  photo?: Img;
  photoAlt?: string;
  nameTh?: string;
  title?: string;
  researchInterest?: string;
  links?: { label: string; href: string }[];
};

const initialsOf = (name: string) =>
  name
    .split(',')[0]
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

const STUDENT_LINKS = [
  ['orcid', 'ORCID'],
  ['scholar', 'Google Scholar'],
  ['github', 'GitHub'],
  ['linkedin', 'LinkedIn'],
  ['email', 'Email'],
] as const;

/** Students and principal investigators in one A-to-Z list. Who works with whom is derived, never typed. */
export function peopleCards(
  people: import('./content').PersonView[],
  advisors: import('./content').AdvisorView[],
): PersonCardData[] {
  const nameOf = new Map(advisors.map((a) => [a.id, a.name]));
  const students = people.map(
    (p): PersonCardData => ({
      key: p.id,
      anchor: p.id,
      kind: 'student',
      name: p.name,
      role: 'Student',
      line: p.thesisTopic,
      relation: `${p.advisors.length === 1 ? 'Advisor' : 'Advisors'}: ${p.advisors.map((a) => nameOf.get(a.id) ?? a.label).join(' · ')}`,
      linked: p.advisors.map((a) => `pi-${a.id}`),
      initials: initialsOf(p.name),
      photo: p.photo,
      photoAlt: p.photoAlt,
      nameTh: p.nameTh,
      researchInterest: p.researchInterest,
      links: STUDENT_LINKS.filter(([k]) => p.links[k]).map(([k, label]) => ({
        label,
        href: k === 'email' ? `mailto:${p.links.email}` : p.links[k]!,
      })),
    }),
  );
  const pis = advisors.map(
    (a): PersonCardData => ({
      key: `pi-${a.id}`,
      anchor: `pi-${a.id}`,
      kind: 'pi',
      name: a.name,
      role: 'Principal investigator',
      line: `${a.department} · ${a.researchInterest}`,
      relation: a.supervises.length > 0 ? `Advises: ${a.supervises.map((s) => s.name).join(' · ')}` : '',
      linked: a.supervises.map((s) => s.id),
      initials: initialsOf(a.name),
      photo: a.photo,
      photoAlt: a.photoAlt,
      title: a.title,
      links: [
        ...(a.orcid ? [{ label: 'ORCID', href: a.orcid }] : []),
        ...(a.profileUrl ? [{ label: 'Profile', href: a.profileUrl }] : []),
      ],
    }),
  );
  return [...students, ...pis].sort((x, y) => x.name.localeCompare(y.name));
}

/** CSS that lights up the people a card works with while it is hovered (mouse only) or holds focus. No script. */
export function peopleLinkCss(cards: { key: string; linked: string[] }[], scope: string): string {
  const lit = 'background:#eaf1ff;box-shadow:inset 0 0 0 1.5px rgba(47,95,208,.35)';
  const rules = (state: string) =>
    cards
      .filter((c) => c.linked.length > 0)
      .map((c) => `${scope}:has([data-key="${c.key}"]${state}) :is(${c.linked.map((k) => `[data-key="${k}"]`).join(',')}){${lit}}`)
      .join('');
  return `@media (hover:hover) and (pointer:fine){${rules(':hover')}}${rules(':focus-within')}`;
}

/** One filter pill per area, counting the items listed under it, then "Other" for items in no area. */
export function areaPills(areas: { id: string; name: string }[], items: { areas: string[] }[]) {
  return [
    ...areas.map((a) => ({ id: a.id, name: a.name, count: items.filter((i) => i.areas.includes(a.id)).length })),
    { id: 'other', name: 'Other', count: items.filter((i) => i.areas.length === 0).length },
  ];
}
