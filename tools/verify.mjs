// npm run verify (after npm run build): every example in a real browser, in every look and theme.
// Checks the element mounts, its canvas actually paints, nothing logs an error, the step keys move it,
// and the exports produce files. CHROME_PATH points at a browser when Playwright's own isn't installed.
// SHOTS=dir saves a screenshot per example and look.
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { chromium } from 'playwright'
import { ROOT, examples } from './skill-files.mjs'

const dir = path.join(ROOT, 'dist', 'examples')
if (!fs.existsSync(dir)) { console.error('Run npm run build first.'); process.exit(1) }
const shots = process.env.SHOTS && path.resolve(process.env.SHOTS)
if (shots) fs.mkdirSync(shots, { recursive: true })

const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {})
const fails = []
const LOOKS = ['glow', 'vector', 'pixel', 'blueprint']

for (const f of examples()) {
  const id = f.replace(/\.js$/, '')
  const page = await browser.newPage({ viewport: { width: 900, height: 760 } })
  const errors = []
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('pageerror', e => errors.push(e.message))
  // A bare page with the built script and one element, the way a user embeds it.
  const html = path.join(dir, `${id}.verify.html`)
  fs.writeFileSync(html, `<!doctype html><meta charset="utf-8"><body style="margin:0;width:800px">
<script src="${id}.isogram.js"></script><iso-gram id="d" name="${id}" paused></iso-gram>`)
  await page.goto(pathToFileURL(html).href)
  const ok = await page.waitForFunction(() => document.querySelector('#d')?._def, null, { timeout: 8000 }).then(() => true, () => false)
  if (!ok) { fails.push(`${id}: the element never mounted`); await page.close(); continue }

  const painted = () => page.evaluate(() => {
    const cv = document.querySelector('#d').shadowRoot.querySelector('canvas'), x = cv.getContext('2d')
    const d = x.getImageData(0, 0, cv.width, cv.height).data, seen = new Set()
    for (let i = 0; i < d.length; i += 4 * 97) seen.add(d[i] << 16 | d[i + 1] << 8 | d[i + 2])
    return seen.size
  })
  for (const look of LOOKS) for (const theme of ['light', 'dark']) {
    await page.evaluate(([l, t]) => { const e = document.querySelector('#d'); e.setAttribute('look', l); e.setAttribute('theme', t) }, [look, theme])
    await page.waitForTimeout(150)
    const n = await painted()
    if (n < 4) fails.push(`${id}/${look}/${theme}: canvas is blank (${n} colours)`)
    if (shots) await page.locator('#d').screenshot({ path: path.join(shots, `${id}-${look}-${theme}.png`) })
  }
  // Arrow keys step through the beats (on the focusable stage inside the shadow root).
  const before = await page.evaluate(() => document.querySelector('#d')._t)
  await page.evaluate(() => document.querySelector('#d').shadowRoot.querySelector('.stage').focus()); await page.keyboard.press('ArrowRight'); await page.waitForTimeout(100)
  if (await page.evaluate(() => document.querySelector('#d')._t) === before) fails.push(`${id}: ArrowRight did not step`)

  // The transport (controls attribute): scrubbing sets the time, frame steps move by 1/30 s, and stills
  // save the frame on screen.
  const tr = await page.evaluate(() => {
    const e = document.querySelector('#d'); e.setAttribute('controls', '')
    const bar = e.shadowRoot.querySelector('.transport'), r = e.shadowRoot.querySelector('.transport input')
    r.value = String(Math.round(e.duration * 0.37)); r.dispatchEvent(new Event('input'))
    const t1 = e.currentTime, paused = e.paused
    e.shadowRoot.querySelector('.fwd').click()
    const t2 = e.currentTime, same = e.toSVG({ width: 300 }) === e.toSVG({ width: 300, t: t2 }), shown = getComputedStyle(bar).display !== 'none'
    e.removeAttribute('controls')
    return { shown, t1, want: Math.round(e.duration * 0.37), paused, step: t2 - t1, same }
  })
  if (!tr.shown) fails.push(`${id}: controls attribute shows no transport`)
  if (tr.t1 !== tr.want || !tr.paused) fails.push(`${id}: scrubbing did not pause at the scrubbed time (${tr.t1} vs ${tr.want})`)
  if (Math.abs(tr.step - 1000 / 30) > 0.5) fails.push(`${id}: frame step moved ${tr.step} ms`)
  if (!tr.same) fails.push(`${id}: SVG export is not the frame on screen`)

  const sizes = await page.evaluate(async () => {
    const e = document.querySelector('#d')
    e.setAttribute('look', 'vector')
    const png = await e.toPNG({ width: 400 }), svg = e.toSVG({ width: 400 })
    e.setAttribute('look', 'pixel')
    const ppng = await e.toPNG({ width: 400 })
    return { png: png.size, svg: svg.length, ppng: ppng.size }
  })
  if (!(sizes.png > 3000)) fails.push(`${id}: vector PNG export is ${sizes.png} bytes`)
  if (!(sizes.ppng > 1500)) fails.push(`${id}: pixel PNG export is ${sizes.ppng} bytes`)
  if (!(sizes.svg > 2000)) fails.push(`${id}: SVG export is ${sizes.svg} chars`)
  if (errors.length) fails.push(`${id}: console errors: ${errors.join(' | ')}`)
  console.log(`  ${fails.some(x => x.startsWith(id + ':') || x.startsWith(id + '/')) ? 'FAIL' : 'ok  '} ${id}: ${LOOKS.length * 2} looks/themes paint, steps, exports PNG ${sizes.png} B, SVG ${sizes.svg} chars`)
  await page.close()
  fs.rmSync(html)
}

