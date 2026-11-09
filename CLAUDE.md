# CLAUDE.md: Family Learning Library

## What we are building
This is a private web app that costs nothing to run. It holds ALL the learning material I make for my 12-year-old in one place: coding, English, maths, physics, microprocessors and more.

It replaces single-file HTML lessons that are scattered across 3–4 devices. We are no longer limited to one self-contained file, so the app uses shared layouts, shared components, multi-page sections and one design system.

The system has three parts, and each has one job:
- **Vault**: this GitHub repo (public). It is the one master copy of all content.
- **Robot**: a GitHub Action (`.github/workflows/site.yml`). On every push to `main` it checks, builds and deploys. On pull requests it only checks and builds, to catch errors.
- **Shell**: a static site on **GitHub Pages**, installable as a PWA: https://arhaanbeta.github.io/learning-library-ayu/

**No progress tracking (owner's decision, Nov 2026).** The site remembers nothing about the reader: every lesson opens at the beginning, every time. No database, no Firebase, no "Mark as done", no readers.

> Hosting changed from Firebase Hosting to GitHub Pages (Nov 2026): deploying to Firebase needs a Google Cloud service-account key, which the owner's Google Cloud account cannot create. GitHub Pages needs no extra account, no billing and no secret.

## Hard constraints (never break these)
- **Zero cost.** No billing account anywhere. No paid API or service.
- The build is static only. There is no server.
- Do not add analytics, trackers, ads or third-party cookies.
- **Keep security basic. Do not over-engineer it.** This is ordinary learning material, not private data.
  - There is NO login, NO sign-in screen and NO permission prompt, ever. The plain site link must just work on every device, every time.
  - There are no deploy secrets: GitHub Pages deploys with GitHub's built-in token.
- The repo is public: never commit personal details (the child's full name, school, photos, address). Check legacy files before importing them.
- Keep the site out of search engines, so strangers don't use up the free quota:
  - `noindex` meta tag on every page (in `BaseLayout.astro`).
  - `public/robots.txt` disallows everything. (On a GitHub Pages *project* site this file isn't at the domain root, so the `noindex` tag is the part that really works.)
- Use UK English everywhere, in both the UI and the content.
- At every step, tell me: what was done, what's next, what to expect, and what (if anything) you need from me.

## Stack
- **Astro 7** with content collections, MDX and strict TypeScript. Node 22 (`.nvmrc`).
- Content lives in `/content`, loaded with Astro's glob loader (`src/content.config.ts`).
- The rich pages (home, map, search) are **React islands with Motion** (owner's request, Nov 2026): `src/islands/`, rendered to HTML at build time and hydrated with `client:load`. Lesson and folder pages ship no React. Lesson widgets stay small vanilla-TS islands. Keep JS light on content pages.
- Fonts are self-hosted with Fontsource: Bricolage Grotesque (headings), Atkinson Hyperlegible Next (body, made for easy reading).
- Page changes cross-fade with CSS cross-document View Transitions (no JS); a subject's icon and title glide from its home tile to its page (`view-transition-name: icon-<slug>` / `title-<slug>`).
- Maths uses KaTeX (remark-math + rehype-katex via `unified()` in `astro.config.mjs`), rendered at build time. Code highlighting uses Astro's built-in Shiki.
- Search (Phase 3): Pagefind, static, runs in the browser.
- PWA (later, optional): `@vite-pwa/astro`, so visited pages can be read offline.
- Site path: `site` and `base` in `astro.config.mjs` (`/learning-library-ayu`). Internal links always go through `url()` in `src/lib/url.ts`, so moving the site is a one-line change.
- GitHub Pages sends a short cache time for everything; hashed assets in `_astro/` are safe because their names change when they change.

## Content model: folders of any depth → lessons
The library is a tree of folders, nested as deep as needed (domain → subject → subdomain → topic …), with lessons as the leaves. The owner reorganises it on the go, so keep it flexible.

```
content/
  maths/
    meta.json               # title, order, icon, accent, blurb (all but title optional)
    arrows-and-machines.mdx # a lesson directly in a subject shows under "General"
    number/
      meta.json
      number-line-lab.md
  technology/
    meta.json
    how-chips-think.mdx     # an older lesson: `legacy:` points at its file in public/legacy/
  chemistry/meta.json       # an empty subject shows "Nothing here yet"
```

- Any folder may hold lessons and/or sub-folders. `meta.json` is optional (no meta → title from the folder name). `accent` (a name from `src/lib/accents.ts`) is inherited from the parent folder when left out.
- Lessons are `.mdx` (can use components) or `.md` (plain, e.g. converted documents).
- Moving a lesson = moving its file; reorganising = moving folders. Do it when the owner asks in one sentence.

Lesson frontmatter (zod-validated in `src/content.config.ts`):

```yaml
id: phy-forces-what-is-a-force   # PERMANENT. Never change or reuse.
title: What is a force?
summary: One plain-English line.          # optional
order: 1                                  # optional (default 100)
minutes: 8                                # optional
tags: [push, pull, newton]                # optional
legacy: /legacy/physics/levers.html       # only for wrapped older lessons
source: https://claude.ai/artifact/…      # where an imported lesson came from (records only)
```

- The URL comes from the folder path plus the file name without its `01-` prefix.
- Filenames may change. The `id` may never change.
- The build fails if a lesson `id` is missing, badly formed or duplicated, or if a lesson and a folder would share an address.

## Routes
- `/` is the home page: hero with instant search (`/` or Ctrl/⌘ K), "Surprise me", subjects as a bento grid, and a filterable list of every lesson. `/map/` shows the whole tree on one page, with a live filter.
- `/<any/folder/path>/` lists that folder's sub-folders (cards) and lessons. One route, `src/pages/[...path].astro`, serves every depth.
- `/<folder/path>/<lesson>/` is a lesson: breadcrumb, the folder's lessons in a sidebar, previous/next. It always opens at the top.
- `/search/`: instant search over titles, topics, tags and summaries (`?q=` works). Full-text search inside lessons (Pagefind) is Phase 3.

## Where things live (so refactors stay small)
- `src/styles/tokens.css`: every colour, size, space, radius and tap size. Light and dark. Subject accents.
- `src/styles/base.css` (page frame, buttons) and `src/styles/prose.css` (lesson text, code, maths): tokens only.
- `src/layouts/`: `BaseLayout` (head, header, footer, theme) → `LessonLayout` (written lessons) and `LegacyLayout` (opens an older lesson as itself).
- `src/components/`: shared pieces. `mdx.ts` lists the components every lesson can use without importing.
- `src/sims/`: interactive simulations, imported by the lessons that use them (`import X from '@sims/X.astro'`).
- `src/lib/content.ts`: the only code that reads the collections; builds the folder tree (`getLibrary`, `allPages`, `ancestors`, `neighbours`).
- `src/lib/catalogue.ts`: the same tree as plain data for the islands (`getCatalogue`).
- `src/islands/`: React islands (`Home`, `Map`, `SearchPage`, `SearchBox`), the shared search logic (`search.ts`) and their CSS (tokens only).
- Components use tokens, never raw colours or sizes. Lessons contain words and components, never styling.

## Shared components
Build each component once and use it everywhere from MDX:
- Callouts: `<KeyIdea>`, `<Tip>`, `<Remember>` and `<Warning>` (all share `Callout.astro`).
- `<RealWorld>`: a box for real-world examples.
- `<Figure caption="…">`: SVG diagrams with captions. Draw with `currentColor` and token variables so they work in dark mode.
- `<Sim title="…">`: a frame for small interactive simulations.
- `<Code code={…} lang="…">`: a code block with a copy button (plain ``` blocks get the button too). A sandboxed `<RunCode>` can come later.
- Phase 3: `<Term word="…">` (meanings from `content/glossary.json`) and `<SeeAlso>` (cross-links between subjects).

## Design
- Calm, focused and friendly to a child.
- Body text 18px or larger, lines 70ch or shorter, high contrast.
- Each subject has its own accent colour. All tokens live in `src/styles/tokens.css`. Light and dark mode (follows the device; a switch in the header remembers the choice per device).
- Tablet and phone first, then desktop. Tap targets at least 48px.
- Fast, with minimal JS on content pages.

## Older lessons (single-file HTML, Claude artifacts) — Phase 2
- `inbox/` is the front door for old files (drag-and-drop on github.com).
- `node scripts/import-legacy.ts` imports everything in `inbox/` into `content/unsorted/`; `node scripts/import-legacy.ts <file|folder> <content-folder> [--title] [--slug] [--source]` imports one file, or a folder with an `index.html` (multi-file apps), straight into place. It copies to `public/legacy/…`, reads the `<title>` and writes a stub lesson with a new id. Nothing is overwritten.
- Each older lesson opens **as itself**: `LegacyLayout` is a tiny redirect page that swaps itself (`location.replace`) for the original file in `public/legacy/`, full page, byte-for-byte unchanged, so every animation behaves exactly as standalone. Back returns to the library.
- Start fresh: before the original opens, everything older lessons saved in localStorage/sessionStorage is cleared (only `library.theme` is kept). Their own scores, names and review queues therefore reset on every open, as the owner wants.
- Claude artifacts: single pages and multi-file apps are copied as they are. Features that need Claude (`window.claude`) switch themselves off outside Claude. Claude "Docs" documents run on Claude's own software, so they become `.md` lessons instead: export the text (strip the byline, which names the owner), read each diagram's code (`Claude_Docs__read` on its node) and draw it to plain SVG at import time, placed as `<figure class="docfig">`. Their `--cds-*` colours live in `tokens.css` (light and dark), so the pages need nothing from Claude.
- Check every import for personal details first (the repo is public).

## Writing style for new lessons
- Write for a bright 12-year-old, in UK English, with short sentences.
- Start with the intuition (why it works), then the structure, then the details.
- Explain every technical term in plain words the first time it appears (with `<Term>` once it exists).
- Keep every fact technically accurate. Simplify the words, never the facts.
- Prefer diagrams and small `<Sim>`s over walls of text.
- End each page with 2–3 real-world examples, using `<RealWorld>`.

## ON HOLD (do not build yet)
- Knowledge checks and recall questions.
- Spaced revision (FSRS) and "Today's Review".

Keep the door open: page `id`s stay stable.

## Phases
1. **Skeleton and deploy** (done): Astro project and schemas, layouts, navigation, tokens, core components, Physics → Forces (3 pages), GitHub Pages workflow.
2. **Older lessons** (in progress): any-depth folders, `inbox/`, the import script, the frame, Library map; importing the owner's Claude artifacts and HTML files.
3. **Search, glossary and cross-links**: Pagefind, `<Term>`, `<SeeAlso>`.
- Dropped: progress tracking ("Who's learning?", Mark as done, Continue, progress bars, Firestore).

## How to work with me
- Build one phase at a time. Start each phase with a short plan, and wait for my OK.
- Make small commits with clear messages.
- Run `npm run check` (astro check) and `npm run build` before every push.
- When something needs me (GitHub settings), stop and give me numbered, click-by-click steps, with direct links, describing exactly what I will see.
- Explain decisions briefly, in simple English.
- Ask before adding any new dependency or service.
