// isogram's logo, redrawn with brand-kit (github.com/mtblck/brand-kit) from the mark the site
// already uses: one isometric cube, its top face in the cobalt accent, its two sides in the
// site's two inks. The wordmark is "isogram" in lower case, Bricolage Grotesque 700, semi-condensed,
// as in the site header.
//
//   BRAND_KIT=/path/to/brand-kit/skills/logo node brand/draw.mjs
//   node $BRAND_KIT/scripts/export.mjs brand/brand.json
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'

const KIT = process.env.BRAND_KIT || join(dirname(fileURLToPath(import.meta.url)), '../../brand-kit/skills/logo')
const { loadFont, lockup, poly, svg, write, CACHE } = await import(join(KIT, 'scripts/brand.mjs'))
const { subtract, bar, union } = await import(join(KIT, 'scripts/geometry.mjs'))

const here = dirname(fileURLToPath(import.meta.url))
const out = (f) => join(here, f)

// The site's own tokens (site/site.css).
const C = {
  ink: '#18202e', slate: '#4a5468', cobalt: '#2f45e6', paper: '#eef1f5',
  night: '#151a24', navy: '#1a2030', mist: '#e6eaf2', haze: '#a3adc2', periwinkle: '#8e9bff',
}

// ── The mark, on the 256 grid ──
// The site's 32-unit cube scaled by 8: the top vertex at (128, 24), the near corner at
// (128, 136), the side corners at x 32 and 224, the foot at (128, 240). Faces rise 56 for
// every 96 across (30.3°, a hair off true isometric's 30°, as the favicon has always been).
const TOP = poly([[128, 24], [224, 80], [128, 136], [32, 80]])
const LEFT = poly([[32, 80], [128, 136], [128, 240], [32, 184]])
const RIGHT = poly([[128, 136], [224, 80], [224, 184], [128, 240]])
const W = 192, H = 216
const trim = (body) => `<g transform="translate(-32 -24)">${body}</g>`
const faces = (t, l, r) => `<path d="${TOP}" fill="${t}"/><path d="${LEFT}" fill="${l}"/><path d="${RIGHT}" fill="${r}"/>`
const mark = (t, l, r) => ({ body: trim(faces(t, l, r)), w: W, h: H })
const LIGHT = [C.cobalt, C.ink, C.slate], DARK = [C.periwinkle, C.mist, C.haze]

write(out('mark.svg'), svg({ w: W, h: H, title: 'isogram', body: mark(...LIGHT).body }))
write(out('mark-dark.svg'), svg({ w: W, h: H, title: 'isogram', body: mark(...DARK).body }))

// One colour: the hexagon with the cube's inner Y cut out 14 wide (1/15 of the mark), so the
// three faces stay apart when they can't be told apart by colour.
const hex = union(TOP, LEFT, RIGHT)
const Y = union(bar(128, 136, 32, 80, 14), bar(128, 136, 224, 80, 14), bar(128, 136, 128, 240, 14))
const solo = subtract(hex, Y)
write(out('mark-black.svg'), svg({ w: W, h: H, title: 'isogram', body: trim(`<path d="${solo}" fill="#000" fill-rule="evenodd"/>`) }))

// Favicon and app-icon art sit on the landing hero's navy, so both tabs see the same thing.
write(out('favicon.svg'), svg({ w: 256, h: 256, title: 'isogram', body: `<rect width="256" height="256" rx="56" fill="${C.navy}"/><g transform="translate(128 132) scale(0.74) translate(-128 -132)">${faces(...DARK)}</g>` }))

