---
public: false
---

# 0001: The brand lives in brand/, drawn by brand-kit and outside the MIT license

- **Status:** Accepted
- **Date:** 2026-11-28
- **PR:** (this PR)

## Context

isogram had a mark (the three-face cube in `site/icon.svg` and the header) and a wordmark set live in
Bricolage, but no logo files, icons, guidelines or templates, and nothing saying the name and logo
weren't covered by the repo's MIT license, which would otherwise let anyone reuse them as freely as the
code. Matt's brand-kit plugin (mtblck/brand-kit) draws logos from code and exports a whole kit from one
`brand.json`.

## Decision

We keep the brand in `brand/`: `draw.mjs` redraws the existing cube on a 256 grid and sets the wordmark
in Bricolage Grotesque 700 (semi-condensed, the nearest static width to the site's 85 %), `brand.json`
drives brand-kit's export, and `brand/LICENSE` (all rights reserved) and `brand/TRADEMARKS.md` keep the
brand out of the MIT license. The export (`brand/dist/`, ~16 MB) is ignored by git and rebuilt with
`node $BRAND_KIT/scripts/export.mjs brand/brand.json`.

## Consequences

The logo can be changed by editing code, and the guidelines, icons and templates follow from one run.
The colours are the site's tokens, so a token change in `site/site.css` should be copied into
`brand/draw.mjs` and exported again. `brand/` never ships in `isogram.skill` (only `SHIPPED` does).
The site still draws its own copy of the cube; switching it to the kit's icons is a separate change.
