# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Static website for **MDH Lab: Laboratory for Medicine, Data & Health**: one cohort of medical students at the Faculty of Medicine, Khon Kaen University (KKU), earning an MSc in Data Science and Health Informatics alongside the MD, plus their advisors. The only audience is Partners (funders, collaborators, researchers, universities). The site is English only. Built with Astro 7 (static output) and tested with Vitest. Requires Node ≥ 22.23.4 (Astro 7.4.7's floor).

**The repository is public.** Only content that people have consented to may be committed. `.gitignore` deliberately excludes `old work/`, `.superpowers/`, `content-notes.md` and `docs/superpowers/`, because they contain names of people who haven't consented. Never force-add them.

Use the terms in `CONTEXT.md` (MDH Lab, MSc, Cohort, Advisor, Partner, Contributor, Project, Update, Research interest, Thesis topic). The approved design and the implementation plan are local-only files in `docs/superpowers/specs/` and `docs/superpowers/plans/`. The executor's progress ledger (every ruling made during the build) is `.superpowers/sdd/2026-11-08-mdh-website/progress.md`.

## Commands

```bash
npm install
npm run dev          # http://localhost:4321, real content from src/content
npm run build        # real site → dist/
npm run preview      # serve dist/
npm test             # vitest run: globalSetup first builds the FIXTURE site, then runs every test
npx vitest run tests/site.test.ts            # one file
npx vitest run -t "orders projects"          # tests whose name matches
node scripts/clean-photo.mjs path/to/photo.jpg   # strip EXIF/GPS before committing any photo
```

- **Fixture build by hand** (what the tests assert against): `MDH_CONTENT=./tests/fixtures/content MDH_OUT=./dist-fixtures npx astro build`.
- **Share image:** after editing `scripts/og.html`, re-render `public/og.png` (1200×630) with the headless-browser command in that file's header comment.
- There is no linter and no `astro check` (it was deliberately left out to avoid extra dependencies).

## Architecture

### Content is data

Every item is one Markdown file with frontmatter only, in `src/content/<collection>/`:
- collections: `people`, `advisors`, `projects`, `updates`, `hero`
- `src/content/site.json` holds the contact email, as `[{ "id": "contact", "email": … }]`

Pages never hard-code facts. Counts ("Nine theses underway") are computed.

### The data flow, across files

1. **`src/content.config.ts`** defines the collections with glob loaders. The base folder comes from the env var `MDH_CONTENT` (default `./src/content`), which is how tests swap in fixtures. `astro.config.mjs` likewise reads `MDH_OUT` for the output folder.
2. **`src/lib/schemas.ts`** holds plain Zod schemas (Zod 4 via `astro/zod`), written as factories that take Astro's `image()` and `reference()` helpers. Tests import them with stubs, without Astro. They enforce the publishing rules:
   - `consent: z.literal(true)`
   - ISO-only dates: a day-first `03/12/2025` is rejected rather than read as March
   - awards require `source_url`
   - a photo requires alt text
   - `index_phrase` is 3–6 lowercase words
3. **`src/lib/content.ts`** — `loadSite()` loads every collection and resolves references. Each reference goes through `must()`, so a dangling id stops the build with a readable message, for example `Project "x" lists people "y", but there is no file people/y.md`. It returns plain view objects (`PersonView`, `ProjectView`, …). Pages and components consume only these.
4. **`src/lib/site.ts`** holds pure display rules with no Astro imports:
   - ordering: featured projects first, then newest; the latest 4 updates
   - `showSection` (minimum 3 items)
   - copy: `thesesHeadline`, `aboutLead`
   - `mailtoHref`, `heroPhotosToShow` (needs at least 4), and `must`

### Pages

- **`src/pages/index.astro`**, sections in this approved order (modelled on the MIT Media Lab homepage): Hero → Projects → Latest (black band) → We work on → In progress → Work with us → About.
- **`people.astro`**, LCP-style cards showing research interest, thesis topic and advisors. Advisors are listed with "Supervises:", which is derived, never typed.
- **`404.astro`** and **`sitemap.xml.ts`**.
- **`src/layouts/Base.astro`** owns the `<head>` (the Google Fonts URL, share tags), the skip link, the header and the footer.

### Sections hide instead of rendering empty

This is the launch rule. Each section renders only when it has enough content:

