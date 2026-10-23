import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { ROOT } from '../tools/skill-files.mjs'

const out = path.join(ROOT, 'dist', 'site')

test('the site builds', () => {
  const r = spawnSync(process.execPath, [path.join(ROOT, 'tools/site.mjs')], { encoding: 'utf8' })
  assert.equal(r.status, 0, r.stderr)
  for (const f of ['index.html', 'docs/index.html', 'docs/skill/index.html', 'docs/api/index.html', 'docs/craft/index.html', 'isogram.js', 'examples.js', 'isogram.skill', 'fonts/bricolage.woff2', 'og.png'])
    assert.ok(fs.existsSync(path.join(out, f)), `${f} missing`)
})

// The CSP is script-src 'self': an inline script or handler would be blocked in production.
test('no inline scripts, and every local reference resolves', () => {
  const pages = ['index.html', 'docs/index.html', 'docs/skill/index.html', 'docs/api/index.html', 'docs/craft/index.html']
  for (const p of pages) {
    const html = fs.readFileSync(path.join(out, p), 'utf8')
    for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
      assert.match(m[1], /\bsrc=/, `${p}: inline <script>`)
      assert.equal(m[2].trim(), '', `${p}: script with a body`)
    }
    assert.doesNotMatch(html, /\son[a-z]+=["']/i, `${p}: inline event handler`)
    assert.doesNotMatch(html, /\{\{\w+\}\}/, `${p}: unfilled template slot`)
    for (const [, ref] of html.matchAll(/(?:src|href)="(\/[^"#?]*)/g)) {
      const f = path.join(out, ref.endsWith('/') ? ref + 'index.html' : ref)
      assert.ok(fs.existsSync(f), `${p}: ${ref} does not exist`)
    }
  }
})

test('vercel.json sets the CSP and builds the site', () => {
  const v = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'))
  assert.equal(v.buildCommand, 'npm run site')
  assert.equal(v.outputDirectory, 'dist/site')
  const all = v.headers.find(h => h.source === '/(.*)').headers
  const csp = all.find(h => h.key === 'Content-Security-Policy')?.value || ''
  assert.match(csp, /script-src 'self'(;|$)/)
  assert.match(csp, /frame-ancestors 'none'/)
})

// The people-facing docs page lists every attribute the element observes, so the table can't drift.
test('the docs attribute table covers every observed attribute', () => {
  const runtime = fs.readFileSync(path.join(ROOT, 'assets/isogram.js'), 'utf8')
  const observed = JSON.parse(runtime.match(/observedAttributes\(\) \{ return (\[[^\]]*\])/)[1].replace(/'/g, '"'))
  const table = fs.readFileSync(path.join(ROOT, 'site/docs/start.md'), 'utf8').split('## Attributes')[1].split('\n## ')[0]
  const documented = [...table.matchAll(/^\| `([a-z-]+)` \|/gm)].map(m => m[1])
  assert.deepEqual([...documented].sort(), [...observed].sort())
})
