---
public: false
---

# 0001: The brand lives in brand/, drawn by brand-kit and outside the MIT license

- **Status:** Accepted
- **Date:** 2026-11-28
- **PR:** [#49](https://github.com/mtblck/isogram/pull/49)

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
The site uses the kit too: `site/icons/` is a copy of `brand/dist/icons/` (favicons, app icons, manifest), `site/og.png` is
`brand/dist/social/og-image.png`, and the header logo in `tools/site.mjs` is the kit's mark coloured by the page's
tokens. After a new export, copy those files across again.
