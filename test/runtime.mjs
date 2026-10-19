// Loads the browser runtime and the examples into a Node vm with the few browser globals it touches at load.
// Scenes (draw functions, fitting, the SVG writer) are pure, so they run here without a DOM; anything that
// paints to a canvas is left to the real-browser check (npm run verify).
import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { ROOT, examples } from '../tools/skill-files.mjs'

export function loadRuntime() {
  const window = {}
  const ctx = vm.createContext({
    window, console, Math, Date, Map, Set, Promise, Object, Array, Number, String, JSON, Symbol, Error,
    HTMLElement: class {}, customElements: { get: () => undefined, define: () => {} },
    matchMedia: () => ({ matches: false, addEventListener() {} }),
    requestAnimationFrame: () => 0, cancelAnimationFrame: () => {}, setTimeout, clearTimeout,
  })
  ctx.self = ctx.globalThis = window
  Object.assign(window, ctx)
  const runIn = file => vm.runInContext(fs.readFileSync(path.join(ROOT, file), 'utf8'), ctx, { filename: file })
  runIn('assets/isogram.js')
  ctx.ISOGRAM = window.ISOGRAM
  examples().forEach(f => runIn(`examples/${f}`))
  return window.ISOGRAM
}
