# Using isogram

isogram is a skill for Claude. You describe a feature, Claude builds a small isometric machine that shows how it works, and you get one script and one tag to put on your page. This page is for you; the other docs pages are the files Claude itself reads.

## Install

1. [Download isogram.skill](/isogram.skill).
2. **Claude.ai or the desktop app:** add it in Claude's settings, where your other skills are, by uploading the file. **Claude Code:** unzip it into `~/.claude/skills/` and start a new session.
3. Ask for one: "Make an isogram of how our search indexing works."

The skill is instructions plus two small scripts with no dependencies. Nothing runs when you install it.

## Ask for a good diagram

Claude does the drawing; your words decide what it explains. Good requests name:

- **The feature and its real numbers.** "Webhook retries: 3 attempts, backing off 1 s, 10 s, 60 s, then the dead-letter queue."
- **The steps you want shown.** Each one becomes a caption.
- **The look and where it goes.** "Vector look, for the docs" or "pixel look, for a launch tweet".

You don't need to pick the machine. Claude chooses an object whose working is the feature, like a tape deck for voicemail or a drawer cabinet for a cache. Ask for changes the way you would with a designer: "slow the second step down", "make the queue longer".

## Put it on a page

Claude hands you a file named after the diagram, such as `webhooks.isogram.js`. Add it once and place the tag wherever the diagram goes:

```html
<script src="webhooks.isogram.js"></script>
<iso-gram name="webhooks" look="vector" theme="auto"></iso-gram>
```

It works in plain HTML, React, Vue, Astro or any docs site; in React, load the script once and render `<iso-gram name="webhooks" />`. The element fills its container's width, keeps the diagram's shape, pauses when it is offscreen and shows a still frame to visitors who prefer reduced motion. Try every option in the [playground](/#playground) and copy the tag it writes.

## Attributes

| Attribute | Values | What it does |
| --- | --- | --- |
| `name` | the diagram's name | Which diagram to show. Required. |
| `look` | `glow`, `vector`, `pixel`, `blueprint` | How the scene is drawn. Every diagram works in every look. |
| `theme` | `auto`, `light`, `dark`, `default` | `auto` follows each visitor's system setting; `default` uses the look's own. |
| `accent` | a hex colour | The one colour for whatever is active right now. |
| `background` | a hex colour | The card behind the drawing. Pair a dark colour with `theme="dark"`. |
| `frame` | `none` | Drop the card and show only the drawing. |
| `labels` | `none` | Hide the corner texts (figure number, title, caption, readout). |
| `progress` | `none` | Hide the step bars. |
| `transparent` | present or absent | No panel; the drawing sits on your page's background. |
| `pixel-size` | `1`, `2`, `3` | Pixel look only: screen pixels per art pixel. |
| `speed` | a number, default `1` | Play faster or slower. |
| `paused` | present or absent | Start paused. |
| `fig` | a number | The "Fig N" in the corner. |
| `controls` | present or absent | A play button, frame steps and a scrubber under the diagram. |

To match your site's type, set `--isogram-sans`, `--isogram-mono` or `--isogram-pixel` to your font, and `--isogram-label-size` to size the captions. Every method and export option is in the [API reference](/docs/api/).

## Keyboard and screen readers

Click or tab to a diagram, then:

- <kbd>Space</kbd> pauses and plays.
- <kbd>←</kbd> and <kbd>→</kbd> step through the beats.
- <kbd>,</kbd> and <kbd>.</kbd> step one frame at a time.

Each diagram has a label, and its step captions are in a list that screen readers announce.

## Images and video instead

Where a script can't go, use a file. The playground's export buttons, or Claude's export script, make:

- **WebM and MP4** at 30 fps, the best choice for a looping hero video (a few hundred KB).
- **GIF** for email and tools that only take images. It is 10 to 20 times larger than video.
- **PNG and SVG** stills of the frame on screen: pause, then step with <kbd>,</kbd> and <kbd>.</kbd> to pick it. SVG works for every look except pixel.