// ── Wordmark lockups ──
// The site sets Bricolage at 85 % width from its variable font. Google Fonts serves static
// files only at named widths, so the wordmark uses the nearest, semi-condensed (87.5 %).
async function bricolage(weight, wdth = 87.5, opsz = 24) {
  const file = join(CACHE, 'fonts', `bricolage-grotesque-${weight}-w${wdth}-o${opsz}.ttf`)
  if (!existsSync(file)) {
    const css = await (await fetch(`https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wdth,wght@${opsz},${wdth},${weight}`)).text()
    const url = css.match(/url\((https:[^)]+)\)/)[1]
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, Buffer.from(await (await fetch(url)).arrayBuffer()))
  }
  return loadFont(file)
}
const font = await bricolage(700)
for (const [layout, file, capRatio] of [['horizontal', 'logo-horizontal', 0.36], ['stacked', 'logo-stacked', 0.3]]) {
  for (const [suffix, colours, word] of [['', LIGHT, C.ink], ['-dark', DARK, C.mist]]) {
    const l = lockup({ mark: mark(...colours), font, name: 'isogram', layout, capRatio, gap: 0.3, color: word, tracking: -0.01 })
    write(out(`${file}${suffix}.svg`), svg({ w: l.w, h: l.h, title: 'isogram', body: l.body }))
  }
  // One-colour lockup: the cut mark, so the cube still reads with one ink.
  const b = lockup({ mark: { body: trim(`<path d="${solo}" fill="#000" fill-rule="evenodd"/>`), w: W, h: H }, font, name: 'isogram', layout, capRatio, gap: 0.3, color: '#000', tracking: -0.01 })
  write(out(`${file}-black.svg`), svg({ w: b.w, h: b.h, title: 'isogram', body: b.body }))
}

write(out('brand.json'), JSON.stringify({
  name: 'isogram',
  shortName: 'isogram',
  tagline: 'Diagrams that build the thing they explain.',
  about: 'isogram is a Claude skill for animated isometric diagrams that explain how a feature works. You describe the feature; Claude invents a small machine whose motion is the explanation, and hands it back as a web component, a GIF, a PNG or an SVG.\n\nThe mark is the smallest isometric thing there is: one cube on drafting paper, its top face in the cobalt that marks whatever is live, its sides in the two inks of the page.',
  construction: 'On a 256 grid: three faces of one cube, the top vertex at (128, 24) and the foot at (128, 240), each face rising 56 for every 96 across; the one-colour version cuts the inner Y out 14 wide.',
  website: 'getisogram.com',
  colors: [
    { name: 'Ink', hex: C.ink, role: 'primary', usage: 'The wordmark, text, and the cube\'s left face.' },
    { name: 'Cobalt', hex: C.cobalt, role: 'accent', usage: 'The cube\'s top face and whatever is live or pressable; one per view.' },
    { name: 'Drafting Paper', hex: C.paper, role: 'paper', usage: 'The light page, under the dot lattice.' },
    { name: 'Night', hex: C.night, role: 'dark', usage: 'The dark page.' },
    { name: 'Hero Navy', hex: C.navy, role: 'support', usage: 'The landing hero in both themes, cards in dark mode, and the icon tile.' },
    { name: 'Slate', hex: C.slate, role: 'support', usage: 'Secondary text and the cube\'s right face.' },
    { name: 'Periwinkle', hex: C.periwinkle, role: 'support', usage: 'Cobalt\'s stand-in on dark grounds: the dark cube\'s top and dark-mode links.' },
  ],
  type: { display: { family: 'Bricolage Grotesque', weight: 700 }, text: { family: 'Bricolage Grotesque', weight: 400 } },
  logos: {
    mark: { file: 'mark.svg', dark: 'mark-dark.svg', black: 'mark-black.svg', minWidth: 16 },
    horizontal: { file: 'logo-horizontal.svg', dark: 'logo-horizontal-dark.svg', black: 'logo-horizontal-black.svg', minWidth: 96 },
    stacked: { file: 'logo-stacked.svg', dark: 'logo-stacked-dark.svg', black: 'logo-stacked-black.svg', minWidth: 64 },
  },
  icon: { file: 'mark-dark.svg', background: C.navy, favicon: 'favicon.svg' },
  clearSpace: 0.25,
  social: { background: C.paper },
  templates: { background: C.navy, social: { kicker: 'getisogram.com' } },
  palette: { brand: C.cobalt, accent: false },
  direction: { words: ['precise', 'playful', 'technical'], pairs: { tone: 'between', era: 'modern', volume: 'quiet', finish: 'crafted' }, lives: 'web', weirdness: 2 },
  legal: { owner: 'Matt Black', codeLicense: 'MIT', contact: 'https://github.com/mtblck/isogram/issues' },
  portfolio: {
    cover: 'portfolio/cover.svg',
    mobile: 'portfolio/cover-mobile.svg',
    alt: 'On navy isometric dot paper, one blue cube is lowered on a cable into the last gap of a block of white cubes, while spare cubes wait in front.',
  },
  exports: 'all',
  out: 'dist',
}, null, 2) + '\n')
