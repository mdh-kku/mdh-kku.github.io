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
