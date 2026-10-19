---
name: isogram
description: Build animated isometric "how it works" diagrams for web pages: a small physical machine whose motion explains a product feature (calls routed, jobs queued, data synced), with step captions and a live readout. One scene renders in several looks (glow hairline, clean vector, 2:1 pixel art, blueprint; light and dark) and exports as a drop-in <iso-gram> web component (HTML+CSS+JS), a self-contained embed snippet, GIF, PNG, SVG, WebM and a step sheet. Use for feature explainers, landing-page or docs illustrations, onboarding visuals, isometric animated diagrams, pixel-art or vector isometric illustrations, and "iso-glow"/"anatomy"-style figures meant to be embedded.
---

# Iso diagram

Animated isometric figures that explain how a feature works, built to be dropped into a web page. It merges two earlier skills: the projection kernel, face planes and one-accent glow of **iso-glow** (after iso-figure by Tolga Cohce, MIT), and the design discipline of **anatomy** (the object is the explanation, one model drives every number and motion, a framed card, calm motion, check by zooming in).

## The idea in three lines

1. **The object is the explanation.** Invent a small, well-made physical machine whose working *is* the feature. Not boxes and arrows with labels: a router with a rotary selector, a tape recorder for voicemail, a drawer cabinet for a cache.
2. **Time is the only input.** A diagram is `draw(g, k)`: a pure function of the time `k.t` inside one loop. The same function drives the live page, every look, and every export frame, so a GIF is exactly what the page shows.
3. **One accent, only on what is live.** Everything is neutral until it acts; what acts (a packet on a wire, a lit key, a ringing handset, a screen) takes the accent. The looks only change how that is painted.

## Files

Paths below are relative to this skill's folder (shown when the skill loads).

