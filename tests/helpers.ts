import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const OUT = 'dist-fixtures';

/** Reads a file from the fixture build, e.g. built('people/index.html'). */
export const built = (path: string): string => readFileSync(join(OUT, path), 'utf8');

/** All CSS the fixture home page uses: bundled files plus inlined <style> blocks. */
export function builtCss(): string {
  const dir = join(OUT, '_astro');
  const files = existsSync(dir)
    ? readdirSync(dir).filter((f) => f.endsWith('.css')).map((f) => readFileSync(join(dir, f), 'utf8'))
    : [];
  const inline = [...built('index.html').matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]);
  return [...files, ...inline].join('\n');
}
