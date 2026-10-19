// npm run build: every example through scripts/build.py (as a user of the skill would run it) into
// dist/examples/, then dist/isogram.skill, a zip of the shipped files under an isogram/ folder.
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { ROOT, skillFiles, examples } from './skill-files.mjs'

const dist = path.join(ROOT, 'dist')
fs.rmSync(dist, { recursive: true, force: true })
fs.mkdirSync(path.join(dist, 'examples'), { recursive: true })

const run = (cmd, args, input) => {
  const r = spawnSync(cmd, args, { cwd: ROOT, encoding: 'utf8', input })
  if (r.status !== 0) { console.error(`${cmd} ${args.join(' ')} failed:\n${r.stdout}${r.stderr}`); process.exit(1) }
  return r.stdout
}

for (const f of examples()) {
  run('python3', ['scripts/build.py', `examples/${f}`, '--out', 'dist/examples'])
  console.log(`built examples/${f}`)
}

// One zip, written by Python's zipfile (Python is already a requirement of the skill's build script).
const files = skillFiles()
run('python3', ['-c', `
import sys, zipfile
root, out = sys.argv[1], sys.argv[2]
with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
    for rel in sys.stdin.read().split('\\n'):
        if rel: z.write(f"{root}/{rel}", f"isogram/{rel}")
`, ROOT, path.join(dist, 'isogram.skill')], files.join('\n'))
console.log(`packed dist/isogram.skill (${files.length} files, ${(fs.statSync(path.join(dist, 'isogram.skill')).size / 1024).toFixed(0)} KB)`)
