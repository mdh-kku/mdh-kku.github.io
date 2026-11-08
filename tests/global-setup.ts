import { execSync } from 'node:child_process';

/** Builds the site from fake fixture content once, before any test runs. */
export function setup() {
  execSync('npx astro build', {
    stdio: 'inherit',
    env: { ...process.env, MDH_CONTENT: './tests/fixtures/content', MDH_OUT: './dist-fixtures' },
  });
}
