import { z } from 'astro/zod';

/** Astro's image() schema helper (a plain stand-in in tests). */
type ImageFn = () => z.ZodType;
/** Astro's reference() schema helper (a plain stand-in in tests). */
type RefFn = (collection: 'people' | 'advisors' | 'projects') => z.ZodType;

const text = (min: number, max?: number) => (max ? z.string().min(min).max(max) : z.string().min(min));

/** 3–6 lowercase words, shown in the "We work on:" list. */
const INDEX_PHRASE = /^[a-z0-9'-]+(?: [a-z0-9'-]+){2,5}$/;

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
      consent_date: z.coerce.date(),
      research_interest: text(20, 300),
      index_phrase: z.string().regex(INDEX_PHRASE, 'Use 3–6 lowercase words'),
      thesis_topic: text(10, 160),
      advisors: z.array(ref('advisors')).min(1),
      links: z
        .object({
          orcid: z.url().optional(),
          scholar: z.url().optional(),
          github: z.url().optional(),
          linkedin: z.url().optional(),
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
      profile_url: z.url().optional(),
      consent: z.literal(true),
    })
    .refine((a) => hasAlt(a.photo, a.photo_alt), { message: 'A photo needs photo_alt', path: ['photo_alt'] });

export const projectSchema = (image: ImageFn, ref: RefFn) =>
  z
    .object({
      name: text(1),
      summary: text(1, 120),
      year: z.number().int().min(2000).max(2100),
      area: text(1),
      image: image().optional(),
      image_alt: z.string().optional(),
      team: z.array(ref('people')).default([]),
      contributors: z.array(z.string()).default([]),
      advisors: z.array(ref('advisors')).default([]),
      next: z.string().max(60).optional(),
      featured: z.boolean().default(false),
      link: z.url().optional(),
    })
    .refine((p) => hasAlt(p.image, p.image_alt), { message: 'An image needs image_alt', path: ['image_alt'] });

export const updateSchema = (ref: RefFn) =>
  z
    .object({
      date: z.coerce.date(),
      title: text(1, 90),
      kind: z.enum(['award', 'milestone', 'talk', 'paper']),
      detail: text(1, 160),
      project: ref('projects').optional(),
      people: z.array(ref('people')).default([]),
      source_url: z.url().optional(),
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

export const siteSchema = z.object({
  email: z.email().optional(),
});
