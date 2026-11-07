---
public: false
---

# 0001: A floating tipjar button complements the footer's Ko-fi link

- **Status:** Accepted
- **Date:** 2026-11-07
- **PR:** (this PR)

## Context

The landing page's only support link was the footer's "☕ Support future projects" (Ko-fi), which most
visitors never scroll to. Matt's own `tipjar` package (npm, MIT, zero dependencies) draws a floating support
button. Options: replace the footer line with the button, add the button and keep the line, or leave it.
The site's CSP is `script-src 'self'` and the site self-hosts everything it loads.

## Decision

We add the tipjar button to the landing page and keep the footer line. Both go to https://ko-fi.com/mtblck,
and the button tucks itself away (`hideWhenVisible: 'footer'`) while the footer is on screen, so only one
shows at a time. `tools/site.mjs` copies `tipjar/dist/*.js` and `style.css` from node_modules into
`dist/site/tipjar/`, and `site/tip.js` (a module file) mounts it, so no CDN and no CSP change. It takes the
page's cobalt via `--tipjar-*` in `site.css`, so it follows `data-theme`. The docs pages don't get it: they
are for reading, and their footer has no support link to hand over to.

## Consequences

Upgrading the button is a `tipjar` version bump in package.json. Clicks are not counted: a new event name
would need adding to Boards' events list first. Revisit if the button crowds the playground on phones.
