# MDH Lab website

The website of **MDH Lab: Laboratory for Medicine, Data & Health**, Faculty of Medicine, Khon Kaen University. Its members are medical students earning an MSc in Data Science and Health Informatics alongside the MD.

Every person, principal investigator, research area, project, update, collaborator and hero photo is one small file in `src/content/`; publications come from a script (see Import publications). The site builds every page from those files, so you never edit the same fact in two places. The build also checks the files: if something required is missing, it stops and tells you which file to fix, so nothing half-finished can go live.

> **This repository is public.** Only add someone after they have agreed to everything in their file.

## Preview on your computer

1. Install [Node.js](https://nodejs.org) 22.23.4 or newer.
2. In this folder, run `npm install` (first time only).
3. Run `npm run dev` and open <http://localhost:4321>.
4. Before you push, run `npm test && npm run build`. Both must pass.

In the templates below, fill in every empty value; the build fails until you do. Lines starting with `#` are optional: remove the `#` to use one. If a value contains `: ` (colon and space), wrap the whole value in quotes.

## Add a person

Create `src/content/people/<id>.md`. The `<id>` is short, lowercase, with no spaces (for example `somchai`). It becomes the link to that person: `/people/#somchai`. Put their photo next to the file, cleaned first (see Rules).

```md
---
name:                 # official English spelling, e.g. Somchai Jaidee
name_th:              # e.g. สมชาย ใจดี
cohort:               # admission year, e.g. 2023
consent:              # write true only after they agreed in writing to everything in this file
consent_date:         # YYYY-MM-DD, e.g. 2026-11-15
research_interest:    # 1–2 sentences in the third person, 20–300 characters
thesis_topic:         # a general description, not the exact title (10–160 characters)
advisors: [somsri]    # ids of files in src/content/advisors
# photo: ./somchai.jpg            # optional
# photo_alt: Somchai Jaidee       # required when there is a photo
# links:                          # optional: only the ones they want shown
#   orcid: https://orcid.org/…
#   scholar: https://scholar.google.com/citations?user=…
#   github: https://github.com/…
#   linkedin: https://www.linkedin.com/in/…
#   email: their public email address
---
```

Students appear on the home page and the People page once there are at least 3. Check your work with `npm test && npm run build`.

## Add an advisor

Create `src/content/advisors/<id>.md`:

```md
---
name:                 # with degree, e.g. Somsri Rakdee, MD
title:                # e.g. Asst. Prof.
department:           # e.g. Rehabilitation Medicine
research_interest:    # 1–2 sentences
consent:              # write true only after they agreed
# photo: ./somsri.jpg             # optional
# photo_alt: Somsri Rakdee        # required when there is a photo
# profile_url: https://…          # optional
# openalex: [A…, A…]              # optional, one line: their OpenAlex author ids, read only by the publication import
# orcid: https://orcid.org/…      # optional
---
```

Advisors appear on the site as principal investigators, as equals with the students. "Advises: …" is worked out from the students' `advisors` lists. Never type it. Check with `npm test && npm run build`.

## Add a research area

Create `src/content/areas/<id>.md`. The `<id>` is short and lowercase (for example `rehabilitation`). Projects point at it with `area:`, and links to the area use it.

```md
---
name:                 # e.g. Rehabilitation (at most 40 characters)
description:          # one line on what the area covers, 10–140 characters
color:                # a hex colour for its picture, in quotes, e.g. "#2f5fd0"
art:                  # picture style: wave, cells, flow, scatter, rings or hexes
order:                # its place among the areas, e.g. 1
# match_topics: 'rehabilitation|speech therapy'   # optional, one line: OpenAlex topics that put a paper in this area
# match_titles: 'dysphagia|aphasia'               # optional, one line: title words that put a paper in this area
---
```

Check with `npm test && npm run build`.

## Add a project

Create `src/content/projects/<id>.md`:

```md
---
name:                 # e.g. SPEAK SPARK!
summary:              # one line on what it does, at most 120 characters
year:                 # e.g. 2025
area:                 # id of a file in src/content/areas, e.g. rehabilitation
team: [somchai]       # ids of people who have consented
advisors: [somsri]
featured: false       # true puts it first
# image: ./project.jpg                # optional; cleaned, and no patients in the photo
# image_alt: What the photo shows     # required when there is an image
# contributors: [Firstname Lastname]  # non-MDH teammates, only with their permission
# next: "Next: clinical stage"        # optional, at most 60 characters
# link: https://…                     # optional; adds a "Learn more" button
---
```

Check with `npm test && npm run build`.

## Add an update

Create `src/content/updates/<yyyy-mm>-<short-name>.md`. The home page shows the newest 4.

```md
---
date:                 # YYYY-MM-DD, e.g. 2026-03-07 (never 07/03/2026)
title:                # short headline, at most 90 characters
kind:                 # award, milestone, talk or paper
detail:               # one line, at most 160 characters
confirmed_by:         # the member who checked it
# source_url: https://…           # required for awards
# project: project-id             # optional
# people: [somchai]               # optional
---
```

Check with `npm test && npm run build`.

## Add a hero photo

Create `src/content/hero/<id>.md` and put the cleaned photo next to it. The hero shows photos only when there are at least 4, using the first 4 by file name. Everyone in the photo must have agreed, and no patients may appear.

```md
---
image:                # the photo next to this file, e.g. ./lab-day.jpg
alt:                  # what the photo shows
consent:              # write true only after everyone in the photo agreed
# color: true                    # optional: keeps this one photo in colour
---
```

Check with `npm test && npm run build`.

## Add a collaborator

Create `src/content/collaborators/<id>.md` only after the organisation or person has agreed to be listed. The Collaborators section appears once there is at least one.

```md
---
name:                 # their official name
kind:                 # organisation or person
what:                 # one line on who they are or what we did together, at most 120 characters
since:                # the year the work started, e.g. 2024
ongoing:              # true if the work is still going, false if it is past
consent:              # write true only after they agreed in writing to be listed
# url: https://…                      # optional: their website
# logo: ./logo.png                    # optional: put the file next to this one
# logo_alt: The organisation's name   # required when there is a logo
# projects: [speak-spark]             # optional: ids of projects you did together
---
```

Check with `npm test && npm run build`.

## Remove someone (consent withdrawn)

1. Delete their `.md` file and their photo.
2. Search `src/content` for their id and remove it from every `team`, `advisors` and `people` list.
3. Search for their name and remove it from any `contributors` list. Those are plain names, not ids, so the id search misses them.
4. Remove every hero photo and project image they appear in.
5. If they are a principal investigator, re-run the publication import (`node scripts/import-publications.mjs`, see Import publications) so their works leave `publications.json`. Until you do, the build stops with `Publication "W…" lists advisors "…", but there is no file advisors/….md`.
6. Run `npm test && npm run build`. If anything still points at them, the build stops with a message naming the file, for example: `Project "x" lists people "somchai", but there is no file people/somchai.md`.

Deleting a file removes it from the live site, but it stays in the repository's public git history. Erasing it completely means rewriting that history and asking GitHub Support to clear cached views. Agree this with the lab's principal investigator first.

## Import publications

The Research & publications page lists every work by the principal investigators who have a file in `src/content/advisors/` with an `openalex:` line. The list lives in `src/content/publications.json`, written by a script you run by hand. The site itself never calls OpenAlex.

1. Put each principal investigator's OpenAlex author ids in their file, on one line: `openalex: [A5027417160, A5040071245]` (some people have two records).
2. Preview: `node scripts/import-publications.mjs --dry-run`. It prints how many works each person has, how many land in each research area and in "Other", and how many show no Khon Kaen University affiliation. Ask that person to check those.
3. Import: `node scripts/import-publications.mjs`. Review the diff of `publications.json`, run `npm test && npm run build`, then commit.
4. If OpenAlex asks for an API key, give it only to your terminal, never to a file: `OPENALEX_API_KEY=… node scripts/import-publications.mjs` (in PowerShell, first `$env:OPENALEX_API_KEY="…"`).

Research areas are assigned by the `match_topics` and `match_titles` patterns in each area's file. Fixes go in `src/content/publication-corrections.json`, never in `publications.json` (the next import would undo them). Key each fix by the work's OpenAlex id:

```json
{
  "W4385721234": { "areas": ["rehabilitation"] },
  "W4391234567": { "hidden": true }
}
```

`areas` replaces the areas the import picked; `hidden` takes the work off the site. Before launch, each principal investigator approves their own list.

## How publishing works

- **Now (demo):** every push to the `redesign` branch runs the tests and, if they pass, publishes a demo to <https://mdh-kku.github.io> through GitHub Actions (`.github/workflows/deploy.yml`). The demo shows the full design filled with invented test content, and search engines are told not to list it.
- **Going live:** once people have agreed and the redesign is merged into `main`, delete the `MDH_CONTENT` line in `.github/workflows/deploy.yml` and deploy from `main`. The site then shows the real content in `src/content/`.
- **Stage 2:** an official MDKKU web address will point to the same site.
- `src/content/site.json` holds the lab's contact email, the MSc's Facebook page, the vision and the principles shown under Goals & culture: `[{ "id": "contact", "email": "…", "facebook": "https://…", "vision": "…", "principles": [{ "title": "…", "line": "…" }] }]`. Each shows only once it is set: without an email the Contact and Work with us buttons stay hidden, and without a vision so does Goals & culture.
- To change the image shown when the site is shared on LINE or Facebook, edit `scripts/og.html` and re-render `public/og.png` (instructions are inside that file).

## Rules

- **Consent first.** Nothing about a person goes into this repository until they have agreed to it.
- **Clean every photo before adding it.** Phone photos hide GPS location in their metadata. Run `node scripts/clean-photo.mjs path/to/photo.jpg`; the tests refuse photos that still carry metadata. Convert iPhone HEIC photos to JPG first.
- **Every award needs a working source link.**
- **Dates are written YYYY-MM-DD.** The build rejects 07/03/2026 rather than guessing the month.
- **No drafts, intake answers or unapproved photos** in the repository, even temporarily.
- **No photos or details that could identify a patient.**
- **Numbers are counted, not typed.** Counts such as "267 works · 2007–2026 · 178 free to read" are computed from the files.
