# Learning Library

Our family's learning material in one place: https://efrahdev.github.io/Learning/

## Add a lesson
1. Pick the folder, e.g. `content/physics/forces/` (folders can be nested as deep as you like; a folder's `meta.json` gives its title).
2. Add a file like `04-gravity.mdx` with frontmatter (copy one of the existing pages). Give it a new, unique `id`; never change an `id` later.
3. Commit to `main`. The site updates about a minute later.

Lessons can use `<KeyIdea>`, `<Tip>`, `<Remember>`, `<Warning>`, `<RealWorld>`, `<Figure>`, `<Sim>` and `<Code>` without importing anything, and maths with `$…$` or `$$…$$`.

## Run it on a computer
```sh
npm ci
npm run dev      # http://localhost:4321/Learning/
npm run check    # types and content
npm run build    # the full site, into dist/
```

## Bring in an older HTML lesson
Drop the `.html` file into `inbox/`, then run `node scripts/import-legacy.ts` (or ask Claude). It appears under **Unsorted**, ready to move into a subject.

How everything fits together: see [CLAUDE.md](CLAUDE.md).
