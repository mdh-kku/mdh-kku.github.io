import { defineCollection, reference } from 'astro:content';
import { file, glob } from 'astro/loaders';
import {
  advisorSchema,
  areaSchema,
  collaboratorSchema,
  correctionSchema,
  heroSchema,
  personSchema,
  projectSchema,
  publicationSchema,
  siteSchema,
  updateSchema,
} from './lib/schemas';

// Real content lives in src/content; tests point this at fake fixtures (tests/global-setup.ts).
const base = process.env.MDH_CONTENT ?? './src/content';
const md = (name: string) => glob({ base: `${base}/${name}`, pattern: '*.md' });

export const collections = {
  people: defineCollection({ loader: md('people'), schema: ({ image }) => personSchema(image, reference) }),
  advisors: defineCollection({ loader: md('advisors'), schema: ({ image }) => advisorSchema(image) }),
  projects: defineCollection({ loader: md('projects'), schema: ({ image }) => projectSchema(image, reference) }),
  updates: defineCollection({ loader: md('updates'), schema: updateSchema(reference) }),
  hero: defineCollection({ loader: md('hero'), schema: ({ image }) => heroSchema(image) }),
  site: defineCollection({ loader: file(`${base}/site.json`), schema: siteSchema }),
  areas: defineCollection({ loader: md('areas'), schema: areaSchema }),
  // Written by scripts/import-publications.mjs. Corrections are hand-edited and keyed by OpenAlex work id.
  publications: defineCollection({ loader: file(`${base}/publications.json`), schema: publicationSchema(reference) }),
  corrections: defineCollection({
    loader: file(`${base}/publication-corrections.json`),
    schema: correctionSchema(reference),
  }),
  collaborators: defineCollection({
    loader: md('collaborators'),
    schema: ({ image }) => collaboratorSchema(image, reference),
  }),
};
