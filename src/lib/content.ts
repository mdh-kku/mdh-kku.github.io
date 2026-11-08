import { getCollection, getEntry } from 'astro:content';
import { must, supervisedBy } from './site';

type Img = import('astro').ImageMetadata;

export type PersonView = {
  id: string;
  name: string;
  nameTh: string;
  photo?: Img;
  photoAlt?: string;
  researchInterest: string;
  indexPhrase: string;
  thesisTopic: string;
  advisors: { id: string; label: string }[];
  links: { orcid?: string; scholar?: string; github?: string; linkedin?: string; email?: string };
};
export type AdvisorView = {
  id: string;
  label: string;
  department: string;
  researchInterest: string;
  photo?: Img;
  photoAlt?: string;
  profileUrl?: string;
  supervises: { id: string; name: string }[];
};
export type ProjectView = {
  id: string;
  name: string;
  summary: string;
  year: number;
  area: string;
  image?: Img;
  imageAlt?: string;
  team: { id: string; name: string }[];
  contributors: string[];
  next?: string;
  featured: boolean;
  link?: string;
};
export type UpdateView = {
  id: string;
  date: Date;
  title: string;
  kind: 'award' | 'milestone' | 'talk' | 'paper';
  detail: string;
  sourceUrl?: string;
};
export type HeroPhoto = { id: string; image: Img; alt: string; color: boolean };
export type SiteData = {
  email?: string;
  people: PersonView[];
  advisors: AdvisorView[];
  projects: ProjectView[];
  updates: UpdateView[];
  hero: HeroPhoto[];
};

/** reference() stores { collection, id }. */
const refId = (r: unknown) => (r as { id: string }).id;

/** The message a maintainer sees when a file points at someone or something that no longer exists. */
const missing = (kind: string, id: string, collection: string, ref: string) =>
  `${kind} "${id}" lists ${collection} "${ref}", but there is no file ${collection}/${ref}.md`;

const byText = <T>(key: (x: T) => string) => (a: T, b: T) => key(a).localeCompare(key(b));

/** Loads every collection and resolves references into plain objects the pages render. */
export async function loadSite(): Promise<SiteData> {
  const [peopleE, advisorsE, projectsE, updatesE, heroE, site] = await Promise.all([
    getCollection('people'),
    getCollection('advisors'),
    getCollection('projects'),
    getCollection('updates'),
    getCollection('hero'),
    getEntry('site', 'contact'),
  ]);

  const advisorById = new Map(advisorsE.map((a) => [a.id, a]));
  const personById = new Map(peopleE.map((p) => [p.id, p]));
  const projectIds = new Set(projectsE.map((p) => p.id));
  const advisorLabel = (a: (typeof advisorsE)[number]) => `${a.data.title} ${a.data.name}`;
  const advisor = (kind: string, id: string, r: unknown) =>
    must(advisorById.get(refId(r)), missing(kind, id, 'advisors', refId(r)));
  const person = (kind: string, id: string, r: unknown) =>
    must(personById.get(refId(r)), missing(kind, id, 'people', refId(r)));

  const people: PersonView[] = peopleE
    .map((p) => ({
      id: p.id,
      name: p.data.name,
      nameTh: p.data.name_th,
      photo: p.data.photo as Img | undefined,
      photoAlt: p.data.photo_alt,
      researchInterest: p.data.research_interest,
      indexPhrase: p.data.index_phrase,
      thesisTopic: p.data.thesis_topic,
      advisors: p.data.advisors.map((r) => {
        const a = advisor('Person', p.id, r);
        return { id: a.id, label: advisorLabel(a) };
      }),
      links: p.data.links ?? {},
    }))
    .sort(byText((p) => p.name));

  const advisorLinks = people.map((p) => ({ id: p.id, advisorIds: p.advisors.map((a) => a.id) }));
  const nameOf = new Map(people.map((p) => [p.id, p.name]));

  const advisors: AdvisorView[] = advisorsE
    .map((a) => ({
      id: a.id,
      label: advisorLabel(a),
      department: a.data.department,
      researchInterest: a.data.research_interest,
      photo: a.data.photo as Img | undefined,
      photoAlt: a.data.photo_alt,
      profileUrl: a.data.profile_url,
      supervises: supervisedBy(a.id, advisorLinks).map((id) => ({ id, name: nameOf.get(id) ?? id })),
    }))
    .sort(byText((a) => advisorById.get(a.id)!.data.name));

  const projects: ProjectView[] = projectsE.map((p) => {
    p.data.advisors.forEach((r) => advisor('Project', p.id, r));
    return {
      id: p.id,
      name: p.data.name,
      summary: p.data.summary,
      year: p.data.year,
      area: p.data.area,
      image: p.data.image as Img | undefined,
      imageAlt: p.data.image_alt,
      team: p.data.team.map((r) => {
        const m = person('Project', p.id, r);
        return { id: m.id, name: m.data.name };
      }),
      contributors: p.data.contributors,
      next: p.data.next,
      featured: p.data.featured,
      link: p.data.link,
    };
  });

  const updates: UpdateView[] = updatesE.map((u) => {
    if (u.data.project) {
      const id = refId(u.data.project);
      must(projectIds.has(id) ? id : undefined, missing('Update', u.id, 'projects', id));
    }
    u.data.people.forEach((r) => person('Update', u.id, r));
    return {
      id: u.id,
      date: u.data.date,
      title: u.data.title,
      kind: u.data.kind,
      detail: u.data.detail,
      sourceUrl: u.data.source_url,
    };
  });

  const hero: HeroPhoto[] = heroE
    .map((h) => ({ id: h.id, image: h.data.image as Img, alt: h.data.alt, color: h.data.color }))
    .sort(byText((h) => h.id));

  return { email: site?.data.email, people, advisors, projects, updates, hero };
}