// One GIF, the slowest export, on the smallest example.
{
  const page = await browser.newPage()
  await page.goto(pathToFileURL(path.join(dir, 'starter.html')).href)
  await page.waitForFunction(() => document.querySelector('iso-gram')?._def, null, { timeout: 8000 })
  const gif = await page.evaluate(async () => { const b = await document.querySelector('iso-gram').toGIF({ width: 240, fps: 8 }); return [b.size, b.type] })
  if (!(gif[0] > 5000) || gif[1] !== 'image/gif') fails.push(`starter: GIF export is ${gif[0]} bytes, ${gif[1]}`)
  else console.log(`  ok   starter: GIF export ${(gif[0] / 1024).toFixed(0)} KB`)
  await page.close()
}

// The site (npm run site), served with vercel.json's headers so the CSP is enforced as in production.
if (fs.existsSync(path.join(ROOT, 'dist', 'site', 'index.html'))) {
  const { spawn } = await import('node:child_process')
  const server = spawn(process.execPath, [path.join(ROOT, 'tools/serve.mjs')], { env: { ...process.env, PORT: '4181' }, stdio: 'pipe' })
  await new Promise(r => server.stdout.once('data', r))
  const base = 'http://localhost:4181'
  for (const [theme, width] of [['light', 1280], ['dark', 390]]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, colorScheme: theme })
    const errors = []
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
    page.on('pageerror', e => errors.push(e.message))
    await page.addInitScript(() => document.addEventListener('securitypolicyviolation', e => console.error(`CSP blocked ${e.blockedURI} (${e.violatedDirective})`)))
    await page.goto(base + '/')
    await page.waitForFunction(() => [...document.querySelectorAll('iso-gram')].every(e => e._def), null, { timeout: 8000 }).catch(() => fails.push(`site/${theme}: diagrams never mounted`))
    const painted = sel => page.evaluate(s => {
      const cv = document.querySelector(s).shadowRoot.querySelector('canvas'), x = cv.getContext('2d')
      const d = x.getImageData(0, 0, cv.width, cv.height).data, seen = new Set()
      for (let i = 0; i < d.length; i += 4 * 97) seen.add(d[i] << 16 | d[i + 1] << 8 | d[i + 2])
      return seen.size
    }, sel)
    if ((await painted('#hero')) < 8) fails.push(`site/${theme}: hero diagram is blank`)
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) fails.push(`site/${theme}@${width}: page scrolls sideways`)
    await page.click('#hero-looks label:has(input[value="pixel"])')
    if (await page.getAttribute('#hero', 'look') !== 'pixel') fails.push(`site/${theme}: hero look switch does nothing`)
    await page.click('label:has(input[name="pg-name"][value="robot"])'); await page.waitForTimeout(200)
    if (await page.evaluate(() => document.querySelector('#pg')._def.id) !== 'robot') fails.push(`site/${theme}: playground diagram switch does nothing`)
    if (!/name="robot"/.test(await page.textContent('#embed'))) fails.push(`site/${theme}: embed code does not follow the playground`)
    await page.click('label:has(input[name="pg-theme"][value="light"])')
    if (await page.getAttribute('#pg', 'theme') !== 'light' || !/theme="light"/.test(await page.textContent('#embed'))) fails.push(`site/${theme}: playground theme switch does nothing`)
    if (!(await page.evaluate(() => getComputedStyle(document.querySelector('#pg').shadowRoot.querySelector('.transport')).display !== 'none'))) fails.push(`site/${theme}: playground has no transport controls`)
    if (await page.evaluate(() => getComputedStyle(document.querySelector('.top')).position) !== 'sticky') fails.push(`site/${theme}: header is not sticky`)
    if (!(await page.isDisabled('#pg-pixel'))) fails.push(`site/${theme}: pixel size is enabled outside the pixel look`)
    await page.click('label:has(input[name="pg-look"][value="pixel"])')
    if (await page.isDisabled('#pg-pixel')) fails.push(`site/${theme}: pixel size stays disabled in the pixel look`)
    await page.click('#tab-code')
    if (await page.isHidden('#panel-code')) fails.push(`site/${theme}: install tabs do not switch`)
    const png = await page.evaluate(async () => (await document.querySelector('#pg').toPNG({ width: 400 })).size)
    if (!(png > 3000)) fails.push(`site/${theme}: playground PNG export is ${png} bytes`)
    for (const d of ['/docs/', '/docs/api/', '/docs/craft/']) {
      const r = await page.goto(base + d)
      if (!r.ok()) fails.push(`site: ${d} answered ${r.status()}`)
      if (!(await page.textContent('main')).trim()) fails.push(`site: ${d} is empty`)
    }
    const skill = await page.request.get(base + '/isogram.skill')
    if (!skill.ok() || (await skill.body()).length < 20000) fails.push('site: isogram.skill missing')
    if (errors.length) fails.push(`site/${theme}: console errors: ${errors.join(' | ')}`)
    if (shots) await page.goto(base + '/').then(() => page.waitForTimeout(600)).then(() => page.screenshot({ path: path.join(shots, `site-${theme}.png`), fullPage: true }))
    console.log(`  ${errors.length ? 'FAIL' : 'ok  '} site (${theme}, ${width}px): diagrams paint, controls work, docs and download served, no CSP errors`)
    await page.close()
  }
  server.kill()
} else console.log('  (dist/site not built; skipping the site. Run npm run site first.)')

await browser.close()
if (fails.length) { console.error('\n' + fails.map(f => '  ✗ ' + f).join('\n')); process.exit(1) }
console.log('\n  All checks passed.')
