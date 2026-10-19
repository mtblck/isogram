// npm run build: every example through scripts/build.py (as a user of the skill would run it) into
// dist/examples/, then dist/isogram.skill, a zip of the shipped files under an isogram/ folder.
// The site has its own build (tools/site.mjs) that needs only Node.
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { ROOT, skillFiles, examples } from './skill-files.mjs'
import { zip } from './zip.mjs'

const dist = path.join(ROOT, 'dist')
fs.rmSync(path.join(dist, 'examples'), { recursive: true, force: true })   // leaves dist/site (npm run site) alone
fs.mkdirSync(path.join(dist, 'examples'), { recursive: true })

const run = (cmd, args) => {
  const r = spawnSync(cmd, args, { cwd: ROOT, encoding: 'utf8' })
  if (r.status !== 0) { console.error(`${cmd} ${args.join(' ')} failed:\n${r.stdout}${r.stderr}`); process.exit(1) }
  return r.stdout
}

for (const f of examples()) {
  run('python3', ['scripts/build.py', `examples/${f}`, '--out', 'dist/examples'])
  console.log(`built examples/${f}`)
}

const files = skillFiles()
fs.writeFileSync(path.join(dist, 'isogram.skill'), zip(files.map(rel => ({ name: `isogram/${rel}`, data: fs.readFileSync(path.join(ROOT, rel)) }))))
console.log(`packed dist/isogram.skill (${files.length} files, ${(fs.statSync(path.join(dist, 'isogram.skill')).size / 1024).toFixed(0)} KB)`)
