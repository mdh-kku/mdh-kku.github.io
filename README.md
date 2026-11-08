# MDH website

The website of **MDH: Medical Data Science and Health Informatics**, Faculty of Medicine, Khon Kaen University.

Every person, advisor, project, update and hero photo is one small file in `src/content/`. The site builds every page from those files, so you never edit the same fact in two places. The build also checks the files: if something required is missing, it stops and tells you which file to fix, so nothing half-finished can go live.

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
index_phrase:         # 3–6 lowercase words for "We work on:", e.g. early warning from vital signs
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

The student list, "We work on:" and "In progress" appear once there are at least 3 people. Check your work with `npm test && npm run build`.

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
---
```

"Supervises: …" is worked out from the students' `advisors` lists. Never type it. Check with `npm test && npm run build`.

## Add a project

Create `src/content/projects/<id>.md`:

```md
---
name:                 # e.g. SPEAK SPARK!
summary:              # one line on what it does, at most 120 characters
year:                 # e.g. 2025
area:                 # e.g. Rehabilitation
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
color: false          # true keeps this one photo in colour
---
```

Check with `npm test && npm run build`.

## Remove someone (consent withdrawn)

1. Delete their `.md` file and their photo.
2. Search `src/content` for their id and remove it from every `team`, `advisors` and `people` list.
3. Search for their name and remove it from any `contributors` list. Those are plain names, not ids, so the id search misses them.
4. Remove every hero photo and project image they appear in.
5. Run `npm test && npm run build`. If anything still points at them, the build stops with a message naming the file, for example: `Project "x" lists people "somchai", but there is no file people/somchai.md`.

Deleting a file removes it from the live site, but it stays in the repository's public git history. Erasing it completely means rewriting that history and asking GitHub Support to clear cached views. Agree this with the lab's principal investigator first.

## How publishing works

- **Stage 1:** every push to `main` runs the tests and, if they pass, publishes the site to GitHub Pages automatically through GitHub Actions.
- **Stage 2:** an official MDKKU web address will point to the same site.
- The lab's contact email lives in `src/content/site.json`, as `[{ "id": "contact", "email": "…" }]`. Until it's set, the Contact and Work with us buttons stay hidden.
- To change the image shown when the site is shared on LINE or Facebook, edit `scripts/og.html` and re-render `public/og.png` (instructions are inside that file).

## Rules

- **Consent first.** Nothing about a person goes into this repository until they have agreed to it.
- **Clean every photo before adding it.** Phone photos hide GPS location in their metadata. Run `node scripts/clean-photo.mjs path/to/photo.jpg`; the tests refuse photos that still carry metadata. Convert iPhone HEIC photos to JPG first.
- **Every award needs a working source link.**
- **Dates are written YYYY-MM-DD.** The build rejects 07/03/2026 rather than guessing the month.
- **No drafts, intake answers or unapproved photos** in the repository, even temporarily.
- **No photos or details that could identify a patient.**
- **Numbers are counted, not typed.** Counts such as "Nine theses underway" are computed from the files.
