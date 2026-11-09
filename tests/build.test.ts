import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { built, builtCss } from './helpers';

describe('fixture build', () => {
  it('renders an English home page', () => {
    expect(built('index.html')).toMatch(/<html[^>]*lang="en"/);
  });
});

describe('layout', () => {
  const h = () => built('index.html');
  it('loads only the agreed fonts', () => {
    expect(h()).toContain('Google+Sans+Flex:wght,ROND@400..700,60');
    expect(h()).toContain('IBM+Plex+Mono:wght@500');
    expect(h()).not.toContain('opsz');
  });
  it('has a skip link and a main landmark', () => {
    expect(h()).toContain('href="#main"');
    expect(h()).toMatch(/<main[^>]*id="main"/);
  });
  it('has the header links', () => {
    const header = h().match(/<header[\s\S]*?<\/header>/)?.[0] ?? '';
    expect(header).toMatch(/<a href="\/research\/"[^>]*>Research &amp; publications<\/a>/);
    expect(header).toMatch(/<a href="\/people\/"[^>]*>People<\/a>/);
    expect(header).toMatch(/<a href="\/#latest"[^>]*>Latest<\/a>/);
    expect(header).not.toContain('>Projects<');
  });
  it('names the institution in the footer', () =>
    expect(h()).toContain('MDH Lab · Laboratory for Medicine, Data &amp; Health · Faculty of Medicine, Khon Kaen University, Khon Kaen, Thailand'));
  it('uses the lab name in the wordmark and page title', () => {
    expect(h()).toMatch(/class="wordmark"[^>]*>MDH Lab</);
    expect(h()).toContain('<title>MDH Lab · Laboratory for Medicine, Data &amp; Health</title>');
    expect(built('people/index.html')).toContain('<title>People · MDH Lab</title>');
  });
  it('falls back to Thai fonts', () => {
    for (const f of ['Noto Sans Thai', 'Leelawadee UI', 'Thonburi']) expect(builtCss()).toContain(f);
  });
  it('respects reduced motion', () => expect(builtCss()).toContain('prefers-reduced-motion'));
});

