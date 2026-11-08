import { describe, it, expect } from 'vitest';
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
    for (const t of ['>Projects<', '>People<', '>Latest<']) expect(h()).toContain(t);
    expect(h()).toContain('href="/people/"');
  });
  it('names the institution in the footer', () =>
    expect(h()).toContain('MDH · Medical Data Science and Health Informatics · Faculty of Medicine, Khon Kaen University, Khon Kaen, Thailand'));
  it('falls back to Thai fonts', () => {
    for (const f of ['Noto Sans Thai', 'Leelawadee UI', 'Thonburi']) expect(builtCss()).toContain(f);
  });
  it('respects reduced motion', () => expect(builtCss()).toContain('prefers-reduced-motion'));
});

describe('people page', () => {
  const h = () => built('people/index.html');
  it('lists every student with an anchor', () => {
    for (const id of ['ann-a', 'ben-b', 'cara-c', 'dee-d']) expect(h()).toContain(`id="${id}"`);
  });
  it('shows the role and field labels', () => {
    for (const t of ['MD/MSc student', 'Research interest', 'Thesis topic', 'Advisors.']) expect(h()).toContain(t);
  });
  it('shows Thai names', () => expect(h()).toContain('แอน'));
  it('links students to advisors and lists who each supervises', () => {
    expect(h()).toContain('href="#advisor-adv-one"');
    expect(h()).toMatch(/Supervises:[^<]*Ann Alpha/);
  });
  it('gives every image a non-empty alt', () => expect(h()).not.toMatch(/<img(?![^>]*\balt="[^"]+")[^>]*>/));
});

describe('home: hero, projects, latest', () => {
  const h = () => built('index.html');
  it('has the full name as the only h1', () => {
    expect(h().match(/<h1[\s>]/g)).toHaveLength(1);
    expect(h()).toMatch(/<h1[^>]*>\s*Medical Data Science &amp; Health Informatics\s*<\/h1>/);
  });
  it('shows four hero photos', () => expect(h().match(/class="[^"]*\bhero-photo\b/g)).toHaveLength(4));
  it('orders projects featured first, then newest', () => {
    const s = h();
    expect(s.indexOf('>Alpha<')).toBeLessThan(s.indexOf('>Beta<'));
    expect(s.indexOf('>Beta<')).toBeLessThan(s.indexOf('>Gamma<'));
  });
  it('shows Learn more only for projects with a link', () => expect(h().match(/>\s*Learn more\s*</g)).toHaveLength(1));
  it('credits contributors on projects, not on People', () => {
    expect(h()).toContain('Zed Outside');
    expect(built('people/index.html')).not.toContain('Zed Outside');
  });
  it('shows the 4 newest updates, newest first', () => {
    const s = h();
    expect(s).not.toContain('Update 2024-01-10');
    expect(s.indexOf('Update 2025-12-03')).toBeLessThan(s.indexOf('Update 2024-06-01'));
    expect(s).toContain('DEC 2025');
  });
});
