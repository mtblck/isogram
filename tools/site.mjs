// npm run site: builds getisogram.com into dist/site with Node only (Vercel runs this).
// The landing page and its assets come from site/; the docs are the skill's own markdown (SKILL.md,
// references/*.md) rendered with marked; the runtime, the examples and isogram.skill are copied in
// fresh from the repo, so the site always shows what the skill ships.
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { marked } from 'marked'
import { ROOT, skillFiles, examples } from './skill-files.mjs'
import { zip } from './zip.mjs'

const out = path.join(ROOT, 'dist', 'site')
const src = p => path.join(ROOT, 'site', p)
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8')
const write = (p, s) => { const f = path.join(out, p); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, s) }
fs.rmSync(out, { recursive: true, force: true })

const LOGO = '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3 28 10 16 17 4 10Z" fill="var(--accent)"/><path d="M4 10 16 17V30L4 23Z" fill="var(--ink)"/><path d="M16 17 28 10V23L16 30Z" fill="var(--ink-2)"/></svg>'

// ---- landing page and static files ----
write('index.html', fs.readFileSync(src('index.html'), 'utf8').replaceAll('{{logo}}', LOGO))
for (const f of ['site.css', 'site.js', 'theme.js', 'docs.js', 'icon.svg', 'og.png']) if (fs.existsSync(src(f))) fs.copyFileSync(src(f), path.join(out, f))
write('isogram.js', read('assets/isogram.js'))
write('examples.js', examples().map(f => read(`examples/${f}`)).join('\n'))
const files = skillFiles()
fs.writeFileSync(path.join(out, 'isogram.skill'), zip(files.map(rel => ({ name: `isogram/${rel}`, data: fs.readFileSync(path.join(ROOT, rel)) }))))

// fonts, self-hosted (the CSP allows font-src 'self' only)
const req = createRequire(import.meta.url)
const font = (pkg, file, as) => fs.copyFileSync(path.join(path.dirname(req.resolve(`${pkg}/package.json`)), 'files', file), path.join(out, 'fonts', as))
fs.mkdirSync(path.join(out, 'fonts'), { recursive: true })
font('@fontsource-variable/bricolage-grotesque', 'bricolage-grotesque-latin-standard-normal.woff2', 'bricolage.woff2')
font('@fontsource-variable/jetbrains-mono', 'jetbrains-mono-latin-wght-normal.woff2', 'jetbrains-mono.woff2')

// ---- docs: one page written for people (site/docs/), then the skill's own markdown, as Claude reads it ----
const PAGES = [
  { path: '/docs/', source: 'site/docs/start.md', nav: 'Using isogram', description: 'Install the isogram skill, ask Claude for a good diagram, embed it with one tag, and every attribute it takes.' },
  { path: '/docs/skill/', source: 'SKILL.md', nav: 'Guide', forClaude: true, description: 'How isogram works: the workflow Claude follows, the scene API in short, the looks, embedding and exporting.' },
  { path: '/docs/api/', source: 'references/api.md', nav: 'API reference', forClaude: true, description: 'Every builder, plane and timeline helper in isogram, the element\'s attributes and export methods, and how to add a look.' },
  { path: '/docs/craft/', source: 'references/craft.md', nav: 'Design rules', forClaude: true, description: 'The rules isogram diagrams follow, with reasons: choosing the object, parts, tone, motion, per-look notes and the review checklist.' },
]
const GH = 'https://github.com/mtblck/isogram/blob/main/'
const linkTo = (href, from) => {
  if (/^(https?:|mailto:|#)/.test(href)) return href
  const [file, hash = ''] = href.split('#')
  const abs = path.posix.normalize(path.posix.join(path.posix.dirname(from), file))
  const page = PAGES.find(p => p.source === abs)
  return page ? page.path + (hash ? '#' + hash : '') : GH + abs + (hash ? '#' + hash : '')
}
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
const slug = s => s.toLowerCase().replace(/<[^>]+>/g, '').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '')
for (const p of PAGES) {
  const md = read(p.source).replace(/^---\n[\s\S]*?\n---\n/, '')
  const renderer = new marked.Renderer()
  renderer.link = function ({ href, title, tokens }) { return `<a href="${esc(linkTo(href, p.source))}"${title ? ` title="${esc(title)}"` : ''}>${this.parser.parseInline(tokens)}</a>` }
  renderer.heading = function ({ tokens, depth }) { const html = this.parser.parseInline(tokens); return `<h${depth} id="${slug(html)}">${html}</h${depth}>\n` }
  const html = marked.parse(md, { renderer, gfm: true })
  const title = (md.match(/^# (.+)$/m) || [, p.nav])[1]
  const nav = PAGES.map((q, i) => (q.forClaude && !PAGES[i - 1].forClaude ? '<span class="group">The skill\'s files, as Claude reads them</span>' : '') +
    `<a href="${q.path}"${q === p ? ' aria-current="page"' : ''}>${q.nav}</a>`).join('')
  const note = p.forClaude ? 'These pages are the skill\'s own files, the same ones Claude reads.' : 'This page is for people using isogram; the skill\'s own files follow it in the docs.'
  const page = fs.readFileSync(src('docs.html'), 'utf8')
    .replaceAll('{{logo}}', LOGO).replace('{{title}}', esc(title)).replace('{{description}}', esc(p.description))
    .replace('{{path}}', p.path).replace('{{nav}}', nav).replace('{{note}}', note).replace('{{source}}', p.source).replace('{{content}}', () => html)
  write(path.join(p.path, 'index.html'), page)
}

write('robots.txt', 'User-agent: *\nAllow: /\nSitemap: https://getisogram.com/sitemap.xml\n')
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${['/', ...PAGES.map(p => p.path)].map(u => `  <url><loc>https://getisogram.com${u}</loc></url>`).join('\n')}\n</urlset>\n`)
console.log(`built dist/site: ${fs.readdirSync(out).length} entries, ${PAGES.length} docs pages`)
