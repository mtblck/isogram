#!/usr/bin/env node
// Headless export of a built isogram page (NAME.html from build.py) to image files.
//   node export.mjs NAME.html [--looks glow,vector,pixel,blueprint] [--formats png,gif,svg,sheet] [--width 800]
//        [--theme light|dark] [--accent #hex] [--no-frame] [--no-labels] [--no-progress] [--transparent] [--pixel-size 1|2|3] [--t ms] [--fps 20] [--out DIR]
// Needs Playwright + a Chromium that is ALREADY installed. It never downloads a browser; if none is
// found it says so and exits 2: then use the Export buttons in NAME.html instead.
import fs from 'node:fs'; import path from 'node:path'; import { pathToFileURL } from 'node:url'; import { createRequire } from 'node:module';

const args = process.argv.slice(2), opt = k => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : undefined; };
const page0 = args.find(a => a.endsWith('.html'));
if (!page0) { console.error('usage: node export.mjs NAME.html [--looks ...] [--formats png,gif,svg,sheet]'); process.exit(1); }
const looks = (opt('looks') || '').split(',').filter(Boolean), formats = (opt('formats') || 'png,gif,sheet').split(',');
const width = +(opt('width') || 800), fps = +(opt('fps') || 20), out = opt('out') || path.dirname(path.resolve(page0));
const base = path.basename(page0, '.html');

let chromium;
for (const m of ['playwright', 'playwright-core', '@playwright/test']) {
  try { chromium = (await import(m)).chromium; break; } catch {}
  try { chromium = createRequire(import.meta.url)(m).chromium; break; } catch {}
  for (const root of ['/opt/npm-tools/node_modules', path.join(process.env.HOME || '', '.npm-global/lib/node_modules'), '/usr/local/lib/node_modules', '/usr/lib/node_modules']) {
    try { chromium = (await import(pathToFileURL(path.join(root, m, 'index.mjs')).href)).chromium; break; } catch {}
  }
  if (chromium) break;
}
if (!chromium) { console.error('Playwright not found. Open ' + page0 + ' in a browser and use its Export buttons.'); process.exit(2); }
const exe = ['/opt/pw-browsers/chromium', process.env.CHROME_PATH].filter(p => p && fs.existsSync(p) && fs.statSync(p).isFile())[0];
let browser;
try { browser = await chromium.launch(exe ? { executablePath: exe, timeout: 30000 } : { timeout: 30000 }); }
catch (e) { console.error('No usable Chromium (' + e.message.split('\n')[0] + '). Use the Export buttons in ' + page0 + '.'); process.exit(2); }
const kill = setTimeout(() => { console.error('timed out'); process.exit(3); }, 240000);
try {
  const page = await browser.newPage({ viewport: { width: 1100, height: 900 } });
  page.on('pageerror', e => console.error('page error:', e.message));
  page.on('console', m => { if (m.type() === 'error') console.error('console:', m.text()); });
  await page.goto(pathToFileURL(path.resolve(page0)).href);
  await page.waitForFunction(() => window.ISOGRAM && document.querySelector('iso-gram') && document.querySelector('iso-gram')._def, null, { timeout: 15000 });
  const all = looks.length ? looks : await page.evaluate(() => Object.keys(ISOGRAM.LOOKS));
  const o = { width, fps, frame: !args.includes('--no-frame'), labels: !args.includes('--no-labels'), pixelSize: +(opt('pixel-size') || 0), progress: !args.includes('--no-progress'), transparent: args.includes('--transparent'), theme: opt('theme'), accent: opt('accent'), t: opt('t') != null ? +opt('t') : undefined };
  for (const look of all) for (const f of formats) {
    const r = await page.evaluate(async ({ look, f, o }) => {
      const el = document.querySelector('iso-gram'), x = Object.assign({}, o, { look });
      if (x.t == null) x.t = 'still';   // stills: --t, else the diagram's chosen frame (not whatever is on screen)
      const b64 = async blob => { const buf = new Uint8Array(await blob.arrayBuffer()); let s = ''; for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000)); return btoa(s); };
      if (f === 'png') return { ext: 'png', data: await b64(await el.toPNG(x)) };
      if (f === 'gif') return { ext: 'gif', data: await b64(await el.toGIF(Object.assign(x, { width: Math.min(o.width, 960) }))) };
      if (f === 'sheet') return { ext: 'steps.png', sep: '-', data: await b64(await el.toSheet(Object.assign(x, { width: 520 }))) };
      if (f === 'svg') { if (ISOGRAM.LOOKS[look].pixel) return null; return { ext: 'svg', text: el.toSVG(x) }; }
      return null;
    }, { look, f, o });
    if (!r) continue;
    fs.mkdirSync(out, { recursive: true }); const file = path.join(out, `${base}-${look}${o.theme ? '-' + o.theme : ''}${r.sep || '.'}${r.ext}`);
    fs.writeFileSync(file, r.text != null ? r.text : Buffer.from(r.data, 'base64'));
    console.log('wrote', file, Math.round(fs.statSync(file).size / 1024) + ' KB');
  }
} finally { clearTimeout(kill); await browser.close(); }
