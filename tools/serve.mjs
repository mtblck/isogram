// npm run preview: serves dist/site on :4180 with vercel.json's headers (the CSP included), so the
// browser check sees what production would block.
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { ROOT } from './skill-files.mjs'

const dir = path.join(ROOT, 'dist', 'site'), port = +(process.env.PORT || 4180)
const conf = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'))
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain', '.skill': 'application/octet-stream' }
const match = (src, p) => new RegExp('^' + src.replace(/\(\.\*\)/g, '(.*)') + '$').test(p)

http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  if (!p.endsWith('/') && !path.extname(p)) { res.writeHead(308, { Location: p + '/' }); return res.end() }   // trailingSlash
  let f = path.join(dir, p.endsWith('/') ? p + 'index.html' : p)
  if (!f.startsWith(dir) || !fs.existsSync(f)) { res.writeHead(404); return res.end('Not found') }
  const h = { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }
  for (const rule of conf.headers) if (match(rule.source, p)) for (const { key, value } of rule.headers) h[key] = value
  res.writeHead(200, h); fs.createReadStream(f).pipe(res)
}).listen(port, () => console.log(`dist/site on http://localhost:${port}/`))
