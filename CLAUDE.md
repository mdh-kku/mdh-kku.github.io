# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Static website for **MDH Lab: Laboratory for Medicine, Data & Health**: one cohort of medical students at the Faculty of Medicine, Khon Kaen University (KKU), earning an MSc in Data Science and Health Informatics alongside the MD, shown as equals with their principal investigators (the faculty who are also their advisors). The only audience is Partners (funders, collaborators, researchers, universities). The site is English only. Built with Astro 7 (static output) and tested with Vitest. Requires Node ≥ 22.23.4 (Astro 7.4.7's floor).

**The repository is public.** Only content that people have consented to may be committed. `.gitignore` deliberately excludes `old work/`, `.superpowers/`, `content-notes.md` and `docs/superpowers/`, because they contain names of people who haven't consented. Never force-add them.

Use the terms in `CONTEXT.md` (MDH Lab, MSc, Cohort, Advisor, Principal investigator, Partner, Contributor, Collaborator, Project, Research area, Publication, Update, Research interest, Thesis topic). The approved designs and implementation plans are local-only, dated files in `docs/superpowers/specs/` and `docs/superpowers/plans/`; each build's ledger (every ruling made) is in `.superpowers/sdd/<plan>/progress.md`.

The redesign (spec `docs/superpowers/specs/2026-11-09-mdh-redesign-design.md`, decision log `.superpowers/brainstorm/2026-11-09-decisions.md`, reference mockups `.superpowers/brainstorm/mdh-home-new-look.html`, `mdh-publications.html`, `mdh-research-stage.html`) is built on branch `redesign`. Removed on purpose, don't restore: "We work on:", two-tone headings, black bands, the Media Lab section order, the Projects / In progress / About sections, and `index_phrase`.

## Commands

```bash
npm install
npm run dev          # http://localhost:4321, real content from src/content
npm run build        # real site → dist/
npm run preview      # serve dist/
npm test             # vitest run: globalSetup first builds the FIXTURE site, then runs every test
npx vitest run tests/site.test.ts            # one file
npx vitest run -t "snapTarget"               # tests whose name matches
node scripts/clean-photo.mjs path/to/photo.jpg   # strip EXIF/GPS before committing any photo
node scripts/import-publications.mjs --dry-run   # OpenAlex → src/content/publications.json (drop --dry-run to write)
```

- **Fixture build by hand** (what the tests assert against): `MDH_CONTENT=./tests/fixtures/content MDH_OUT=./dist-fixtures npx astro build`.
- **Share image:** after editing `scripts/og.html`, re-render `public/og.png` (1200×630) with the headless-browser command in that file's header comment.
- There is no linter and no `astro check` (it was deliberately left out to avoid extra dependencies).

## Architecture

### Content is data

Every item is one Markdown file with frontmatter only, in `src/content/<collection>/`:
- collections: `people`, `advisors` (shown as Principal investigators), `areas` (Research areas), `projects`, `updates`, `collaborators`, `hero`
- `site.json`: `[{ "id": "contact", "email", "facebook", "vision", "principles": [{ "title", "line" }] }]`, every field optional
- `publications.json`: written only by `scripts/import-publications.mjs` (run by hand, reviewed, committed); the site never calls OpenAlex
- `publication-corrections.json`: hand fixes keyed by OpenAlex work id (`{ "areas": [...] }` replaces the imported areas, `{ "hidden": true }` drops the work), so a re-import never undoes them

Pages never hard-code facts. Counts ("267 works · 2007–2026 · 178 free to read") are computed.

### The data flow, across files

1. **`src/content.config.ts`** defines the collections with glob loaders (Markdown) and file loaders (the two JSON files). The base folder comes from the env var `MDH_CONTENT` (default `./src/content`), which is how tests swap in fixtures. `astro.config.mjs` likewise reads `MDH_OUT` for the output folder.
2. **`src/lib/schemas.ts`** holds plain Zod schemas (Zod 4 via `astro/zod`), written as factories that take Astro's `image()` and `reference()` helpers. Tests import them with stubs, without Astro. They enforce the publishing rules:
   - `consent: z.literal(true)` (people, advisors, collaborators)
   - ISO-only dates: a day-first `03/12/2025` is rejected rather than read as March
   - awards require `source_url`; a photo or logo requires alt text
   - areas: hex `color`, `art` from `ART_KINDS`, and `match_topics` / `match_titles` patterns that must compile
   - advisors' OpenAlex ids look like `A5027417160`; publication links are URLs