describe('people page', () => {
  const h = () => built('people/index.html');
  const css = () => [...h().matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n') + builtCss();
  it('gives everyone an anchor and an h2 name', () => {
    for (const id of ['ann-a', 'ben-b', 'cara-c', 'dee-d', 'pi-adv-one', 'pi-adv-two']) expect(h()).toContain(`id="${id}"`);
    expect(h()).toMatch(/<h2[^>]*>Ann Alpha<\/h2>/);
  });
  it('shows Thai names, roles and who works with whom', () => {
    expect(h()).toContain('แอน');
    expect(h()).toContain('Principal investigator');
    expect(h()).toContain('Advises:');
    expect(h()).not.toContain('Supervises:');
  });
  it("links Ann's ORCID", () => expect(h()).toContain('href="https://orcid.org/0000-0000-0000-0001"'));
  it('gives every image a non-empty alt', () => expect(h()).not.toMatch(/<img(?![^>]*\balt="[^"]+")[^>]*>/));
  it('reflows at 320px: the grid never demands more than the screen width (WCAG 1.4.10)', () =>
    expect(css().replace(/\s/g, '')).toContain('minmax(min(330px,100%),1fr)'));
  it('marks the person you arrived at with a fading tint', () => expect(css()).toMatch(/:target[^{]*\{[^}]*animation:[^;}]*arrive/));
});

describe('home: people', () => {
  const h = () => built('index.html');
  const section = () => h().match(/<section[^>]*id="people"[\s\S]*?<\/section>/)?.[0] ?? '';
  const tiles = () => [...section().matchAll(/<a[^>]*class="[^"]*\btile\b[^"]*"[^>]*>[\s\S]*?<\/a>/g)].map((m) => m[0]);
  it('shows students and principal investigators as equals, A to Z', () => {
    expect(tiles().map((t) => t.match(/<h3[^>]*>([^<]*)<\/h3>/)?.[1])).toEqual([
      'Ann Alpha', 'Ben Beta', 'Cara Gamma', 'Dee Deeprasertsuwannakulsombat', 'Rex Mentor, PhD', 'Tess Advisor, MD',
    ]);
    expect(section().match(/>Student</g)).toHaveLength(4);
    expect(section().match(/>Principal investigator</g)).toHaveLength(2);
  });
  it('says who works with whom', () => {
    expect(tiles().find((t) => t.includes('Cara Gamma'))).toContain('data-links="pi-adv-one pi-adv-two"');
    expect(section()).toContain('Advises: Ann Alpha · Cara Gamma · Dee Deeprasertsuwannakulsombat');
  });
  it('links each tile to that person on the People page', () => {
    expect(section()).toContain('href="/people/#ann-a"');
    expect(section()).toContain('href="/people/#pi-adv-one"');
  });
  it('lights up the people a tile works with in CSS, no script', () =>
    expect(h()).toContain(':has([data-key="cara-c"]:hover)'));
  it('no longer has In progress', () => {
    expect(h()).not.toContain('In progress');
    expect(h()).not.toContain('theses underway');
  });
});

describe('home: hero, latest', () => {
  const h = () => built('index.html');
  it('has the full name as the only h1', () => {
    expect(h().match(/<h1[\s>]/g)).toHaveLength(1);
    const text = h().match(/<h1[^>]*>([\s\S]*?)<\/h1>/)![1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    expect(text).toBe('Laboratory for Medicine, Data &amp; Health');
  });
  it('shows four hero photos', () => expect(h().match(/class="[^"]*\bhero-photo\b/g)).toHaveLength(4));
  it('shows the 4 newest updates, newest first', () => {
    const s = h();
    expect(s).not.toContain('Update 2024-01-10');
    expect(s.indexOf('Update 2025-12-03')).toBeLessThan(s.indexOf('Update 2024-06-01'));
    expect(s).toContain('DEC 2025');
  });
});

describe('home: goals, collaborators, work with us', () => {
  const h = () => built('index.html');
  it('makes [hidden] win over pill styles', () =>
    expect(builtCss().replace(/\s/g, '')).toContain('[hidden]{display:none!important}'));
  it('builds both mailto links', () => {
    expect(h()).toContain('mailto:lab@example.org?subject=Collaboration%20with%20MDH%20Lab');
    expect(h()).toContain('mailto:lab@example.org?subject=Funding%20for%20MDH%20Lab');
  });
  it('keeps the approved section order', () => {
    const s = h();
    const at = ['research', 'publications', 'people', 'latest', 'goals', 'collaborators', 'work-with-us'].map((id) => s.indexOf(`id="${id}"`));
    expect(at.every((p, i) => p > -1 && (i === 0 || p > at[i - 1]))).toBe(true);
    for (const gone of ['about', 'projects', 'in-progress', 'we-work-on']) expect(s).not.toContain(`id="${gone}"`);
  });
  it('sets the vision as the Goals & culture heading, then numbered principles', () => {
    const goals = h().match(/<section[^>]*id="goals"[\s\S]*?<\/section>/)?.[0] ?? '';
    expect(goals).toContain('Goals &amp; culture');
    expect(goals).toMatch(/<h2[^>]*>Fake vision for tests: every fake patient gets the best fake care\.<\/h2>/);
    const principles = [...goals.matchAll(/>(\d\d)<\/span>\s*<h3[^>]*>([^<]*)<\/h3>/g)].map((m) => `${m[1]} ${m[2]}`);
    expect(principles).toEqual(['01 Fake principle one', '02 Fake principle two', '03 Fake principle three', '04 Fake principle four']);
  });
  it('lists collaborators with a link, what they are and since when', () => {
    const c = h().match(/<section[^>]*id="collaborators"[\s\S]*?<\/section>/)?.[0] ?? '';
    expect(c).toMatch(/<a href="https:\/\/example\.org\/clinic"[^>]*>Fake Clinic<\/a>/);
    expect(c).toContain('A fake partner clinic for tests.');
    expect(c).toContain('Since 2024 · ongoing');
  });
});

describe('the new look', () => {
  const home = () => built('index.html');
  it('has no two-tone headings and no black bands', () => {
    for (const h of [home(), built('people/index.html')]) {
      expect(h).not.toContain('two-tone');
      expect(h).not.toMatch(/class="dark|\sdark"/);
    }
    expect(builtCss()).not.toContain('.dark');
  });
  it('labels Latest and gives it one plain heading', () =>
    expect(home()).toMatch(/<p class="label">Latest<\/p>\s*<h2 class="headline"[^>]*>Awards and updates<\/h2>/));
  it('heads Work with us with one plain line', () =>
    expect(home()).toMatch(/<h2 class="headline"[^>]*>Collaborate, or fund what comes next<\/h2>/));
  it('links the MSc Facebook page from the footer', () =>
    expect(home()).toMatch(/<a href="https:\/\/example\.org\/facebook"[^>]*>The MSc on Facebook ↗<\/a>/));
  it('wraps long words in h4 too (Review Focus 4)', () =>
    expect(builtCss().replace(/\s/g, '')).toContain('h1,h2,h3,h4,p,li,dd{overflow-wrap:anywhere}'));
  it('crossfades between pages instead of cutting', () =>
    expect(builtCss().replace(/\s/g, '')).toContain('@view-transition{navigation:auto}'));
});

describe('home: research areas', () => {
  const h = () => built('index.html');
  const section = () => h().match(/<section[^>]*id="research"[\s\S]*?<\/section>/)?.[0] ?? '';
  const panel = (id: string) => section().match(new RegExp(`<article[^>]*id="panel-${id}"[\\s\\S]*?</article>`))?.[0] ?? '';
  const SHOWN = ['rehab-fx', 'imaging-fx', 'data-fx', 'papers-fx'];

  it('shows the section under its plain heading', () => expect(section()).toContain('Research areas'));
  it('has a tab and a panel for each area with work, in order', () => {
    const tabs = [...section().matchAll(/role="tab"[^>]*id="tab-([^"]+)"/g)].map((m) => m[1]);
    const panels = [...section().matchAll(/role="tabpanel"[^>]*id="panel-([^"]+)"/g)].map((m) => m[1]);
    expect(tabs).toEqual(SHOWN);
    expect(panels).toEqual(SHOWN);
    expect(section()).toMatch(/id="tab-rehab-fx"[^>]*aria-selected="true"/);
  });
  it('gives every panel a pause button and keeps every panel readable without JS', () => {
    for (const id of SHOWN) {
      expect(panel(id), id).toContain('aria-label="Pause motion"');
      expect(panel(id), id).not.toMatch(/^<article[^>]*\s(hidden|inert)[\s>=]/);
    }
  });
  it('sums up each area and links to all of its research', () => {
    expect(panel('rehab-fx')).toContain('1 project · 1 publication');
    expect(panel('imaging-fx')).toContain('1 project · 2 publications');
    expect(panel('data-fx')).toContain('1 project · 4 publications');
    expect(panel('papers-fx')).toMatch(/>1 publication</);
    expect(panel('rehab-fx')).toContain('href="/research/?area=rehab-fx"');
  });
  it("shows each area's latest paper", () => {
    expect(panel('rehab-fx')).toContain('Fake paper one about');
    expect(panel('imaging-fx')).toContain('Fake paper two');
    expect(panel('data-fx')).toContain('Fake paper three');
    expect(panel('papers-fx')).toContain('Fake paper nine');
  });
  it('lists the projects, or says there are none yet', () => {
    expect(panel('rehab-fx')).toContain('Alpha');
    expect(panel('papers-fx')).toContain('No student projects here yet. This area’s work so far is our principal investigators’ publications.');
  });
  it('leaves out an area with no work', () => expect(section()).not.toContain('empty-fx'));
  it('points the hero at the research', () => expect(h()).toMatch(/<a[^>]*href="#research"[^>]*>See our research<\/a>/));
  it('keeps the pictures paused unless they are playing', () => {
    expect(builtCss()).toContain('prefers-reduced-motion');
    expect(builtCss()).toMatch(/\.anim[^{]*\{[^}]*animation-play-state:\s*paused/);
  });
  it('fades the play and pause icons in instead of swapping them', () => expect(builtCss()).toContain('@starting-style'));
});

describe("home: what we've published", () => {
  const section = () => built('index.html').match(/<section[^>]*id="publications"[\s\S]*?<\/section>/)?.[0] ?? '';
  const ID: [string, string][] = [['Fake paper one', 'W1'], ['Fake paper two', 'W2'], ['Fake paper three', 'W3'],
    ['Fake paper four', 'W4'], ['Fake dataset five', 'W5'], ['Fake review six', 'W6'], ['งานวิจัยปลอมแปด', 'W8'], ['Fake paper nine', 'W9']];
  const id = (row: string) => ID.find(([t]) => row.includes(t))?.[1];
  const isHidden = (row: string) => /^[^>]*\shidden[\s>]/.test(row);
  const rows = () => section().split('<li class="pubrow"').slice(1);

  it('shows the computed stats line', () => expect(section()).toContain('8 works · 2020–2026 · 4 free to read'));
  it('is a GET form to the research page with the same four filters', () => {
    expect(section()).toMatch(/<form[^>]*action="\/research\/"[^>]*method="get"/);
    for (const n of ['area', 'year', 'person', 'q']) expect(section()).toContain(`name="${n}"`);
    expect(section()).toMatch(/<button type="submit"[^>]*data-see-all[^>]*>See all 8<\/button>/);
  });
  it('counts publications under each pill', () => {
    const pills = [...section().matchAll(/<span[^>]*>([^<]+)<i[^>]*>(\d+)<\/i><\/span>/g)].map((m) => `${m[1]} ${m[2]}`);
    expect(pills).toEqual(['All 8', 'Rehabilitation 1', 'Imaging 2', 'Health data 4', 'Papers only 1', 'Other 1']);
  });
  it('shows the five newest papers and keeps every other work hidden', () => {
    expect(rows().filter((r) => !isHidden(r)).map(id)).toEqual(['W1', 'W2', 'W3', 'W4', 'W6']);
    expect(rows().filter(isHidden).map(id)).toEqual(['W5', 'W8', 'W9']);
  });
  it('labels the list and ships its empty state hidden', () => {
    expect(section()).toMatch(/data-result-label[^>]*>Recent</);
    expect(section()).toMatch(/<p[^>]*hidden[^>]*>Nothing matches\. Try another word or area\.<\/p>/);
  });
});

describe('research page', () => {
  const r = () => built('research/index.html');
  const rows = () => r().split('<li class="pubrow"').slice(1).map((s) => s.split('</li>')[0]);
  const rowOf = (title: string) => rows().find((s) => s.includes(title)) ?? '';
  const links = (title: string) => [...rowOf(title).matchAll(/<a[^>]*>([^<]+)<\/a>/g)].map((m) => m[1]);
  const options = (name: string) => {
    const select = r().match(new RegExp(`<select[^>]*name="${name}"[\\s\\S]*?</select>`))?.[0] ?? '';
    return [...select.matchAll(/<option[^>]*>([^<]*)<\/option>/g)].map((m) => m[1]);
  };
  const css = () => [...r().matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n') + builtCss();

  it('has its title, heading and lede', () => {
    expect(r()).toContain('<title>Research &amp; publications · MDH Lab</title>');
    expect(r()).toMatch(/<h1[^>]*>The work behind MDH Lab<\/h1>/);
    expect(r()).toContain('Projects our students are building now, and every paper our principal investigators have published. Filter by research area, year or person.');
  });
  it('offers the people on the publications, A to Z, with counts', () =>
    expect(options('person')).toEqual(['Everyone', 'Rex Mentor, PhD (5)', 'Tess Advisor, MD (4)']));
  it('is a GET form with area radios, year, person and search', () => {
    expect(r()).toMatch(/<form[^>]*method="get"[^>]*data-finder/);
    expect(r()).toMatch(/<select[^>]*name="year"/);
    expect(r()).toMatch(/<input[^>]*type="search"[^>]*name="q"/);
    const radios = [...r().matchAll(/<input[^>]*type="radio"[^>]*name="area"[^>]*value="([^"]*)"/g)].map((m) => m[1]);
    expect(radios).toEqual(['all', 'rehab-fx', 'imaging-fx', 'data-fx', 'papers-fx', 'other']);
  });
  it('counts projects and publications under each area pill', () => {
    const pills = [...r().matchAll(/<span[^>]*>([^<]+)<i[^>]*>(\d+)<\/i><\/span>/g)].map((m) => `${m[1]} ${m[2]}`);
    expect(pills).toEqual(['All 11', 'Rehabilitation 2', 'Imaging 3', 'Health data 5', 'Papers only 1', 'Other 1']);
  });
  it('lists every shown work, grouped by year, newest first', () => {
    expect(rows()).toHaveLength(8);
    expect(r()).not.toContain('Fake preprint seven');
    expect([...r().matchAll(/data-year-group="(\d+)"/g)].map((m) => m[1])).toEqual(['2026', '2025', '2023', '2021', '2020']);
  });
  it('gives each row the right buttons, never two to one place', () => {
    expect(links('Fake paper one')).toEqual(['PDF', 'DOI']);
    expect(rowOf('Fake paper two')).toMatch(/<a[^>]*href="https:\/\/example\.org\/pmc\/w2"[^>]*title="Free copy at PubMed Central"[^>]*>Free copy<\/a>/);
    expect(links('Fake paper three')).toEqual(['DOI']);
    expect(links('Fake review six')).toEqual(['Link']);
    expect(rowOf('Fake review six')).toContain('href="https://example.org/w6"');
    expect(rowOf('งานวิจัยปลอมแปด')).toContain('href="https://openalex.org/W8"');
  });
  it('names lab people in bold and only counts co-authors', () => {
    expect(rowOf('Fake paper one')).toMatch(/<b[^>]*>Tess Advisor, MD<\/b> and 4 co-authors/);
    const four = rowOf('Fake paper four');
    expect(four).toMatch(/<b[^>]*>Tess Advisor, MD<\/b> · <b[^>]*>Rex Mentor, PhD<\/b>/);
    expect(four).not.toContain('co-author');
    expect(four).toMatch(/^[^>]*data-areas="data-fx"/);
  });
  it('escapes titles and keeps Thai', () => {
    expect(r()).toContain('Fake paper one about &lt;i&gt;voice&lt;/i&gt; games');
    expect(r()).toContain('งานวิจัยปลอมแปด');
  });
  it('lists projects in progress: featured first, then newest', () => {
    const at = ['>Alpha<', '>Beta<', '>Gamma<'].map((t) => r().indexOf(t));
    expect(at.every((p, i) => p > -1 && (i === 0 || p > at[i - 1]))).toBe(true);
  });
  it('shows next stage, awards, team and one Learn more on project cards', () => {
    for (const t of ['Next: clinical stage', 'Update 2025-12-03', 'Ann Alpha with Zed Outside']) expect(r()).toContain(t);
    expect(r()).toMatch(/Learn more<span class="sr-only"[^>]*> about Alpha<\/span>/);
    expect(r().match(/>\s*Learn more/g)).toHaveLength(1);
    expect(built('people/index.html')).not.toContain('Zed Outside');
  });
  it('ships both empty states hidden', () => {
    expect(r()).toMatch(/<p[^>]*hidden[^>]*>Nothing matches these filters\.<\/p>/);
    expect(r()).toMatch(/<p[^>]*hidden[^>]*>No papers in this area yet\. Its work so far is the project above\.<\/p>/);
  });
  it('gives every image a non-empty alt', () => expect(r()).not.toMatch(/<img(?![^>]*\balt="[^"]+")[^>]*>/));
  it('makes the pinned filter bar solid when people ask for less transparency', () =>
    expect(css()).toContain('prefers-reduced-transparency'));
});

describe('sharing and hygiene', () => {
  it('has share tags with an absolute image URL', () => {
    const s = built('index.html');
    expect(s).toMatch(/<meta property="og:image" content="https:\/\/[^"]+\/og\.png"/);
    expect(s).toContain('summary_large_image');
  });
  it('lists every page in the sitemap', () => {
    const x = built('sitemap.xml');
    expect(x.match(/<loc>/g)).toHaveLength(3);
    expect(x).toContain('/people/');
    expect(x).toContain('/research/');
  });
  it('has a 404 page', () => {
    expect(built('404.html')).toContain('Page not found');
    expect(built('404.html')).toContain('It may have moved.');
  });
  it('has a 1200×630 share image', async () => {
    const sharp = (await import('sharp')).default;
    const m = await sharp('public/og.png').metadata();
    expect([m.width, m.height]).toEqual([1200, 630]);
  });
  it('has no placeholder words in src/', () => {
    const walk = (d: string): string[] => readdirSync(d).flatMap(f => statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]);
    const hits = walk('src').filter(f => /\.(astro|ts|css|md|json)$/.test(f))
      .filter(f => /\b(lorem|todo|tbd)\b|\bplaceholder\b(?!=)/i.test(readFileSync(f, 'utf8')));
    expect(hits).toEqual([]);
  });
});