| Section | Shown when |
|---|---|
| Student list, We work on, In progress | at least 3 people |
| Projects, Latest | at least 1 item |
| Hero photos | at least 4 (fixed slots, only on screens ≥ 1200px wide) |
| Contact pill, Work with us section, every `mailto:` | an email is set in `site.json` |

### The only client-side JavaScript

The script in `WeWorkOn.astro`. It highlights one phrase every 3 seconds. The Pause button is shipped `hidden` and is revealed only when motion is allowed; with reduced motion or no JavaScript, every phrase stays fully visible.

### Styling ("Day & Night")

- **Tokens** live in `src/styles/global.css`: white page, blue "sky" hero, black bands, pills, 24px corners.
- **Type:** Google Sans Flex at roundness 60, loaded from Google Fonts with a fixed URL that's only 45 KB; don't add the `opsz` axis, which makes the file 204 KB. Labels use IBM Plex Mono.
- **Photos** are black-and-white (`.bw`) until hover or keyboard focus.
- **Component styles** are scoped, and use `:global(img)` to reach `<Image>` output.

**Deliberate rules to preserve:**
- `compressHTML: true`: Astro 7's default `'jsx'` drops spaces between inline elements.
- `<Image>` gets `width` only; cropping is done with CSS `object-fit`, because width plus height can distort.
- `[hidden]{display:none!important}` is global, because `.pill` sets `display`.
- Hover motion is gated by `@media (hover: hover) and (pointer: fine)`. Only cards that link somewhere lift on hover; their single link is stretched over the whole card.
- Grids use `minmax(min(Npx, 100%), 1fr)` so the page reflows at 320px (WCAG 1.4.10).
- The hero `<h1>` is a thin "Laboratory for" above a bold "Medicine, / Data & / Health". The lines are left-aligned inside a centered block so that M-D-H line up.
- "Learn more" links carry hidden text (" about <project>") for screen readers and search engines.

## Tests

- **`tests/global-setup.ts`** builds the fake fixtures (`tests/fixtures/content`) into `dist-fixtures/` before every run.
- **`tests/build.test.ts`** asserts on that HTML and CSS with `built(path)` and `builtCss()` from `tests/helpers.ts`. Astro may inline small CSS or emit `_astro/*.css`; `builtCss()` covers both.
- **`schemas.test.ts`** and **`site.test.ts`** are unit tests.
- **`readme.test.ts`** checks that the README templates leave every must-write field empty, so an unedited copy fails the build.
- **`photos.test.ts`** rejects any photo in `src/content` that still carries EXIF, and tests `clean-photo.mjs`.
- Fixtures are invented people ("Ann Alpha", "Dee Deeprasertsuwannakulsombat" for the long-name case). Never put real people into fixtures.
- The real build (`npm run build`) currently warns "No files found" for empty collections. That's expected until consented content arrives.

## Content rules (from README.md, the maintainer guide)

- Consent first.
- Awards need a working source link.
- Dates are written YYYY-MM-DD.
- No drafts or intake answers go in the repository.
- No patient-identifiable photos (SPEAK SPARK! is being tested with patients).
- Strip photo metadata before committing.
- Contributors (non-MDH teammates) appear on project cards, never on the People page.
- When someone withdraws consent, remove:
  - their file and their photo
  - their id from every `team`, `advisors` and `people` list
  - their name from any `contributors` list
  - every photo they appear in

  Deleted files remain in the public git history.
- Don't invent facts. KKU news mislabels who is in MDH; corrections from the owner win.

## Status and deployment

- Stage 1 code is complete (branch `stage-1`). Going live (plan Task 10) is waiting on people:
  - the owner's GitHub organization (planned `mdh-kku`)
  - a public repository named exactly `<org>.github.io`, with Pages set to deploy from GitHub Actions
  - at least 3 consented members
  - the lab email
- Then: set `site` in `astro.config.mjs`, and add `.github/workflows/deploy.yml` (`actions/checkout@v7`, `withastro/action@v6` with `build-cmd: npm test && npm run build`, `actions/deploy-pages@v5`). Use Node 22 or 24 in CI; Node 22 reaches end of life in April 2027.
- Stage 2: an official MDKKU subdomain via `public/CNAME`, plus an updated `site`.
- On this Windows machine, the Playwright and DevTools MCP browsers hang. For visual checks use headless Edge (`msedge --headless=new --screenshot=… --window-size=…`). Edge won't open narrower than about 500px, so check phone widths by putting the page in a 360px iframe on a same-origin test page; root-relative assets need `npm run preview`, not `file://`.