3. **`src/lib/content.ts`** — `loadSite()` loads every collection, applies the publication corrections and resolves references. Each reference goes through `must()`, so a dangling id stops the build with a readable message, for example `Project "x" lists people "y", but there is no file people/y.md` or `Publication "W4" lists advisors "adv-x", but there is no file advisors/adv-x.md`. It returns plain view objects (`PersonView`, `AreaView`, `PublicationView`, …). A publication names only the lab's people (`pi-<advisorId>` keys); co-authors are only counted.
4. **Pure modules with no Astro imports** (tests use them directly):
   - `src/lib/site.ts`: ordering (featured projects first, newest updates, `byNewest` publications), `showSection`, `visibleAreas`, `countsLine` / `statsLine`, `recentPublications` / `latestPublication` (skip datasets and preprints), `publicationButtons` (PDF, Free copy, DOI or Link, never two to one place), `peopleCards` and `peopleLinkCss`, `areaPills`, `peopleOnPublications`, `mailtoHref`, `heroPhotosToShow`, `must`
   - `src/lib/filters.ts`: literal, case-insensitive filter matching and `readFilters` (a stale or shared URL falls back to "All")
   - `src/lib/slides.ts`: the slide math (pose, rubber band, snap target, spring constants, trackpad paging)
   - `src/lib/art.ts`: the seeded, generated area pictures

### Pages

- **`src/pages/index.astro`**, in this order: Hero → Research areas (slides) → What we've published (finder) → People → Latest → Goals & culture → Collaborators → Work with us.
- **`research.astro`** (`/research/`): Projects in progress, then every publication grouped by year, with filters (area pills, year, person, search) kept in the URL.
- **`people.astro`**: students and principal investigators in one A-to-Z grid of equal tiles. "Advisor: …" and "Advises: …" are derived, never typed.
- **`404.astro`** and **`sitemap.xml.ts`** (`/`, `/research/`, `/people/`).
- **`src/layouts/Base.astro`** owns the `<head>` (the Google Fonts URL, share tags), the skip link, the header and the footer.

### Sections hide instead of rendering empty

This is the launch rule. Each section renders only when it has enough content:

| Section | Shown when |
|---|---|
| Research areas | at least 3 areas with a project or a publication; an area appears once it has one |
| What we've published (home) | at least 1 publication |
| People (home), students on the People page | at least 3 people; principal investigators show on the People page from the first |
| Latest | at least 1 update |
| Goals & culture | `site.json` has a `vision` |
| Collaborators | at least 1 collaborator |
| Hero photos | at least 4 (fixed slots, only on screens ≥ 1200px wide) |
| Contact pill, Work with us section, every `mailto:` | an email is set in `site.json` |

The hero's "See our research" goes to `#research` only when the slides show, otherwise to `/research/`.

### Client-side behaviour

Two small vanilla scripts; every page reads fine without them:
- **`src/scripts/finder.ts`** (homepage finder and `/research/`): shows and hides rows Astro already rendered. Filtering never animates. On the research page it reads and writes the URL.
- **`src/scripts/area-slides.ts`**: one continuous position drives every slide and the tab pill, so any interruption continues from where things are. Springs use Apple's response and damping (0.5 s; damping 1 for clicks and keys, 0.86 after a flick). Drag with rubber band at both ends; a sideways trackpad swipe pages one slide (a non-passive `wheel` listener on the stage only); arrow keys act only on a focused tab (tabs pattern); pictures play only on the front slide while on screen, with a pause button. Reduced motion: no travel (a 200 ms fade), nothing autoplays, the play button still works. A one-line inline script adds `.js` to the section first, so without JavaScript the slides are a plain stacked list.

Done in CSS, with no script: People hover/focus links (`peopleLinkCss` writes `:has()` rules into an inline `<style>`), the page-to-page crossfade (`@view-transition`), the tint on the person you arrive at on the People page (`:target`), and the play/pause icon fade (`@starting-style`).

### Styling

