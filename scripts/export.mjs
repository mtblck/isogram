#!/usr/bin/env node
// Headless export of a built isogram page (NAME.html from build.py) to image files.
//   node export.mjs NAME.html [--looks glow,vector,pixel,blueprint] [--formats png,gif,svg,sheet,webm,mp4] [--width 800]
//        [--theme light|dark] [--accent #hex] [--background #hex] [--no-frame] [--no-labels] [--no-progress] [--transparent] [--pixel-size 1|2|3] [--t ms] [--fps N] [--out DIR]
// Video (webm, mp4): every frame is rendered at its exact time, 30 fps unless --fps says otherwise, and encoded by
// ffmpeg if it is installed (VP9 / H.264 at constant quality: the smallest files at near-lossless quality for flat
// art). Without ffmpeg, webm is recorded in the browser at the same frame rate (larger files) and mp4 is skipped.
// GIF defaults to 20 fps (GIF timing is in 1/100 s, so 30 can't be exact).
// Needs Playwright + a Chromium that is ALREADY installed. It never downloads a browser; if none is
// found it says so and exits 2: then use the Export buttons in NAME.html instead.
import fs from 'node:fs'; import path from 'node:path'; import { pathToFileURL } from 'node:url'; import { createRequire } from 'node:module'; import { spawn, spawnSync } from 'node:child_process';

const args = process.argv.slice(2), opt = k => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : undefined; };
const page0 = args.find(a => a.endsWith('.html'));
if (!page0) { console.error('usage: node export.mjs NAME.html [--looks ...] [--formats png,gif,svg,sheet]'); process.exit(1); }
const looks = (opt('looks') || '').split(',').filter(Boolean), formats = (opt('formats') || 'png,gif,sheet').split(',');
const width = +(opt('width') || 800), fps = +(opt('fps') || 20), vfps = +(opt('fps') || 30), out = opt('out') || path.dirname(path.resolve(page0));
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
const kill = setTimeout(() => { console.error('timed out'); process.exit(3); }, 600000);
const hasFfmpeg = spawnSync('ffmpeg', ['-version']).status === 0;
// ffmpeg settings: constant quality; flat isometric art compresses very well at these
const ENC = {
  webm: ['-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '36', '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2', '-pix_fmt', 'yuv420p', '-an'],
  mp4: ['-c:v', 'libx264', '-crf', '22', '-preset', 'slow', '-tune', 'animation', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an'],
};
try {
  const page = await browser.newPage({ viewport: { width: 1100, height: 900 } });
  page.on('pageerror', e => console.error('page error:', e.message));
  page.on('console', m => { if (m.type() === 'error') console.error('console:', m.text()); });
  await page.goto(pathToFileURL(path.resolve(page0)).href);
  await page.waitForFunction(() => window.ISOGRAM && document.querySelector('iso-gram') && document.querySelector('iso-gram')._def, null, { timeout: 15000 });
  const all = looks.length ? looks : await page.evaluate(() => Object.keys(ISOGRAM.LOOKS));
  const o = { width, gifWidth: opt('width') ? Math.min(width, 960) : 640, fps, frame: !args.includes('--no-frame'), labels: !args.includes('--no-labels'), pixelSize: +(opt('pixel-size') || 0), progress: !args.includes('--no-progress'), transparent: args.includes('--transparent'), theme: opt('theme'), accent: opt('accent'), background: opt('background'), t: opt('t') != null ? +opt('t') : undefined };
  for (const look of all) for (const f of formats) {
    if (f === 'webm' || f === 'mp4') {
      fs.mkdirSync(out, { recursive: true }); const file = path.join(out, `${base}-${look}${o.theme ? '-' + o.theme : ''}.${f}`);
      const x = Object.assign({}, o, { look });
      if (hasFfmpeg) {
        // frames straight into ffmpeg; width and height rounded to even numbers for yuv420p
        const n = await page.evaluate(({ vfps }) => Math.max(1, Math.round(document.querySelector('iso-gram').duration / 1000 * vfps)), { vfps });
        const ff = spawn('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', String(vfps), '-i', '-', '-vf', 'pad=ceil(iw/2)*2:ceil(ih/2)*2', ...ENC[f], file], { stdio: ['pipe', 'inherit', 'inherit'] });
        const done = new Promise((res, rej) => ff.on('close', c => c === 0 ? res() : rej(new Error('ffmpeg exited ' + c))));
        for (let i = 0; i < n; i++) {
          const png = await page.evaluate(({ x, i, n }) => { const el = document.querySelector('iso-gram');
            return el.toCanvas(Object.assign({}, x, { t: i * el.duration / n })).toDataURL('image/png').split(',')[1]; }, { x, i, n });
          if (!ff.stdin.write(Buffer.from(png, 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
        }
        ff.stdin.end(); await done;
      } else if (f === 'webm') {
        const data = await page.evaluate(async ({ x, vfps }) => { const b = await document.querySelector('iso-gram').toVideo(Object.assign({}, x, { fps: vfps, type: 'webm' }));
          const buf = new Uint8Array(await b.arrayBuffer()); let s = ''; for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000)); return btoa(s); }, { x, vfps });
        fs.writeFileSync(file, Buffer.from(data, 'base64'));
      } else { console.error('mp4 needs ffmpeg; skipped (webm works without it)'); continue; }
      console.log('wrote', file, Math.round(fs.statSync(file).size / 1024) + ' KB', `(${vfps} fps${hasFfmpeg ? ', ffmpeg' : ', browser recording'})`);
      continue;
    }
    const r = await page.evaluate(async ({ look, f, o }) => {
      const el = document.querySelector('iso-gram'), x = Object.assign({}, o, { look });
      if (x.t == null) x.t = 'still';   // stills: --t, else the diagram's chosen frame (not whatever is on screen)
      const b64 = async blob => { const buf = new Uint8Array(await blob.arrayBuffer()); let s = ''; for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000)); return btoa(s); };
      if (f === 'png') return { ext: 'png', data: await b64(await el.toPNG(x)) };
      if (f === 'gif') return { ext: 'gif', data: await b64(await el.toGIF(Object.assign(x, { width: o.gifWidth }))) };
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
