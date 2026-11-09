/** Publication and project filters, shared by the homepage finder and the Research & publications page. No DOM. */

export type Filters = { area: string; year: string; person: string; q: string };
export const ALL: Filters = { area: 'all', year: 'all', person: 'all', q: '' };

/** What one listed item offers the filters. `text` is already lower-case. */
export type Filterable = { areas: string[]; year: number; people: string[]; text: string };

export function matchesFilters(item: Filterable, f: Filters): boolean {
  if (f.area === 'other' ? item.areas.length > 0 : f.area !== 'all' && !item.areas.includes(f.area)) return false;
  if (f.year !== 'all' && String(item.year) !== f.year) return false;
  if (f.person !== 'all' && !item.people.includes(f.person)) return false; // projects name no one, so they drop out
  const q = f.q.trim().toLowerCase();
  return !q || item.text.includes(q); // literal: no regular expression to break on "C++" or "("
}

/** Reads filters from a URL. A stale or shared link with unknown values falls back to "all" instead of an empty list. */
export function readFilters(
  params: URLSearchParams,
  known: { areas: string[]; years: string[]; people: string[] },
): Filters {
  const pick = (key: string, ok: string[]) => {
    const value = params.get(key) ?? '';
    return ok.includes(value) ? value : 'all';
  };
  return {
    area: pick('area', known.areas),
    year: pick('year', known.years),
    person: pick('person', known.people),
    q: (params.get('q') ?? '').trim().slice(0, 100),
  };
}

export function isFiltered(f: Filters): boolean {
  return f.area !== 'all' || f.year !== 'all' || f.person !== 'all' || f.q.trim() !== '';
}
