// What ships in isogram.skill. Everything else in the repo (package.json, tools/, test/, .github/, .claude/)
// is tooling for maintaining the skill and stays out of the package.
import fs from 'node:fs'
import path from 'node:path'

export const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')
export const SHIPPED = ['SKILL.md', 'README.md', 'LICENSE', 'assets', 'references', 'scripts', 'examples']

export function skillFiles() {
  const out = []
  const walk = rel => {
    const abs = path.join(ROOT, rel)
    if (fs.statSync(abs).isDirectory()) fs.readdirSync(abs).sort().forEach(n => { if (n !== '__pycache__' && !n.startsWith('.')) walk(path.join(rel, n)) })
    else out.push(rel)
  }
  SHIPPED.forEach(walk)
  return out
}

export const examples = () => fs.readdirSync(path.join(ROOT, 'examples')).filter(f => f.endsWith('.js')).sort()