| File | Use |
|---|---|
| `assets/isogram.js` | The runtime: scene builder, looks, canvas + SVG renderers, GIF encoder, `<iso-gram>` element. Never edit it per diagram. |
| `assets/preview.html` | Template for the preview/export page (used by `build.py`). |
| `scripts/build.py` | `python3 build.py DIAGRAM.js [--out DIR] [--name NAME]` writes `NAME.html` (preview + export buttons; in a normal browser tab they download, inside an app's preview pane, where downloads are blocked, the result is shown in the page to save with right-click or copy), `NAME.isogram.js` (one script for `<script src>`) and `NAME.embed.html` (paste-anywhere snippet). No dependencies. |
| `scripts/export.mjs` | `node export.mjs NAME.html [--looks glow,vector] [--formats png,gif,svg,sheet] [--width 800] [--theme light] [--t ms] [--no-frame] [--no-labels] [--no-progress] [--transparent] [--pixel-size 1|2|3]` writes image files headlessly, named `NAME-<look>.png|gif|svg` and `NAME-<look>-steps.png` (with `--theme`, `-<theme>` is added after the look). Uses Playwright only if a Chromium is **already** installed; never installs one. Exit 2 means "no browser here": the preview page's Export buttons do the same thing. |
| `examples/starter.js` | 35 lines: request → server → response. Copy this to start. |
| `examples/pumpkin.js` | A full Figure: carving a jack-o'-lantern on a crypt altar in five beats (lid, seeds, face, carve, candle). A curved, ribbed body built from `g.poly` lobes, a face wrapped onto the surface, a floating lid, a set dressed with gravestones, pillar candles, a skull and circling bats, a finale where the lights come on in turn. The quality reference. |
| `examples/robot.js` | A robot assembled in four moves: the torso flickers into being, the head spirals down and screws on, gantry claws bring in the arms, the legs rise through floor hatches; then it powers on. Shows flicker/materialise, spiral paths, carried parts and a power-on sequence. |
| `examples/rocket.js` | A round trip across a scene: drones stack four stages on an Earth pad, it launches, coasts, lands tail-first on a small planet and is unstacked there; the loop cross-fades back to the start. Shows a sphere from `g.poly` patches, moving one assembly between two sets, and reversible build/unbuild from one parts list. |
| `references/api.md` | Every builder, plane and timeline helper, the element's attributes and export methods, and how to add a look. Read it when you write a diagram. |
| `references/craft.md` | The design rules with reasons: concept-to-object table, parts vocabulary, tone hierarchy, motion envelopes, per-look notes, review checklist. Read it before designing. |

## Workflow

1. **Say the size, then start.** A *Figure* (one mechanism, 3–6 beats, 25–60 parts) is the default and takes one pass plus a review. A *set* (several figures for one page) shares one scale, one accent and one look. Tell the user which it is in one line and begin.
2. **Truth first.** Write down the real behaviour you are explaining: the steps in order, the numbers (timeouts, counts, latencies, retry limits), what happens on the failure path. These become the beats and the readout. Ask only if a number is unknowable; otherwise use the product's real defaults and say which you assumed.
3. **Invent the object.** One sentence: *what moves, and what that motion means.* See the table in `references/craft.md`. Keep words out of the drawing apart from short engraved labels on faces; the captions and readout carry the language.
4. **Beats.** 3–6 beats, each a caption a reader could act on (`It rings the Sales desk`, not `Step 3`). Loop length 5–12 s. Give the failure path its own beat when it is part of the feature. Pick `still`: the single moment that explains the most (used for reduced motion, PNG and SVG). Give each beat a `show` time at its key moment: it is the frame a viewer lands on when stepping, and the frame the step sheet shows. Keep captions under ~32 characters and readouts under ~22 if the pixel look matters (its bitmap font is wider; longer text is trimmed with …).
5. **Parts list, then layout.** World units ≈ px; +x runs down-right, +y down-left, +z up; the faces you can see are the top, FRONT (y = max) and SIDE (x = max), so point detail at those. Start from `g.plate(...)`. Write each part's `(x, y, z, w, d, h)` before drawing. Leave room for labels: pixel text is wider than vector text.
6. **Write the diagram** in `NAME.js` from `examples/starter.js`. Put the model at the top of `draw` (every timing and number computed from `k`), then draw back to front, then `g.readout(...)` from the same model. Use envelopes (`k.env`, `k.ramp`, `k.spring`) for every change so nothing pops.
7. **Build and look at it.** `python3 scripts/build.py NAME.js --out OUTDIR`. If `node scripts/export.mjs OUTDIR/NAME.html --formats png,sheet` works here, read the PNGs it writes (the step sheet shows every beat), crop and zoom into the busy areas, and fix what you see. Check at least two looks (the target look and pixel, which is the least forgiving about space). If it cannot run, `node --check NAME.js`, re-read the code once, and open the preview page for the user.
8. **Deliver** what the user will drop into their page, usually the `.embed.html` snippet or `.isogram.js` + the one-line tag, plus a GIF/PNG if they asked for an image (from `export.mjs`, or tell them the preview page's Export buttons make them). Show the embed code in the reply.

## Writing a diagram (short form)

```js
ISOGRAM.define({
  id: 'starter', title: 'Request and response', duration: 5000, still: 2200,
  look: 'glow',                       // default look; the page can override with look="pixel" etc.
  beats: [{ at: 0, caption: 'The app sends a request' }, { at: 1600, caption: 'The server handles it' }, { at: 3000, caption: 'The answer comes back' }],
  draw(g, k) {
    const send = k.ramp(200, 1500, k.easeInOut), busy = k.env(1500, 3200, 200, 400);
    g.plate(0, 0, 0, 300, 220, 8);
    const srv = g.box(40, 30, 8, 80, 70, 90, { r: 6, shadow: true });
    srv.front.slits(8, 72, 4, 10, 40).led(70, 52, 1.8, busy).text(8, 56, 'API', { size: 8 });
    const w = g.wire([[100, 100, 24], [100, 150, 24], [100, 150, 9], [170, 150, 9]], { lit: busy });
    g.packet(w, 1 - send, { lit: k.env(200, 1600, 100, 200) });
    const app = g.box(170, 120, 8, 90, 60, 40, { r: 6, tone: 'hi', shadow: true });
    app.front.recess(8, 7, 74, 22, { r: 3 }).glass(10, 9, 70, 18, { r: 2, lit: k.env(4200, 5000) });
    g.readout(k.t < 1600 ? 'POST /orders' : 'response · 42 ms');
  },
});
```

- **Solids:** `g.box(x,y,z,w,d,h,{r,tone,lit,shadow})`, `g.cyl(cx,cy,z,r,h,…)`, `g.cube(x,y,z,s,…)`, `g.plate(…)` (base with inset line and screws). They return a handle with face planes `.top`, `.front`, `.side`.
- **On a face:** `plane.rect / recess / glass / circle / led / line / slits / text / screws / clip`, all in face-local units (u right, v down from the face's top-left), chainable.
- **Flow:** `g.wire(points, {lit})` returns a route (corners rounded, terminal dots at both ends); `g.packet(route, u, {lit})` draws a light dash at arc-length position `u`; `route.at(u)` gives a 3D point to carry a `g.cube` along it.
- **Light:** `lit` (0..1) on anything blends it to the accent; `g.bloom(p, r, lit)` and lit glass add soft light in looks that allow it.
- **Order:** painter's order is draw order, back to front. Parts that move past each other go through `g.sorted([{ b:[x,y,z,w,d,h], draw(){…} }, …])`.
- **Time:** `k.t`, `k.i` (beat), `k.u` (progress in beat), `k.at(id)`, `k.ramp(t0,t1)`, `k.env(t0,t1,attack,decay)`, `k.pulse(at,len)`, `k.cycle(period)`, `k.spring(t0)`, `k.easeInOut`.

Full signatures: `references/api.md`.

## Looks

| Look | Projection | What it is | Default theme |
|---|---|---|---|
| `glow` | true iso (30°) | Hairline drawing, accent glow on what is live (iso-glow). Light theme drops all glow. | dark |
| `vector` | true iso | Clean flat fills, three tones by facing, top rim light, soft floor shadows, no outlines. | light |
| `pixel` | 2:1 dimetric | Rendered low-res, snapped to a 16-colour palette, scaled up with hard pixels; bitmap 3×5 font; dithered light. | dark |
| `blueprint` | true iso | White hairlines on blueprint blue (or blue on paper in light). | dark |

The same diagram code works in every look; never branch on the look except for small spacing fixes (`g.look`). The page chooses with `look=`, `theme="auto|light|dark|default"`, `accent="#hex"`. Add a look with `ISOGRAM.addLook(name, spec)` (see `references/api.md`).

## Embedding (what the user gets)

```html
<script src="pumpkin.isogram.js"></script>
<iso-gram name="pumpkin" look="vector" theme="auto"></iso-gram>
```

Attributes: `look`, `theme`, `accent`, `frame="none"` (drawing only, no card), `labels="none"` (hide the four corner texts: Fig n, title, caption, readout; the card stays), `progress="none"` (hide the step bars), `pixel-size` (pixel look only: CSS px per art pixel; 1 is fine pixel art with readable labels, 2–3 chunkier; absent, about 320 art pixels across), `transparent` (no panel, sits on the page background), `speed`, `paused`, `fig` (the "Fig N" number). The element sizes to its container (aspect from the diagram), uses shadow DOM so the site's CSS can't break it, pauses offscreen, shows the `still` frame under reduced motion, and is keyboard operable (space pauses, ←/→ step through beats; the step bars are clickable). Beat captions are also in a visually hidden list for screen readers and search. In React/Next, load the script once and render the tag (`<iso-gram name="…" look="…" />`; it is a plain custom element).

For an image instead of live code: `NAME-look.gif` (loops, only changed regions stored per frame), `.png` (the `still` frame), `.svg` (glow, vector, blueprint), `.webm` (preview page only), `-steps.png` (one frame per beat, at each beat's `show` time).

## Rules that matter most (details in `references/craft.md`)

- **Make it real and detailed.** Every part sits on another part: feet, plinths, seams, slits, screws, label plates, keypads, reels, dials with ticks. At 1× it reads as one clear machine; zoomed in, every face still has something true on it. A bare face is unfinished.
- **Tone hierarchy.** Base `lo`, structure `mid`, the subject `hi`; exactly one kind of thing is lit at a time where possible: the part the reader should watch.
- **Lines resolve.** Every wire starts and ends on a port with a terminal dot (or disappears behind the part it enters). No floating arrows, leader lines or labels in the air.
- **Nothing pops.** Every light, screen and motion rides an envelope with attack and decay; packets fade in and out at the ends of their route; springs settle.
- **The readout is the model.** Counters, timers and rule counts come from the same numbers that move the parts, terse and lowercase: `ringing sales · 12 s / 20 s`.
- **Lit state unmistakable.** Readable at thumbnail size in every look. Text on a part that lights up uses `role: 'engrave'` so it stays legible on the accent.
- **Fit and frame.** The kit fits the view to everything drawn across the loop; keep outliers (tall masts, far wires) in check so the subject fills ~55–65% of the card. Keep one scale across a set.
- **No real logos, products or trademarks** on objects or screens; invent glyphs and names. Colour only through the look's tokens and `lit`, never a literal hue in a diagram.
