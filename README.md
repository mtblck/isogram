# isogram

A [Claude](https://claude.ai) skill for animated isometric diagrams that explain how a feature works. You describe the feature; Claude invents a small machine whose motion *is* the explanation (a jack-o'-lantern on a crypt altar whose carved face lights up when the candle goes in, a server that answers a request), and hands it back as a drop-in web component, a GIF, a PNG or an SVG.

**Site:** [getisogram.com](https://getisogram.com): live examples, a playground and the docs.

```html
<script src="pumpkin.isogram.js"></script>
<iso-gram name="pumpkin" look="vector" theme="auto"></iso-gram>
```

## Install

Download [`isogram.skill`](https://getisogram.com/isogram.skill) from the site (or zip this folder as `isogram/`) and add it to Claude as a skill. In Claude Code you can also copy the folder to `~/.claude/skills/isogram/`.

Then ask for one:

> Make an isogram of how our webhook retries work, vector look, for the docs. Retries back off 1 s, 4 s, 16 s, then the event goes to a dead-letter queue.

## What you get

- **Four looks from one scene:** `glow` (hairlines, accent glow on what's active), `vector` (flat fills shaded by facing, soft shadows), `pixel` (2:1 pixel art, 16-colour palette, slanted bitmap labels), `blueprint` (white linework on blue). Each has light and dark themes.
- **`<iso-gram>` web component:** shadow DOM, sizes to its container, pauses offscreen, shows a still frame under reduced motion, steps with the arrow keys, and keeps beat captions in a screen-reader list. Attributes: `look`, `theme`, `accent`, `frame="none"`, `labels="none"`, `progress="none"`, `transparent`, `pixel-size`, `speed`, `paused`, `fig`.
- **Exports:** looping GIF (only changed regions stored per frame), PNG, SVG (vector looks), WebM and MP4 at 30 fps (ffmpeg-encoded from `export.mjs` when it's installed: ~100–200 KB a loop), and a step sheet with one frame per beat — from the preview page's buttons, the element's methods, or headlessly with `scripts/export.mjs`.

## Layout

| Path | |
|---|---|
| `SKILL.md` | What Claude reads: workflow, the scene API in short, looks, embedding, the rules that matter |
| `references/api.md` | Every builder, plane and timeline helper; element attributes and export methods; adding a look |
| `references/craft.md` | Design rules with reasons: concept-to-object table, parts, tone, motion, per-look notes, review checklist |
| `assets/isogram.js` | The runtime: scene builder, looks, canvas + SVG renderers, GIF encoder, `<iso-gram>` |
| `scripts/build.py` | `python3 scripts/build.py DIAGRAM.js` → preview page, `NAME.isogram.js`, self-contained embed snippet |
| `scripts/export.mjs` | Headless PNG/GIF/SVG/step-sheet export (needs an already-installed Chromium + Playwright) |
| `examples/` | `starter.js` (35 lines), `pumpkin.js` (carving a jack-o'-lantern on a crypt altar), `robot.js` (a robot assembled by claws and hatches) and `rocket.js` (build, lift off as the platform falls away, fly, land on a new platform, unstack) |

## Developing

The repo holds the skill and the tooling that checks it; only the skill's own files go in `isogram.skill`.

```sh
npm ci
npm test          # every example's scene across its loop in every look, the SVG export, build.py, the package contents
npm run build     # dist/examples/ (each example through build.py) and dist/isogram.skill
npm run site      # getisogram.com into dist/site (npm run preview serves it with production headers)
npm run verify    # each example in a real browser (every look and theme paints, steps and exports), then the site
```

CI runs all three on every pull request, and Claude reviews a PR when it's marked ready.

## Design notes

- **A diagram is a pure function of time.** `draw(g, k)` is called every frame with the loop time; there is no other state. That's what lets one scene render live in every look and export to a GIF that is exactly what the page shows.
- **The object is the explanation.** Taken from *anatomy*: boxes-and-arrows diagrams read as decoration; a recognisable machine reads as a mechanism. The skill pushes Claude to pick an object, write a parts list, and drive every number in the readout from the same model that moves the parts.
- **One accent, only on what's active** — taken from *iso-glow*. Looks own colour; diagrams own meaning, so a diagram never names a hue.
- **Pixel art is rendered, then snapped.** The scene is drawn at one art pixel per CSS pixel (or `pixel-size`) with 2:1 projection, every pixel is snapped to the theme's palette, and the result is scaled up with hard edges. Labels on faces follow the face's 2:1 slant in a 3×5 font, or become "greeked" marks when the whole word can't fit — a first version that kept letters upright looked pasted on.
- **Downloads inside app preview panes are blocked**, and a blocked one replaced the whole page. The preview page detects that it's framed and shows the export inline to save by hand.
- **A Claude Code side-panel version was tried and shelved:** panes can only draw script-less SVG, so animation means redrawing per frame, and in a cloud session no surface was attached to draw it at all.

## Credits

MIT licensed. Built on [iso-glow](https://iso-glow.vercel.app) (after [iso-figure](https://github.com/MrBongoC/ai-iso-skill) by Tolga Cohce, MIT) and anatomy (MIT). Pixel palette after Sweetie 16 by GrafxKid.