- **Tokens** live in `src/styles/global.css`: white page, blue "sky" hero, the light band `--band` (#f3f5f9: research areas, footer, pills, inputs), pills, 24px corners, `--ease-out`. No black anywhere.
- **Headings:** a small IBM Plex Mono label, then one plain `.headline` line (`SectionHeading`).
- **Type:** Google Sans Flex at roundness 60, loaded from Google Fonts with a fixed URL that's only 45 KB; don't add the `opsz` axis, which makes the file 204 KB. Labels use IBM Plex Mono.
- **Photos** are black-and-white (`.bw`) until hover or keyboard focus. Collaborator logos keep their colours.
- **Component styles** are scoped, and use `:global(...)` to reach `<Image>` output and SVG injected with `set:html`.
- **Motion:** press feedback 0.94–0.98 over 160 ms with `--ease-out`; cards that link lift 2px (mouse only); pages crossfade over 200 ms; area pictures loop in CSS, paused unless playing. Glass surfaces (pinned filter bar, play button) turn solid under `prefers-reduced-transparency`.

**Deliberate rules to preserve:**
- `compressHTML: true`: Astro 7's default `'jsx'` drops spaces between inline elements.
- Text built from several inline expressions (a publication's who-line and meta line, ledes, link text) stays on one source line: line breaks in the source land in the HTML as stray spaces.
- `<Image>` gets `width` only; cropping is done with CSS `object-fit`, because width plus height can distort.
- `[hidden]{display:none!important}` is global, because `.pill` sets `display`.
- Hover motion is gated by `@media (hover: hover) and (pointer: fine)`. Only cards that link somewhere lift on hover; their single link is stretched over the whole card.
- Grids use `minmax(min(Npx, 100%), 1fr)` so the page reflows at 320px (WCAG 1.4.10). Touch targets are at least 40px (the 32px publication buttons take taps over 40px).
- The hero `<h1>` has two lines: a small thin "Laboratory for" above a bold "Medicine, Data & Health" on one line, left-aligned inside a centered block. Below 540px the name breaks once, after "Medicine,". It's a real `<br>`, hidden at 540px and up, which keeps the block snug and centered. The `6.2vw` font size keeps the long line clear of the hero photos at 1200px and up.
- "Learn more" links carry hidden text (" about <project>") for screen readers and search engines.
- The slides' `march` keyframe loops over 84px, a whole number of both dash patterns, so it has no seam.

## Tests

- **`tests/global-setup.ts`** builds the fake fixtures (`tests/fixtures/content`) into `dist-fixtures/` before every run.
- **`tests/build.test.ts`** asserts on that HTML and CSS with `built(path)` and `builtCss()` from `tests/helpers.ts`. Astro may inline small CSS or emit `_astro/*.css`; `builtCss()` covers both (inline styles of the home page only, so tests of other pages add that page's inline `<style>`s).
- **Unit tests:** `schemas.test.ts`, `site.test.ts`, `filters.test.ts`, `slides.test.ts`, `art.test.ts`, `publications-lib.test.ts` (the import's pure mapping; no network).
- **`readme.test.ts`** checks that the README templates leave every must-write field empty, so an unedited copy fails the build, and that the maintainer sections exist.
- **`photos.test.ts`** rejects any photo in `src/content` that still carries EXIF, and tests `clean-photo.mjs`.
- Fixtures are invented ("Ann Alpha", "Dee Deeprasertsuwannakulsombat" for the long-name case; five areas, the fifth empty so it never shows; nine publications, W7 hidden and W4 re-assigned by corrections; one collaborator). Never put real people into fixtures.
- The real build (`npm run build`) warns "No files found" and "collection … is empty" for empty collections. That's expected until consented content arrives.

## Content rules (from README.md, the maintainer guide)

- Consent first.
- Awards need a working source link.
- Dates are written YYYY-MM-DD.
- No drafts or intake answers go in the repository.
- No patient-identifiable photos (SPEAK SPARK! is being tested with patients).
- Strip photo metadata before committing.
- Contributors (non-MDH teammates) appear on project cards, never on the People page.
- Publications name only the lab's people; co-authors are counted, never named. PDFs are linked, never stored. Each principal investigator approves their own list before launch.
- When someone withdraws consent, remove:
  - their file and their photo
  - their id from every `team`, `advisors` and `people` list
  - their name from any `contributors` list
  - every photo they appear in
  - for a principal investigator, their works: re-run the import

  Deleted files remain in the public git history.
- Don't invent facts. KKU news mislabels who is in MDH; corrections from the owner win.

## Status and deployment

- Stage 1 is on branch `stage-1`; the redesign is on branch `redesign`. Going live is waiting on people:
  - the owner's GitHub organization (planned `mdh-kku`)
  - a public repository named exactly `<org>.github.io`, with Pages set to deploy from GitHub Actions
  - at least 3 consented members, the principal investigators' consent and their publication lists, the confirmed research areas
  - the lab email
- Then: set `site` in `astro.config.mjs`, and add `.github/workflows/deploy.yml` (`actions/checkout@v7`, `withastro/action@v6` with `build-cmd: npm test && npm run build`, `actions/deploy-pages@v5`). Use Node 22 or 24 in CI; Node 22 reaches end of life in April 2027.
- Stage 2: an official MDKKU subdomain via `public/CNAME`, plus an updated `site`.
- On this Windows machine, the Playwright and DevTools MCP browsers hang. For visual checks use headless Edge (`msedge --headless=new --screenshot=… --window-size=…`). Edge won't open narrower than about 500px, so check phone widths by putting the page in a 360px iframe on a same-origin test page; root-relative assets need a server, not `file://`.
- Headless Edge pitfalls:
  - With `--virtual-time-budget`, CSS transitions look frozen mid-way. Screenshot settled states with `*{transition:none!important}` injected.
  - Animation driven by `requestAnimationFrame` only advances with a `window.requestAnimationFrame = cb => setTimeout(() => cb(performance.now()), 16)` shim injected first.
  - To assert behaviour, inject a script that acts on the page and writes results into a `<pre>`, then read it with `--dump-dom`.
  - Screenshots of `#hash` URLs, and pages with `will-change` on very large layers, can come out blank.
  - Windows animation effects are off here, so Chromium reports `prefers-reduced-motion: reduce`. Pass `--force-prefers-no-reduced-motion` to check full motion (`--force-prefers-reduced-motion` for the reduced one).
- The machine runs low on memory: Claude Code has killed preview servers before. Don't start long-running servers without asking, and only one `astro preview` can run per project. For a quick check, serve `dist-fixtures` with `python -m http.server 4331 --directory dist-fixtures` for a few seconds and kill it straight after; in bash, start it with `&` on its own line, or the `&` backgrounds the whole `&&` chain before it.
