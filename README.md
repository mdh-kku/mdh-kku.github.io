# MDH website

The website of **MDH: Medical Data Science and Health Informatics**, Faculty of Medicine, Khon Kaen University.

Every person, advisor, project, update and hero photo is one small file in `src/content/`. The site builds every page from those files, so you never edit the same fact in two places. The build also checks the files: if something required is missing, it stops and tells you which file to fix, so nothing half-finished can go live.

> **This repository is public.** Only add someone after they have agreed to everything in their file.

## Preview on your computer

1. Install [Node.js](https://nodejs.org) 22.23.4 or newer.
2. In this folder, run `npm install` (first time only).
3. Run `npm run dev` and open <http://localhost:4321>.
4. Before you push, run `npm test && npm run build`. Both must pass.

## Add a person

Create `src/content/people/<id>.md`. The `<id>` is short, lowercase, with no spaces (for example `somchai`). It becomes the link to that person: `/people/#somchai`. Put their photo next to the file.

```md
---
name: Somchai Jaidee            # official English spelling
name_th: สมชาย ใจดี
cohort: 2023
photo: ./somchai.jpg            # optional
photo_alt: Somchai Jaidee       # required when there is a photo
consent: true
consent_date: 2026-11-15
research_interest: Focuses on … (1–2 sentences, third person, 20–300 characters)
index_phrase: early warning from vital signs   # 3–6 lowercase words, for "We work on:"
thesis_topic: A general description, not the exact title (10–160 characters)
advisors: [somsri]              # ids of files in src/content/advisors
links:                          # optional: only the ones they want shown
  orcid: https://orcid.org/0000-0000-0000-0000
  scholar: https://scholar.google.com/citations?user=…
  github: https://github.com/…
  linkedin: https://www.linkedin.com/in/…
  email: someone@kkumail.com
---
```

The student list, "We work on:" and "In progress" appear once there are at least 3 people.

## Add an advisor

Create `src/content/advisors/<id>.md`:

```md
---
name: Somsri Rakdee, MD
title: Asst. Prof.
department: Rehabilitation Medicine
research_interest: Works on … (1–2 sentences)
photo: ./somsri.jpg             # optional
photo_alt: Somsri Rakdee        # required when there is a photo
profile_url: https://…          # optional
consent: true
---
```

"Supervises: …" is worked out from the students' `advisors` lists. Never type it.

## Add a project

Create `src/content/projects/<id>.md`:

```md
---
name: Project name
summary: One line on what it does (at most 120 characters).
year: 2025
area: Rehabilitation
image: ./project.jpg            # optional; no patients in the photo
image_alt: What the photo shows # required when there is an image
team: [somchai]                 # ids of people (only people who have consented)
contributors: [Firstname Lastname]   # non-MDH teammates, plain names, with their permission
advisors: [somsri]
next: "Next: clinical stage"    # optional, at most 60 characters
featured: false                 # true puts it first
link: https://…                 # optional; adds a "Learn more" button
---
```

## Add an update

Create `src/content/updates/<yyyy-mm>-<short-name>.md`. The home page shows the newest 4.

```md
---
date: 2026-03-07
title: Short headline (at most 90 characters)
kind: award                     # award, milestone, talk or paper
detail: One line (at most 160 characters).
project: project-id             # optional
people: [somchai]               # optional
source_url: https://…           # required for awards
confirmed_by: Somchai           # the member who checked it
---
```

## Add a hero photo

Create `src/content/hero/<id>.md` and put the photo next to it. The hero shows photos only when there are at least 4, using the first 4 by file name. Everyone in the photo must have agreed, and no patients may appear.

```md
---
image: ./lab-day.jpg
alt: What the photo shows
consent: true
color: false                    # true keeps this one photo in colour
---
```

## Remove someone (consent withdrawn)

1. Delete their `.md` file and their photo.
2. Search `src/content` for their id and remove it from every `team`, `advisors` and `people` list.
3. Run `npm test && npm run build`. If anything still points at them, the build stops with a message naming the file, for example: `Project "x" lists people "somchai", but there is no file people/somchai.md`.

## How publishing works

- **Stage 1:** every push to `main` runs the tests and, if they pass, publishes the site to GitHub Pages automatically through GitHub Actions.
- **Stage 2:** an official MDKKU web address will point to the same site.
- The lab's contact email lives in `src/content/site.json`. Until it's set, the Contact and Work with us buttons stay hidden.
- To change the image shown when the site is shared on LINE or Facebook, edit `scripts/og.html` and re-render `public/og.png` (instructions are inside that file).

## Rules

- **Consent first.** Nothing about a person goes into this repository until they have agreed to it.
- **Every award needs a working source link.**
- **No drafts, intake answers or unapproved photos** in the repository, even temporarily.
- **No photos or details that could identify a patient.**
- **Numbers are counted, not typed.** Counts such as "Nine theses underway" are computed from the files.
