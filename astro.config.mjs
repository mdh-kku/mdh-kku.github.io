// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://mdh-kku.github.io',
  // Tests build fake fixture content into a separate folder (see tests/global-setup.ts).
  outDir: process.env.MDH_OUT ?? './dist',
  // Astro 7 defaults to 'jsx', which drops spaces between inline elements.
  compressHTML: true,
});
