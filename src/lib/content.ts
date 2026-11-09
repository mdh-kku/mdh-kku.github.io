import { getCollection, getEntry } from 'astro:content';
import { must, supervisedBy } from './site';
import type { Art } from './schemas';

type Img = import('astro').ImageMetadata;

export type PersonView = {
  id: string;
  name: string;
  nameTh: string;
  photo?: Img;
  photoAlt?: string;
  researchInterest: string;
  thesisTopic: string;
  advisors: { id: string; label: string }[];
  links: { orcid?: string; scholar?: string; github?: string; linkedin?: string; email?: string };
};
export type AdvisorView = {
  id: string;
  /** The plain name, e.g. "Tess Advisor, MD". */
  name: string;
  title: string;
  /** Title and name, e.g. "Asst. Prof. Tess Advisor, MD". */
  label: string;
  department: string;
  researchInterest: string;
  photo?: Img;
  photoAlt?: string;
  profileUrl?: string;
  orcid?: string;
  supervises: { id: string; name: string }[];
};
export type ProjectView = {
  id: string;
  name: string;
  summary: string;
  year: number;
  area: { id: string; name: string };
  image?: Img;
  imageAlt?: string;
  team: { id: string; name: string }[];
  contributors: string[];
  next?: string;
  featured: boolean;
  link?: string;
  /** Titles of the award Updates that name this project, newest first. */
  awards: string[];
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
export type AreaView = { id: string; name: string; description: string; color: string; art: Art; order: number };
export type PublicationView = {
  id: string;
  title: string;
  year: number;
  date?: Date;
  type: string;
  venue?: string;
  doi?: string;
  pdf?: string;
  free?: string;
  freeAt?: string;
  url?: string;
  openAccess: boolean;
  authors: number;
  citedBy: number;
  /** The lab's people on this work. Co-authors are only counted (authors), never named. */
  people: { key: string; name: string }[];
  areas: string[];
};
export type CollaboratorView = {
  id: string;
  name: string;
  kind: 'organisation' | 'person';
  what: string;
  url?: string;
  since: number;
  ongoing: boolean;
  logo?: Img;
  logoAlt?: string;
};
export type SiteData = {
  email?: string;
  facebook?: string;
  vision?: string;
  principles: { title: string; line: string }[];
  areas: AreaView[];
  publications: PublicationView[];
  collaborators: CollaboratorView[];
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
  const [peopleE, advisorsE, projectsE, updatesE, heroE, site, areasE, publicationsE, correctionsE, collaboratorsE] =
    await Promise.all([
    getCollection('people'),
    getCollection('advisors'),
    getCollection('projects'),
    getCollection('updates'),
    getCollection('hero'),
    getEntry('site', 'contact'),
    getCollection('areas'),
    getCollection('publications'),
    getCollection('corrections'),
    getCollection('collaborators'),
  ]);

  const advisorById = new Map(advisorsE.map((a) => [a.id, a]));
  const personById = new Map(peopleE.map((p) => [p.id, p]));
  const projectIds = new Set(projectsE.map((p) => p.id));
  const areaById = new Map(areasE.map((a) => [a.id, a]));
  const advisorLabel = (a: (typeof advisorsE)[number]) => `${a.data.title} ${a.data.name}`;
  const advisor = (kind: string, id: string, r: unknown) =>
    must(advisorById.get(refId(r)), missing(kind, id, 'advisors', refId(r)));
  const person = (kind: string, id: string, r: unknown) =>
    must(personById.get(refId(r)), missing(kind, id, 'people', refId(r)));
  const area = (kind: string, id: string, r: unknown) =>
    must(areaById.get(refId(r)), missing(kind, id, 'areas', refId(r)));

  const people: PersonView[] = peopleE
    .map((p) => ({
      id: p.id,
      name: p.data.name,
      nameTh: p.data.name_th,
      photo: p.data.photo as Img | undefined,
      photoAlt: p.data.photo_alt,
      researchInterest: p.data.research_interest,
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
      name: a.data.name,
      title: a.data.title,
      label: advisorLabel(a),
      department: a.data.department,
      researchInterest: a.data.research_interest,
      photo: a.data.photo as Img | undefined,
      photoAlt: a.data.photo_alt,
      profileUrl: a.data.profile_url,
      orcid: a.data.orcid,
      supervises: supervisedBy(a.id, advisorLinks).map((id) => ({ id, name: nameOf.get(id) ?? id })),
    }))
    .sort(byText((a) => advisorById.get(a.id)!.data.name));

  const awardsOf = (projectId: string) =>
    updatesE
      .filter((u) => u.data.kind === 'award' && u.data.project && refId(u.data.project) === projectId)
      .sort((a, b) => b.data.date.getTime() - a.data.date.getTime())
      .map((u) => u.data.title);

  const projects: ProjectView[] = projectsE.map((p) => {
    p.data.advisors.forEach((r) => advisor('Project', p.id, r));
    const a = area('Project', p.id, p.data.area);
    return {
      id: p.id,
      name: p.data.name,
      summary: p.data.summary,
      year: p.data.year,
      area: { id: a.id, name: a.data.name },
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
      awards: awardsOf(p.id),
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

  const areas: AreaView[] = areasE
    .map((a) => ({
      id: a.id,
      name: a.data.name,
      description: a.data.description,
      color: a.data.color,
      art: a.data.art,
      order: a.data.order,
    }))
    .sort((a, b) => a.order - b.order);

  const correctionOf = new Map(correctionsE.map((c) => [c.id, c.data]));
  correctionsE.forEach((c) => c.data.areas?.forEach((r) => area('Correction', c.id, r)));

  // Corrections win over the import: `areas` replaces the imported list, `hidden` drops the work.
  const publications: PublicationView[] = publicationsE
    .filter((w) => !correctionOf.get(w.id)?.hidden)
    .map((w) => ({
      id: w.id,
      title: w.data.title,
      year: w.data.year,
      date: w.data.date,
      type: w.data.type,
      venue: w.data.venue,
      doi: w.data.doi,
      pdf: w.data.pdf,
      free: w.data.free,
      freeAt: w.data.free_at,
      url: w.data.url,
      openAccess: w.data.open_access,
      authors: w.data.authors,
      citedBy: w.data.cited_by,
      people: w.data.advisors.map((r) => {
        const a = advisor('Publication', w.id, r);
        return { key: `pi-${a.id}`, name: a.data.name };
      }),
      areas: (correctionOf.get(w.id)?.areas ?? w.data.areas).map((r) => area('Publication', w.id, r).id),
    }));

  const collaborators: CollaboratorView[] = collaboratorsE.map((c) => {
    c.data.projects.forEach((r) => {
      const id = refId(r);
      must(projectIds.has(id) ? id : undefined, missing('Collaborator', c.id, 'projects', id));
    });
    return {
      id: c.id,
      name: c.data.name,
      kind: c.data.kind,
      what: c.data.what,
      url: c.data.url,
      since: c.data.since,
      ongoing: c.data.ongoing,
      logo: c.data.logo as Img | undefined,
      logoAlt: c.data.logo_alt,
    };
  });

  return {
    email: site?.data.email,
    facebook: site?.data.facebook,
    vision: site?.data.vision,
    principles: site?.data.principles ?? [],
    people,
    advisors,
    projects,
    updates,
    hero,
    areas,
    publications,
    collaborators,
  };
}
