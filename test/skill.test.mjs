import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { ROOT, skillFiles, examples } from '../tools/skill-files.mjs'
import { loadRuntime } from './runtime.mjs'

const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8')

test('SKILL.md has the frontmatter Claude needs', () => {
  const m = read('SKILL.md').match(/^---\n([\s\S]*?)\n---\n/)
  assert.ok(m, 'frontmatter block')
  const name = m[1].match(/^name: (.+)$/m)?.[1], desc = m[1].match(/^description: (.+)$/m)?.[1]
  assert.equal(name, 'isogram')
  assert.ok(desc && desc.length <= 1024, `description present and ≤ 1024 chars (is ${desc?.length})`)
})

test('every file SKILL.md points to exists', () => {
  const refs = [...read('SKILL.md').matchAll(/`((?:assets|references|scripts|examples)\/[\w./-]+)`/g)].map(m => m[1])
  assert.ok(refs.length > 5)
  for (const r of new Set(refs)) assert.ok(fs.existsSync(path.join(ROOT, r)), `${r} is missing`)
})

test('the shipped files are the skill only', () => {
  const files = skillFiles()
  assert.ok(files.includes('SKILL.md') && files.includes('assets/isogram.js'))
  for (const f of files) assert.doesNotMatch(f, /^(tools|test|node_modules|dist|\.github|\.claude)\/|^package/, f)
})

test('every script parses', () => {
  const js = ['assets/isogram.js', 'scripts/export.mjs', ...examples().map(f => `examples/${f}`)]
  for (const f of js) {
    const r = spawnSync(process.execPath, ['--check', path.join(ROOT, f)], { encoding: 'utf8' })
    assert.equal(r.status, 0, `${f}: ${r.stderr}`)
  }
  const py = spawnSync('python3', ['-m', 'py_compile', path.join(ROOT, 'scripts/build.py')], { encoding: 'utf8' })
  assert.equal(py.status, 0, py.stderr)
})

test('each example defines one diagram, named after its file', () => {
  const I = loadRuntime()
  assert.deepEqual([...I.list()].sort(), examples().map(f => f.replace(/\.js$/, '')).sort())
})

// A diagram is a pure function of time: run every example across its loop in every look and check the
// scene is well-formed. Catches throws, NaN coordinates and parts flying off (a ramp easing once sent
// the rocket thousands of units up, which shrank the whole fitted scene to a dot).
test('every example draws a sane scene across its loop in every look', () => {
  const I = loadRuntime()
  for (const id of I.list()) {
    const def = I.get(id)
    assert.ok(def.beats.length >= 1 && def.beats.every((b, i) => i === 0 || b.at > def.beats[i - 1].at), `${id}: beats in order`)
    for (const look of Object.keys(I.LOOKS)) {
      let lo = Infinity, hi = -Infinity
      for (let i = 0; i <= 60; i++) {
        const t = def.duration * i / 60
        const sc = I._internal.scene(def, t, look)
        assert.ok(sc.list.length > 0, `${id}/${look} @${t}: draws nothing`)
        for (const p of sc.list) for (const q of [...(p.pts || []), p.p, p.O].filter(Array.isArray))
          for (const v of q) {
            assert.ok(Number.isFinite(v), `${id}/${look} @${t}: non-finite coordinate in a ${p.k}`)
            lo = Math.min(lo, v); hi = Math.max(hi, v)
          }
      }
      assert.ok(hi - lo < 800, `${id}/${look}: scene spans ${Math.round(hi - lo)} units; something flew off`)
      const F = I._internal.fit(def, look)
      assert.ok(F.w > 0 && F.h > 0 && Number.isFinite(F.w), `${id}/${look}: fit`)
    }
  }
})

test('the SVG export is well-formed for the vector looks', () => {
  const I = loadRuntime()
  for (const id of I.list()) for (const look of ['glow', 'vector', 'blueprint']) for (const theme of ['light', 'dark']) {
    const def = I.get(id)
    const svg = I._internal.toSVG(def, def.still, { look, T: I.themeOf(look, theme), frame: true, labels: true, progress: true })
    assert.match(svg, /^<svg [^>]*viewBox="0 0 \d+ \d+"/, `${id}/${look}/${theme}`)
    assert.ok(svg.endsWith('</svg>') && !/NaN|undefined/.test(svg), `${id}/${look}/${theme}: NaN or undefined in the SVG`)
  }
})

test('build.py writes a page, a script and an embed for an example', () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'isogram-'))
  const r = spawnSync('python3', [path.join(ROOT, 'scripts/build.py'), path.join(ROOT, 'examples/starter.js'), '--out', out], { encoding: 'utf8' })
  assert.equal(r.status, 0, r.stderr)
  for (const f of ['starter.html', 'starter.isogram.js', 'starter.embed.html']) assert.ok(fs.statSync(path.join(out, f)).size > 1000, f)
  const js = fs.readFileSync(path.join(out, 'starter.isogram.js'), 'utf8')
  assert.ok(js.includes('window.ISOGRAM') && js.includes("id: 'starter'"), 'script bundles the runtime and the diagram')
  fs.rmSync(out, { recursive: true, force: true })
})
