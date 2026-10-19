# Security

## Reporting a vulnerability

Please report privately, not in a public issue: the repo's *Security* tab →
*Report a vulnerability*. Include what you found, how to reproduce it, and what
it lets someone do. I aim to reply within a week; fixes go out on `main`.

## What's in scope

isogram is a skill (instructions for Claude) plus a browser runtime that people
embed in their own pages. Worth reporting:

- **The embedded runtime.** `assets/isogram.js` runs on other people's sites. A
  way for attribute values or a diagram's captions and labels to inject markup or
  script into the host page is a vulnerability.
- **The build and export scripts.** `scripts/build.py` and `scripts/export.mjs`
  run on the user's machine. Path traversal or command injection through their
  arguments or a diagram file is in scope.
- **The skill text.** Instructions in `SKILL.md` or `references/` that would lead
  Claude to do something unsafe on a user's machine.
