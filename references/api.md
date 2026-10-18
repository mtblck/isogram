# isogram API

## Definition

```js
ISOGRAM.define({
  id: 'call-routing',          // used by <iso-gram name="…">; also the build's default file name
  title: 'Call routing',       // card title (top right)
  aria: '…',                   // what it shows, for screen readers (the element adds the controls)
  duration: 11000,             // one loop, ms
  still: 5600,                 // the moment that explains most: reduced motion, PNG, SVG
  look: 'glow',                // default look (page attribute wins)
  theme: 'auto',               // optional default theme
  accent: '#22d3ee',           // optional default accent (page attribute wins)
  aspect: 4 / 3,               // stage aspect
  margin: 0.07,                // fit padding, fraction of the larger side
  bounds: [[x,y,z], …],        // optional: fixed fit instead of auto-fit over the loop
  hint: '…',                   // caption when there are no beats
  beats: [{ at: 0, id: 'in', caption: '…', show: 900 }, …],   // show: the frame for this beat when a viewer steps to it and in the step sheet (default: 70% through the beat)
  draw(g, k) { … },            // pure function of k.t; called every frame
});
```

Several diagrams can live in one file or page; each `<iso-gram name>` picks one.

## Coordinates

World units ≈ CSS px at the default fit. +x runs down-right, +y down-left, +z up. Visible faces: top, FRONT (the y = max face, lower-left) and SIDE (the x = max face, lower-right). Draw back to front: smaller x + y first, lower z first. Floor of a plate of height 8 is z = 8; run floor wires at z = 9.

## Builder `g`

| Call | Draws | Returns |
|---|---|---|
| `g.box(x,y,z,w,d,h,{r,tone,lit,op,shadow,topRole})` | rounded (r) or sharp box; walls shaded by facing, rim/edges per look | handle |
| `g.cyl(cx,cy,z,r,h,{tone,lit,shadow})` | upright cylinder | handle (+ `.ring(radius,{role})` on its top) |
| `g.cube(x,y,z,s,{…})` | small box with slightly rounded corners (tokens, packets) | handle |
| `g.plate(x,y,z,w,d,h,{r=12,tone='lo',inset=8,screws=true})` | ground plate with inset line and four screws | handle |
| `g.wire(points,{lit,round=6,ends=true,w,op,under=true})` | cable along 3D points, corners filleted, terminal dots at both ends, a panel-coloured under-stroke so crossings read | route |
| `g.packet(route,u,{lit=1,len=26,head})` | light dash ending at arc-length fraction `u`, fades at both ends of the route | — |
| `g.bloom(p,r,lit)` | soft radial light at a 3D point (glow and vector looks) | — |
| `g.shadow(x,y,w,d,{z,r,lift})` | floor shadow (vector, pixel); `box/cyl({shadow:true})` call it for you | — |
| `g.line(points,{role,lit,w})` | any 3D polyline (role `detail`, `wire`, …) | — |
| `g.term(p,lit,r)` | terminal dot | — |
| `g.sorted([{ b:[x,y,z,w,d,h], draw(){…} }])` | draws items in true depth order (separating-axis sort); use for parts that pass each other | — |
| `g.top(x,y,z,w,d)`, `g.front(x,y,z,w,h)`, `g.side(x,y,z,d,h)` | a free face plane (origin = face top-left) | plane |
| `g.route(points)` / `g.fillet(points,r)` | route without drawing / rounded polyline | route / points |
| `g.readout(str)` | bottom-right card text for this frame | — |
| `g.look` | current look name (for small spacing fixes only) | — |

**Handle:** `{ x,y,z,w,d,h, c (centre), top, front, side, at(fx,fy,fz) }`. Face planes: `top` origin is (x,y,z+h) with u→+x, v→+y; `front` origin (x,y+d,z+h) with u→+x, v down; `side` origin (x+w,y+d,z+h) with u→−y, v down. Each knows its own `w`/`h`.

**Plane** (all chainable, face-local units):

