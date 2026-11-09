import { describe, it, expect } from 'vitest';
import { ALL, isFiltered, matchesFilters, readFilters, type Filterable } from '../src/lib/filters';

const item = (o: Partial<Filterable> = {}): Filterable => ({
  areas: ['a'], year: 2026, people: ['pi-adv-one'], text: 'fake paper one fake journal a', ...o,
});

describe('matchesFilters', () => {
  it('matches everything with no filters', () => expect(matchesFilters(item(), ALL)).toBe(true));
  it('matches an area id', () => {
    expect(matchesFilters(item(), { ...ALL, area: 'a' })).toBe(true);
    expect(matchesFilters(item(), { ...ALL, area: 'b' })).toBe(false);
  });
  it('"other" matches only items with no area', () => {
    expect(matchesFilters(item({ areas: [] }), { ...ALL, area: 'other' })).toBe(true);
    expect(matchesFilters(item(), { ...ALL, area: 'other' })).toBe(false);
  });
  it('matches the exact year', () => {
    expect(matchesFilters(item(), { ...ALL, year: '2026' })).toBe(true);
    expect(matchesFilters(item(), { ...ALL, year: '2025' })).toBe(false);
  });
  it('drops items without the chosen person, such as projects', () => {
    expect(matchesFilters(item(), { ...ALL, person: 'pi-adv-one' })).toBe(true);
    expect(matchesFilters(item({ people: [] }), { ...ALL, person: 'pi-adv-one' })).toBe(false);
  });
  it('searches literally and never throws on special characters or Thai', () => {
    for (const q of ['C++', '(', '*', 'งานวิจัย']) expect(() => matchesFilters(item(), { ...ALL, q })).not.toThrow();
    expect(matchesFilters(item({ text: 'c++ for clinicians' }), { ...ALL, q: 'C++' })).toBe(true);
    expect(matchesFilters(item({ text: 'a (draft) note' }), { ...ALL, q: '(' })).toBe(true);
    expect(matchesFilters(item(), { ...ALL, q: '(' })).toBe(false);
    expect(matchesFilters(item({ text: 'งานวิจัยปลอมแปด' }), { ...ALL, q: 'งานวิจัย' })).toBe(true);
  });
  it('trims the search and ignores case', () => expect(matchesFilters(item(), { ...ALL, q: '  FAKE  ' })).toBe(true));
});

describe('readFilters', () => {
  const known = { areas: ['a', 'b', 'other'], years: ['2026', '2025'], people: ['pi-adv-one'] };
  it('turns unknown values into all, so a stale link shows everything', () =>
    expect(readFilters(new URLSearchParams('area=gone&year=1999&person=nobody&q=%20x%20'), known)).toEqual({
      area: 'all', year: 'all', person: 'all', q: 'x',
    }));
  it('keeps known values', () =>
    expect(readFilters(new URLSearchParams('area=other&year=2025&person=pi-adv-one'), known)).toEqual({
      area: 'other', year: '2025', person: 'pi-adv-one', q: '',
    }));
  it('cuts the search to 100 characters', () =>
    expect(readFilters(new URLSearchParams(`q=${'x'.repeat(150)}`), known).q).toHaveLength(100));
});

describe('isFiltered', () => {
  it('is false for no filters and true for any one', () => {
    expect(isFiltered(ALL)).toBe(false);
    expect(isFiltered({ ...ALL, q: 'x' })).toBe(true);
    expect(isFiltered({ ...ALL, year: '2026' })).toBe(true);
  });
});
