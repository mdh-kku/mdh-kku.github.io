import { z } from 'astro/zod';

/** Astro's image() schema helper (a plain stand-in in tests). */
type ImageFn = () => z.ZodType;
/** Astro's reference() schema helper (a plain stand-in in tests). */
type RefFn = (collection: 'people' | 'advisors' | 'projects' | 'areas') => z.ZodType;

const text = (min: number, max?: number) => (max ? z.string().min(min).max(max) : z.string().min(min));

/** Picture styles for a Research area's generated pattern. */
export const ART_KINDS = ['wave', 'cells', 'flow', 'scatter', 'rings', 'hexes'] as const;
export type Art = (typeof ART_KINDS)[number];

/** Match rules feed the publication import, so a pattern that does not compile stops the build here instead. */
const pattern = z.string().refine(
  (s) => {
    try {
      new RegExp(s, 'i');
      return true;
    } catch {
      return false;
    }
  },
  { message: 'Not a valid pattern' },
);

/**
 * Dates must be ISO (2025-12-03). YAML turns those into Date objects; a day-first string like 03/12/2025
 * is rejected instead of being silently read as March.
 */
const isoDate = z.union([z.date(), z.iso.date()]).pipe(z.coerce.date());

/** Every link the site renders: web addresses only, so a `javascript:` or `data:` value (say, in imported
 * OpenAlex data) can never become a clickable script link. */
const link = z.url({ protocol: /^https?$/ });

/** A photo is only allowed with alt text. */
const hasAlt = (photo: unknown, alt: unknown) => !photo || (typeof alt === 'string' && alt.length > 0);

export const personSchema = (image: ImageFn, ref: RefFn) =>
  z
    .object({
      name: text(1),
      name_th: text(1),
      cohort: z.number().int(),
      photo: image().optional(),
      photo_alt: z.string().optional(),
      consent: z.literal(true),
      consent_date: isoDate,
      research_interest: text(20, 300),
      thesis_topic: text(10, 160),
      advisors: z.array(ref('advisors')).min(1),
      links: z
        .object({
          orcid: link.optional(),
          scholar: link.optional(),
          github: link.optional(),
          linkedin: link.optional(),
          email: z.email().optional(),
        })
        .optional(),
    })
    .refine((p) => hasAlt(p.photo, p.photo_alt), { message: 'A photo needs photo_alt', path: ['photo_alt'] });

export const advisorSchema = (image: ImageFn) =>
  z
    .object({
      name: text(1),
      title: text(1),
      department: text(1),
      research_interest: text(20, 300),
      photo: image().optional(),
      photo_alt: z.string().optional(),
      profile_url: link.optional(),
      /** OpenAlex author ids, read only by the publication import. */
      openalex: z.array(z.string().regex(/^A\d+$/, 'An OpenAlex author id looks like A5027417160')).default([]),
      orcid: link.optional(),
      consent: z.literal(true),
    })
    .refine((a) => hasAlt(a.photo, a.photo_alt), { message: 'A photo needs photo_alt', path: ['photo_alt'] });

export const projectSchema = (image: ImageFn, ref: RefFn) =>
  z
    .object({
      name: text(1),
      summary: text(1, 120),
      year: z.number().int().min(2000).max(2100),
      area: ref('areas'),
      image: image().optional(),
      image_alt: z.string().optional(),
      team: z.array(ref('people')).default([]),
      contributors: z.array(z.string()).default([]),
      advisors: z.array(ref('advisors')).default([]),
      next: z.string().max(60).optional(),
      featured: z.boolean().default(false),
      link: link.optional(),
    })
    .refine((p) => hasAlt(p.image, p.image_alt), { message: 'An image needs image_alt', path: ['image_alt'] });

export const updateSchema = (ref: RefFn) =>
  z
    .object({
      date: isoDate,
      title: text(1, 90),
      kind: z.enum(['award', 'milestone', 'talk', 'paper']),
      detail: text(1, 160),
      project: ref('projects').optional(),
      people: z.array(ref('people')).default([]),
      source_url: link.optional(),
      confirmed_by: text(1),
    })
    .refine((u) => u.kind !== 'award' || Boolean(u.source_url), {
      message: 'An award needs source_url',
      path: ['source_url'],
    });

export const heroSchema = (image: ImageFn) =>
  z.object({
    image: image(),
    alt: text(1),
    consent: z.literal(true),
    color: z.boolean().default(false),
  });

export const areaSchema = z.object({
  name: text(1, 40),
  description: text(10, 140),
  color: z.string().regex(/^#[0-9a-f]{6}$/i, 'Use a hex colour such as #2f5fd0'),
  art: z.enum(ART_KINDS),
  order: z.number().int(),
  match_topics: pattern.optional(),
  match_titles: pattern.optional(),
});

/** One entry of publications.json, written by scripts/import-publications.mjs. The id is the OpenAlex work id. */
export const publicationSchema = (ref: RefFn) =>
  z.object({
    title: text(1),
    year: z.number().int(),
    date: isoDate.optional(),
    type: text(1),
    venue: z.string().optional(),
    free_at: z.string().optional(),
    licence: z.string().optional(),
    doi: link.optional(),
    pdf: link.optional(),
    free: link.optional(),
    url: link.optional(),
    open_access: z.boolean(),
    authors: z.number().int().min(1),
    cited_by: z.number().int().min(0).default(0),
    advisors: z.array(ref('advisors')).min(1),
    areas: z.array(ref('areas')).default([]),
  });

/** Hand corrections applied after the import, so a re-import never undoes them. */
export const correctionSchema = (ref: RefFn) =>
  z.object({
    areas: z.array(ref('areas')).optional(),
    hidden: z.boolean().default(false),
  });

export const collaboratorSchema = (image: ImageFn, ref: RefFn) =>
  z
    .object({
      name: text(1),
      kind: z.enum(['organisation', 'person']),
      what: text(1, 120),
      url: link.optional(),
      since: z.number().int().min(1990).max(2100),
      ongoing: z.boolean(),
      logo: image().optional(),
      logo_alt: z.string().optional(),
      projects: z.array(ref('projects')).default([]),
      consent: z.literal(true),
    })
    .refine((c) => hasAlt(c.logo, c.logo_alt), { message: 'A logo needs logo_alt', path: ['logo_alt'] });

export const siteSchema = z.object({
  email: z.email().optional(),
  facebook: link.optional(),
  vision: text(10, 200).optional(),
  principles: z.array(z.object({ title: text(1, 40), line: text(1, 160) })).max(6).default([]),
});