| Call | Notes |
|---|---|
| `rect(u,v,w,h,{r,role,tone,lit})` | raised panel in the face's own tone by default |
| `recess(u,v,w,h,{r})` | pocket / slot / screen bezel |
| `glass(u,v,w,h,{r,lit,halo})` | display glass; lit → accent tint, accent rim and halo |
| `circle(u,v,r,{role})` | screw head, port, button (`role:'recess'` default) |
| `led(u,v,r,lit)` | indicator with bloom when lit |
| `line(u0,v0,u1,v1,{role,lit,w})` / `slits(a0,a1,step,b0,b1,vertical=true)` | hairline detail, vents, ribs |
| `text(u,v,str,{size=7,align,lit,role,max,weight,op})` | engraved label, baseline at v. Shrinks (vector looks) or trims (pixel) to fit `max`, which defaults to the room left on the face. Fade it with `op` (0..1) from an envelope; `role:'engrave'` for a label on a part that lights up. In the pixel look it follows the face's 2:1 slant in a 3×5 font, or, when the whole label can't fit at that size, becomes greeked marks (2 px per character); force either with `pixel: 'text'` or `pixel: 'greek'` |
| `screws(inset=6,r=1.6)` | four corner screws |
| `clip(u,v,w,h,r,fn)` | everything `fn(plane)` draws is clipped to the rect (scrolling screen text) |
| `sub(u,v,w,h)` / `at(u,v)` | child plane / 3D point |

**Route:** `{ pts, len, at(u) → [x,y,z], part(u0,u1) → points, start, end }`.

`op` (0..1 opacity) works on every primitive: solids, plane shapes, lines, wires and text.

**Roles** (what `paint` maps to colours): `top front side edge rim` (solids), `detail detail-rect recess screw glass led wire packet packet-head term ink engrave ink-hi accent`. `tone`: `lo | mid | hi`. `lit`: 0..1 toward the accent.

## Timeline `k`

| Field / call | Meaning |
|---|---|
| `k.t`, `k.duration` | ms inside the loop |
| `k.i`, `k.beat`, `k.u`, `k.beats` | current beat index/object, progress 0..1 through it |
| `k.at(i or id)` / `k.since(i or id)` | beat start time / ms since it |
| `k.ramp(t0,t1,ease=smooth)` | 0 → 1 between two times |
| `k.env(t0,t1,attack=300,decay=300)` | 0 → 1 → 0 with smooth edges; use for every light |
| `k.pulse(at,len)` | single sine bump |
| `k.cycle(period,phase)` | repeating 0..1 sawtooth |
| `k.spring(t0,{stiffness,damping})` | 0 → 1 with a small overshoot (dials, doors, carriages) |
| `k.smooth`, `k.easeInOut` | easing functions |

## Element `<iso-gram>`

Attributes: `name`, `look`, `pixel-size` (pixel look: CSS px per art pixel; absent ≈ 320 art pixels across), `theme` (`auto` follows the OS, `default` uses the look's own, `light`, `dark`), `accent`, `frame="none"` (no card at all), `labels="none"` (no corner texts), `progress="none"` (no step bars), `transparent`, `speed`, `paused`, `fig`. Without the corner texts the beat captions are still in the screen-reader list.
CSS: style the host like any block element (width, margin); set `--isogram-sans`, `--isogram-mono` or `--isogram-pixel` on the page to put the card's text in your site's fonts; `::part(card)`, `::part(stage)`, `::part(head)`, `::part(foot)`, `::part(steps)` for fine tuning.
Methods: `play() pause() toggle() step(±1) goto(i) seek(ms)`;
exports `toPNG({t,width,frame,labels,progress,transparent,look,theme,accent})` (each export takes the same options; they default to the element's attributes) → Blob, `toGIF({width=640,fps=20,frame,onProgress})` → Blob, `toSVG({t,…})` → string (not pixel), `toWebM({width,fps})` → Blob (records one loop in real time), `toSheet({width,cols})` → Blob, `toCanvas(…)`.

## Adding a look

```js
ISOGRAM.addLook('chalk', {
  label: 'Chalk', proj: 'iso',            // 'iso' (30°) or 'dimetric' (2:1)
  font: '"Caveat", cursive', caps: false,
  stroke: true, rim: false, lw: 1.2, wireW: 1.6, packetW: 3, seam: false, soft: false,
  pixel: null,                            // or { width: 320 } for low-res rendering + palette snapping
  default: 'dark',
  themes: { dark: { glow: false, bg, panel, line, edge, edgeHi, detail, recess, glass, ink, inkHi, label?, wire, term,
                    shadow, shadowA, face: { lo:[top,front,side], mid:[…], hi:[…] }, accent, accentHi, glassOn, halo, rim? },
            light: { … } },
});
```

All theme colours are 6-digit hex. Lit tones are derived from `accent`/`accentHi` (override with `litTop/litFront/litSide`). In a pixel look every colour in the theme becomes the palette, so keep it small.
