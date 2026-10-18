# Craft: making a diagram that explains

Lessons carried over from anatomy (dozens of reviewed figures) and iso-glow (twenty figures), adapted to feature diagrams that live on product and docs pages.

## 1. The object is the explanation

Readers understand a mechanism they recognise. Pick a machine, instrument or piece of furniture whose working maps one-to-one onto the feature, and say in one sentence what moves and what that motion means.

| Feature | Object |
|---|---|
| Call routing rules | A router with rule keys that light in turn and a rotary selector that swings to the chosen line |
| A multi-step process (a recipe, onboarding, a build) | The real thing being made, step by step: a pumpkin that is cut, scooped, drawn on, carved and lit |
| Ring timeout → voicemail | A handset that jiggles while a timer counts, then a tape recorder whose reels spin |
| A queue and workers | A conveyor carrying cubes to a row of stamping presses; a press lights while busy |
| Retries with backoff | A ball launcher that re-fires after longer and longer pauses, a counter on its side |
| A cache | A drawer cabinet: a hit slides one drawer open; a miss walks to the archive cylinder and files a copy |
| Webhooks / fan-out | A splitter box with one input and several outputs, a packet down each |
| Rate limiting | A turnstile with a token hopper; no token, the arm stays locked |
| Search / indexing | A card catalogue: cards drop into lettered trays |
| Sync between devices | Two terminals and a relay tower; a change on one lights the other |
| Number provisioning | A vending machine dispensing numbered tiles into a tray |
| Permissions | A key rack and locked doors; the right key turns one lock |

Two ways it fails: **too abstract** (labelled boxes, floating slabs) and **too flat** (one big slab with a few lines). The fix for both: a recognisable machine made of many small, purposeful parts. Take a reference's *finish*, never its object, and never a real product's silhouette or logo.

## 2. Truth first

Collect the real behaviour before geometry: the order of steps, the decision points, thresholds and defaults (ring timeout 20 s, 3 retries, 42 ms). Put them as named constants at the top of `draw`, compute every motion and every readout value from them, and say in the hand-over which numbers you assumed. A figure whose readout disagrees with its motion is worse than no readout.

## 3. Parts list

Write the parts before drawing, grouped:

- **Base:** plate, inset groove, corner screws, maybe a label strip.
- **Structure:** housings, plinths, posts, the mast of a tower.
- **Mechanism:** dial and pointer, keys, reels, slides, drawers, rollers, a carriage.
- **Controls & signs:** LEDs, small screens, engraved labels, vents and slits, ports where wires land.
- **Flow:** wires between real ports, packets on them, tokens (cubes) that travel.
- **The subject:** the one part that tells the story, in tone `hi`.

A Figure has 25–60 parts. Every part sits on another part; every wire ends on a port. Give the long, detailed side of each object to the FRONT or SIDE face (only those and the top are visible).

## 4. Tone hierarchy and light

- Base `lo`, structure `mid`, subject `hi`.
- Lit (`lit` → accent) only what is acting *now*. Several things lit at once read as noise; light one thing, then the next.
- Make lit unmistakable: full `lit: 1` at the peak, a halo on glass, a bloom on a ringing part. A faint glow was iso-glow's most common failure.
- Labels on a part that lights up use `role: 'engrave'`; screen text uses `lit` (it becomes the bright accent).
- Never a literal colour in a diagram. Looks own colour; diagrams own meaning.

## 5. Motion

- **Envelopes everywhere.** `k.env(t0, t1, attack, decay)` for lights, `k.ramp` with `k.easeInOut` for travel, `k.spring` for things that swing or settle. Nothing appears or vanishes in one frame. Packets fade at the ends of routes.
- **Overlap beats slightly.** Start the next thing ~100–200 ms before the last one finishes; the eye follows a hand-off.
- **Calm tempo.** 5–12 s loops; a packet takes 0.8–1.4 s along a wire; hold the result of each beat ~600 ms before moving on.
- **End where you started.** The last beat fades to the opening state so the loop seam is invisible (check the first and last frames of the GIF).
- **Idle motion is small:** a slowly turning reel, a breathing LED. Never constant flashing.

### Parts that come out of other parts

Painter's order cannot put a part *inside* a solid. For a tile leaving a slot, a drawer opening, a card ejecting: draw the moving part as a box whose depth grows from ~0.5 to full while its back face stays flush with the host's face (it extrudes out of the slot), drawn right after the host. Going *into* something, shrink it the same way, or let it pass behind the host's front and fade (`op`). Don't move a full-size box through a wall: it shows through the face.

## 6. Words

Words stay out of the drawing except short engraved labels (one or two words, ≤ 8 characters if the pixel look matters) and screen text. The card carries the language: title, one caption per beat, a terse lowercase readout from the model (`rules 2/3 passed`, `ringing sales · 12 s / 20 s`). Captions are plain sentences a reader could repeat; keep them under ~32 characters (pixel trims longer ones) and readouts under ~22.

## 7. Per-look notes

- **glow:** dark first. Hairlines carry the shape, so give faces slits, insets and screws. The light theme has no glow at all; lit parts are flat accent.
- **vector:** no outlines, so separation comes from tone (top light, front mid, side dark) and the top rim. Neighbouring parts in the same tone need a gap, a plinth or a different tone. Soft shadows ground objects; use `shadow: true` on anything standing on the plate.
- **pixel:** 2:1 projection, ~320 art pixels wide by default (`pixel-size` changes it: 1 for fine pixel art, 2–3 for chunky). Labels on faces follow the face's 2:1 slant in a 3×5 font when the whole word fits; otherwise they become greeked marks, the pixel-art way of showing small print. For readable on-object labels use `pixel-size="1"` and short words (≤ 6 characters); at chunky sizes treat labels as texture and let the captions carry the words. Thin details under ~1.5 units vanish; make vents and keys a little chunkier. Light is dithered, not blurred.
- **blueprint:** like glow without glow; good for docs. Solids are filled in the paper colour so hidden lines stay hidden.

## 8. Composition

The subject sits near the centre and the whole figure fills ~55–65% of the stage. Auto-fit covers everything drawn over the loop, so a tall mast or a far-off wire shrinks everything; trim outliers or set `bounds`. Keep one scale and one accent across a set of figures on the same page. Check it at 390 px wide.

## 9. Review checklist (read the PNGs)

Run `export.mjs … --formats png,sheet` for the target look and for `pixel`, read every image, and crop/zoom into busy areas (`python3 -c "from PIL import Image; …crop(…).resize(…)"`).

- At 1×: is it instantly a real object? Is the subject obvious? Does each beat's frame tell its caption on its own?
- Zoomed: every face has detail; no bare slab. Every wire ends on a port or behind the part it enters. No label overlaps a wire, LED or edge. Labels fit their faces (pixel too).
- Order: nothing in front is covered by something behind it, especially moving parts and packets.
- Light: exactly the acting part is lit in each beat, and it reads at thumbnail size.
- Loop: first and last frames match; nothing pops between consecutive frames.
- Light theme of the target look reads too (glow light has no glow; check lit parts are still clear).
- Readout numbers agree with what moves.
