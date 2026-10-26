# Changelog

What changed for people using Isogram, newest first. Each merged PR with a
user-visible change gets a line under **Unreleased** (the `changelog.yml`
workflow adds it, unless the PR wrote its own); the `release` skill
(`maintenance` plugin) moves them under a version or date when it ships.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## Unreleased

### Added

### Changed

### Fixed

### Security

## 2026-10-26

First release. Everything below is new since the project started.

### Added

- getisogram.com, the standalone site: a gallery, a playground for every option with copy-paste embed code, downloads, and the docs.
- getisogram.com/docs opens on "Using isogram", a page for people: install, asking for a good diagram, embedding and every `<iso-gram>` attribute. The skill's own files move under it, starting at /docs/skill/; old guide links such as /docs/#workflow follow it there.
- A `background` attribute on `<iso-gram>` (any hex colour, also a `define()` default and an export option) replaces the theme's card colour.
- A `controls` attribute on `<iso-gram>` adds a transport bar: play/pause, one frame back or forward, a scrubber and the time. PNG and SVG export now take the frame you pick.
- `--isogram-label-size` CSS property to size the card's captions and labels from the host page.

### Changed

- Video exports run at a steady 30 fps (`toVideo({ fps, bitrate })`) and come out much smaller, instead of following the display's refresh rate.
- The pixel look draws one art pixel per CSS pixel by default, on screen and in exports; pixel size offers 1, 2 and 3.
- getisogram.com playground: settings sit in Scene, Style and Show tabs beside the preview, never taller than it, with the tag and downloads always at the bottom; on phones the preview stays pinned while the settings scroll. Pixel size shows only for the Pixel look. Theme, accent and pixel-size controls are clearer.
- getisogram.com: the hero diagram sits on the site's navy in both themes, and the gallery shows two diagrams light and two dark.

### Fixed

- Play/pause takes every click; it sometimes dropped presses on a running diagram.
- Rocket example: the umbilical arm telescopes out of the tower and clamps to the upper stage instead of hanging in space.
- getisogram.com: control outlines now meet 3:1 contrast, larger step captions, the diagram shows on a phone's first screen, Install stays in the mobile nav, an icon theme toggle, and gallery captions name their look.
