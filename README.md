# Reeto Ghosh

Personal site. React + TypeScript + Vite, deployed to Vercel.

## Commands

```bash
npm install
npm run dev        # dev server with HMR
npm run build      # typecheck, then build to dist/
npm run preview    # serve the production build
npm test           # vitest, single run
npm run test:watch
npm run lint       # eslint, includes jsx-a11y + react-hooks
npm run typecheck
npm run format     # prettier
```

## Layout

```
src/
  content.ts       every string and data object on the page
  types.ts         shapes for those objects
  App.tsx          masthead, section order, footer
  components/      Work, Sections (projects/skills/education), Contact, icons
  hooks/           useHashScroll
  styles/
    global.css     colour tokens + reset
    layout.css     shell, section rhythm, link sweep, grain
    site.css       rows, skill table, masthead, footer
  test/            vitest specs + jsdom shims
public/            favicon, manifest, résumé PDF
```

## Editing content

`src/content.ts` is the only file you need for copy. Sections are ordered in
`SECTION_IDS`; `App.tsx` renders them in that order and a test asserts every id
resolves to a real `<section>`, so a rename breaks the build rather than the page.

`experience[].highlights` and `row__notes` are the lines people actually read. A
test requires at least one quantified claim per role and rejects marketing filler
("seamless", "empower", "agentic"), which is the house style: past tense, metric
first, no adjectives.

## Masthead photo grid

`src/photos.ts` holds the grid: `photos` (src/alt per image), `grid`
(columns, rows, tile size, gap), and `spin` (the automatic sway and how far the
keyboard can turn it).

The images currently in `public/photos/` are generated placeholders. Regenerate
them with `python3 scripts/make_placeholders.py`, or replace them with real
photographs — aim for roughly `tile / 2` px square, which keeps the whole grid
well under 100 kB. There is one photo per tile, so the list length must stay equal to
`columns * rows`; a test enforces it.

Motion: the grid sways on its own, arrow keys or a drag turn it, and your manual
offset eases back to centre. `prefers-reduced-motion` stops the automatic sway but
leaves the keyboard and drag working, since those are user-initiated.

## Design

Dark only, one accent (`#7aa2f7`), and a white-alpha ladder for hierarchy instead
of extra colours. `src/test/palette.test.ts` computes WCAG contrast for every
token against both the background and the hovered-row tint; the current floor is
7.06:1, well past AA.

Three fonts: DM Sans for body, Fraunces for the name and degree, Geist Mono for
micro-labels and years. Type is the only ornament. Fraunces is variable, so the
name pins its optical size, softness, and wonk axes in `site.css`.

Interaction is deliberately thin: rows tint on hover, links sweep an underline in.
Nothing lifts, scales, or glows.

## CI

`.github/workflows/ci.yml` runs format check, typecheck, lint, tests, and build on
every push and pull request to `main`.
