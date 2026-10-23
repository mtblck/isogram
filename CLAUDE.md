# isogram

A Claude skill for animated isometric "how it works" diagrams (`SKILL.md`, `references/`, `assets/`,
`scripts/`, `examples/`) and the tooling that maintains it (`package.json`, `tools/`, `test/`, `.github/`).
Public repo `mtblck/isogram`. Site: https://getisogram.com (`site/`, built by `npm run site` into `dist/site`,
one Vercel project; the docs pages are `SKILL.md` and `references/*.md` rendered at build). The old demo at
mattblack.space/skills/isogram redirects there. Tickets are this repo's issues, shown on Boards (mtblck/boards).

## Commands

`npm test` · `npm run build` (examples through `scripts/build.py` into `dist/examples/`, and
`dist/isogram.skill`) · `npm run site` (getisogram.com into `dist/site`) · `npm run preview` (serves it with
vercel.json's headers) · `npm run verify` after `build` and `site` (real-browser check; `CHROME_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome`
in Claude's cloud sandbox, where the Playwright CDN is blocked) · `node scripts/export.mjs dist/examples/NAME.html --formats sheet --looks glow,vector,pixel,blueprint`
to review a diagram step by step.

CI and Claude review run on PRs (`.github/workflows/`; playbook in mtblck/boards `docs/ci.md`).
Open PRs as drafts and mark them ready only when the work is done: that triggers the Claude review.

## Load-bearing decisions

- **The skill ships only `SHIPPED` in `tools/skill-files.mjs`.** Repo tooling never goes in `isogram.skill`,
  and the skill's own scripts (`scripts/`) stay dependency-free: `build.py` is stdlib Python, `export.mjs`
  uses Playwright only if a Chromium is already installed and never installs one.
- **A diagram is a pure function of time.** `draw(g, k)` gets the loop time and nothing else; no state
  between frames. Tests rely on it (they run every example's scene in Node without a DOM).
- **`assets/isogram.js` is browser-only and runs on other people's pages.** Shadow DOM, no globals but
  `window.ISOGRAM` and `<iso-gram>`; any text put into HTML is escaped.
- **Looks own colour, diagrams own meaning.** A diagram never names a hue; it says `tone`, `lit`, `role`
  or `material`, and each look maps those to its palette (pixel snaps everything to 16 colours).
- **Painter's order is the diagram's job.** Solids are drawn in call order; anything nearer the viewer
  (larger x + y, or higher z at the same footprint) is drawn later. Every new or changed example gets its
  step sheet reviewed in all four looks before it ships.
- **The site's CSP is `script-src 'self'`.** No inline scripts or handlers (`test/site.test.mjs` guards it); the
  theme is set by `site/theme.js` before first paint. Fonts are self-hosted from `@fontsource-variable`.
  The site copies the runtime, examples and skill package in at build, so it always shows what ships.
- **Licence is MIT** (LICENSE is the plain text so GitHub detects it); credits for iso-glow/iso-figure,
  anatomy and the Sweetie 16 palette live in README.
- **Claude commits for Matt as `mtblck <105079242+mtblck@users.noreply.github.com>`.** Vercel blocks
  deploys whose author email isn't linked to Matt's account.

The full reasoning behind these, and every other decision worth keeping, is in
`docs/adr/` (one short record per decision; copy `0000-template.md`). Reversing
one means a new ADR that supersedes it, in the same PR.
