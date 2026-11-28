// isogram's portfolio covers: one scene, drawn twice (2400 × 800 and 1000 × 800).
//
// Verb: isogram *builds* the thing it explains. Picture: on the site's navy dot paper, one cube
// (the only accent) is lowered on a cable into the last gap of a block of white cubes, its
// landing spot marked by a faint shadow, with spare cubes waiting in front.
// True isometric throughout, lit the way the dark mark is: top lightest, left next, right darkest.
//
//   BRAND_KIT=/path/to/brand-kit/skills/logo node brand/portfolio/draw.mjs
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const KIT = process.env.BRAND_KIT || join(dirname(fileURLToPath(import.meta.url)), '../../../brand-kit/skills/logo')
const { poly, svg, write } = await import(join(KIT, 'scripts/brand.mjs'))
const here = dirname(fileURLToPath(import.meta.url))

const C = { navy: '#1a2030', dot: '#2c3446', rule: '#2e3648', mist: '#e6eaf2', haze: '#a3adc2', slate: '#4a5468', steel: '#68748c', periwinkle: '#8e9bff', cobalt: '#2f45e6', deep: '#2433b3' }
const COS = Math.cos(Math.PI / 6), SIN = 0.5
const ALT = 'On navy isometric dot paper, one blue cube is lowered on a cable into the last gap of a block of white cubes, while spare cubes wait in front.'

function scene(W, Hh, { s, ox, oy, spares }) {
  const P = (x, y, z) => [ox + (x - y) * COS * s, oy + (x + y) * SIN * s - z * s]
  const box = (x, y, z, dx, dy, dz, [t, l, r]) => {
    const top = poly([P(x, y, z + dz), P(x + dx, y, z + dz), P(x + dx, y + dy, z + dz), P(x, y + dy, z + dz)])
    const left = poly([P(x, y + dy, z), P(x + dx, y + dy, z), P(x + dx, y + dy, z + dz), P(x, y + dy, z + dz)])
    const right = poly([P(x + dx, y, z), P(x + dx, y + dy, z), P(x + dx, y + dy, z + dz), P(x + dx, y, z + dz)])
    return `<path d="${left}" fill="${l}"/><path d="${right}" fill="${r}"/><path d="${top}" fill="${t}"/>`
  }
  const WHITE = [C.mist, C.haze, C.slate], LIVE = [C.periwinkle, C.cobalt, C.deep]
  const parts = [`<rect width="${W}" height="${Hh}" fill="${C.navy}"/>`]
  // Dot lattice on its own ground, tied to the scene's isometric axes.
  const L = 26 * (s / 40) * 1.6
  let dots = ''
  for (let y = 0, row = 0; y < Hh + L; y += L * 0.866, row++) for (let x = (row % 2) * L / 2; x < W + L; x += L) dots += `M${(x - 2.4).toFixed(1)} ${y.toFixed(1)}a2.4 2.4 0 1 0 4.8 0a2.4 2.4 0 1 0-4.8 0`
  parts.push(`<path d="${dots}" fill="${C.dot}"/>`)
  // A soft floor under the block.
  parts.push(`<path d="${poly([P(-0.4, -0.4, 0), P(3.4, -0.4, 0), P(3.4, 3.4, 0), P(-0.4, 3.4, 0)])}" fill="${C.rule}"/>`)
  // The block: 3 × 3 × 2, with the back corner of the top layer (0, 0, 1) left empty for the live cube.
  const cells = []
  for (let z = 0; z < 2; z++) for (let x = 0; x < 3; x++) for (let y = 0; y < 3; y++) if (!(z === 1 && x === 0 && y === 0)) cells.push([x, y, z])
  cells.sort((a, b) => a[0] + a[1] - (b[0] + b[1]) || a[2] - b[2])
  const G = 0.06
  // Shadow on the gap's floor (the top of the cube below), where the live cube lands.
  const shadow = poly([P(G, G, 1), P(1 - G, G, 1), P(1 - G, 1 - G, 1), P(G, 1 - G, 1)])
  for (const [x, y, z] of cells) {
    parts.push(box(x + G, y + G, z, 1 - 2 * G, 1 - 2 * G, 1 - G, WHITE))
    if (x === 0 && y === 0 && z === 0) parts.push(`<path d="${shadow}" fill="#000" opacity="0.12"/>`)
  }
  // Spare cubes waiting on the paper in front, one row each side of the block.
  for (let i = 0; i < spares; i++) {
    parts.push(box(-0.2 - i * 1.4, 4.3, 0, 0.88, 0.88, 0.88, WHITE))
    parts.push(box(4.3, -0.2 - i * 1.4, 0, 0.88, 0.88, 0.88, WHITE))
  }
  // The live cube hangs 1.4 above its gap on a cable from out of frame, so it reads as being put in.
  const hang = 2.4
  const [cx, cy] = P(0.5, 0.5, hang + 1 - G)
  parts.push(`<rect x="${(cx - 3).toFixed(1)}" y="-10" width="6" height="${(cy + 10).toFixed(1)}" rx="3" fill="${C.haze}"/>`)
  parts.push(box(G, G, hang, 1 - 2 * G, 1 - 2 * G, 1 - G, LIVE))
  return svg({ w: W, h: Hh, title: ALT, body: parts.join('') })
}

write(join(here, 'cover.svg'), scene(2400, 800, { s: 100, ox: 1200, oy: 400, spares: 3 }))
write(join(here, 'cover-mobile.svg'), scene(1000, 800, { s: 108, ox: 500, oy: 410, spares: 0 }))
