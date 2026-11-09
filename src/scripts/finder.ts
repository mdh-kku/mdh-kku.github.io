// Live filtering for the homepage finder and the Research & publications page. Rows are rendered by Astro; this
// only shows and hides them. Filtering is instant on purpose: people refine many times and are reading the result.
import { isFiltered, matchesFilters, readFilters, type Filterable, type Filters } from '../lib/filters';

type Item = { el: HTMLElement; work: boolean; paper: boolean; data: Filterable };

const textOf = (el: HTMLElement) =>
  ['h3', 'h4', '.venue', '.summary'].map((s) => el.querySelector(s)?.textContent ?? '').join(' ').toLowerCase();

export function initFinder(root: HTMLElement, opts: { limit?: number; syncUrl: boolean }): void {
  const form = root.querySelector<HTMLFormElement>('[data-finder]');
  if (!form) return;
  const radios = [...form.querySelectorAll<HTMLInputElement>('input[name="area"]')];
  const year = form.querySelector<HTMLSelectElement>('select[name="year"]')!;
  const person = form.querySelector<HTMLSelectElement>('select[name="person"]')!;
  const q = form.querySelector<HTMLInputElement>('input[name="q"]')!;

  const items: Item[] = [...root.querySelectorAll<HTMLElement>('.pubrow, .project-card')].map((el) => ({
    el,
    work: el.classList.contains('pubrow'),
    paper: el.dataset.paper !== 'false',
    data: {
      areas: (el.dataset.areas ?? '').split(' ').filter(Boolean),
      year: Number(el.dataset.year),
      people: (el.dataset.people ?? '').split(' ').filter(Boolean),
      text: textOf(el),
    },
  }));
  const totalWorks = items.filter((i) => i.work).length;

  const read = (): Filters => ({
    area: radios.find((r) => r.checked)?.value ?? 'all',
    year: year.value,
    person: person.value,
    q: q.value,
  });
  const setText = (selector: string, text: string) => {
    const el = root.querySelector(selector);
    if (el) el.textContent = text;
  };
  const show = (selector: string, on: boolean) => {
    const el = root.querySelector<HTMLElement>(selector);
    if (el) el.hidden = !on;
  };

  const apply = () => {
    const f = read();
    const filtered = isFiltered(f);
    const matches = items.filter((i) => matchesFilters(i.data, f));
    const works = matches.filter((i) => i.work).length;
    // With a limit (the homepage), unfiltered shows the newest papers; filtered shows the first matches of any type.
    const shown = new Set(
      opts.limit === undefined ? matches : (filtered ? matches : matches.filter((i) => i.paper)).slice(0, opts.limit),
    );
    for (const i of items) i.el.hidden = !shown.has(i);
    for (const g of root.querySelectorAll<HTMLElement>('[data-year-group]')) g.hidden = !g.querySelector('.pubrow:not([hidden])');
    show('[data-projects]', Boolean(root.querySelector('.project-card:not([hidden])')));

    setText('[data-count]', `${works} of ${totalWorks} works`);
    setText('[data-works]', `${works} ${works === 1 ? 'work' : 'works'}`);
    setText('[data-see-all]', works > 0 ? `See all ${works}` : 'See all');
    setText('[data-result-label]', filtered ? `${works} matching` : 'Recent');
    show('[data-clear]', filtered);
    show('[data-empty]', matches.length === 0);
    show('[data-empty-papers]', matches.length > 0 && works === 0 && f.area !== 'all' && f.area !== 'other');

    if (opts.syncUrl) {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(f)) if (value.trim() && value !== 'all') params.set(key, value.trim());
      history.replaceState(null, '', params.toString() ? `?${params}` : location.pathname);
    }
  };

  if (opts.syncUrl) {
    // A shared or stale link: unknown values fall back to "All" instead of an empty list.
    const f = readFilters(new URLSearchParams(location.search), {
      areas: radios.map((r) => r.value).filter((v) => v !== 'all'),
      years: [...year.options].map((o) => o.value).filter((v) => v !== 'all'),
      people: [...person.options].map((o) => o.value).filter((v) => v !== 'all'),
    });
    for (const r of radios) r.checked = r.value === f.area;
    year.value = f.year;
    person.value = f.person;
    q.value = f.q;
    // Already on the full page: Enter in the search box filters here instead of reloading.
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      apply();
    });
  }
  form.addEventListener('input', apply);
  form.addEventListener('change', apply);
  root.querySelector('[data-clear]')?.addEventListener('click', () => {
    form.reset();
    apply();
  });
  apply();
}
