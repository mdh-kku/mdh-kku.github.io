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

export function thesesHeadline(n: number): string {
  return `${cap(numberWord(n))} ${n === 1 ? 'thesis' : 'theses'} underway.`;
}

export function aboutLead(n: number): string {
  return (
    `${cap(numberWord(n))} medical ${n === 1 ? 'student' : 'students'} earning an MSc in Data Science and Health Informatics ` +
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
