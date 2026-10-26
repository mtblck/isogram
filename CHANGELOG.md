# Changelog

What changed for people using Isogram, newest first. Each merged PR with a
user-visible change gets a line under **Unreleased** (the `changelog.yml`
workflow adds it, unless the PR wrote its own); the `release` skill
(`maintenance` plugin) moves them under a version or date when it ships.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## Unreleased

### Added

- getisogram.com/docs opens on "Using isogram", a page for people: install, asking for a good diagram, embedding and every `<iso-gram>` attribute. The skill's own files move under it, starting at /docs/skill/; old guide links such as /docs/#workflow follow it there.
- `--isogram-label-size` CSS property to size the card's captions and labels from the host page.

### Changed

- getisogram.com playground: settings sit in Scene, Style and Show tabs beside the preview, never taller than it, with the tag and downloads always at the bottom; on phones the preview stays pinned while the settings scroll. Pixel size shows only for the Pixel look.
- getisogram.com: the hero diagram sits on the site's navy in both themes, and the gallery shows two diagrams light and two dark.
- CLAUDE.md: review a PR in the session before marking it ready (#37)

### Fixed

- getisogram.com: control outlines now meet 3:1 contrast, larger step captions, the diagram shows on a phone's first screen, Install stays in the mobile nav, an icon theme toggle, and gallery captions name their look.

### Security
