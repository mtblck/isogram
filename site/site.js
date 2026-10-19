// getisogram.com: the theme toggle, the hero's look switch, the playground, install tabs and copy buttons.
;(function () {
  'use strict'
  var $ = function (s) { return document.querySelector(s) }
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)) }
  var root = document.documentElement
  var ACCENT = { light: '#2f45e6', dark: '#8e9bff' }
  var pageTheme = function () { return root.dataset.theme === 'dark' ? 'dark' : 'light' }

  // ---- theme ----
  var themeBtn = $('#theme')
  function paintThemeBtn() {
    var next = pageTheme() === 'dark' ? 'light' : 'dark'
    themeBtn.textContent = next === 'dark' ? 'Dark' : 'Light'
    themeBtn.setAttribute('aria-label', 'Switch to the ' + next + ' theme')
  }
  themeBtn.addEventListener('click', function () {
    var next = pageTheme() === 'dark' ? 'light' : 'dark'
    root.dataset.theme = next
    try { localStorage.setItem('isogram-theme', next) } catch (e) { /* private mode */ }
  })
  new MutationObserver(function () { paintThemeBtn(); followTheme(); if (main) apply() }).observe(root, { attributes: true, attributeFilter: ['data-theme'] })

  // The hero and the gallery keep each diagram's own theme (most were drawn for dark), so they read as
  // lit objects on the page's paper in both themes; the hero wears the page's accent.
  var hero = $('#hero')
  function followTheme() { if (hero) hero.setAttribute('accent', ACCENT.dark) }
  $$('#hero-looks input').forEach(function (r) { r.addEventListener('change', function () { hero.setAttribute('look', r.value) }) })

  // ---- playground ----
  var main = $('#pg')
  // Theme is always explicit (light or dark), starting on the one the diagram was drawn for; the accent
  // starts on the page's cobalt for that theme until the visitor picks a colour, and Reset goes back to it.
  var sysTheme = function () { return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light' }
  var drawnFor = function (name) { var d = window.ISOGRAM && ISOGRAM.get(name); return (d && d.theme) || sysTheme() }
  var st = { name: 'rocket', look: 'vector', theme: drawnFor('rocket'), frame: true, labels: true, progress: true, accent: '', background: '', pixel: '1' }
  function attrs() {
    var a = { name: st.name, look: st.look, theme: st.theme, accent: st.accent || ACCENT[st.theme] }
    if (st.background) a.background = st.background
    if (!st.frame) a.frame = 'none'
    if (!st.labels) a.labels = 'none'
    if (!st.progress) a.progress = 'none'
    if (st.look === 'pixel' && st.pixel !== '1') a['pixel-size'] = st.pixel   // 1 is the default
    return a
  }
  function apply() {
    var a = attrs()
    
    ;['name', 'look', 'theme', 'accent', 'background', 'frame', 'labels', 'progress', 'pixel-size'].forEach(function (k) {
      if (a[k] != null) main.setAttribute(k, a[k]); else main.removeAttribute(k)
    })
    $$('input[name="pg-theme"]').forEach(function (r) { r.checked = r.value === st.theme })
    $('#pg-pixel').disabled = st.look !== 'pixel'
    $('#pg-accent').value = a.accent
    $('#pg-accent-reset').disabled = !st.accent
    $('#pg-bg').value = st.background || ISOGRAM.themeOf(st.look, st.theme).panel   // the look's own card colour until one is picked
    $('#pg-bg-reset').disabled = !st.background
    var tag = '<iso-gram ' + Object.keys(a).map(function (k) { return k + '="' + a[k] + '"' }).join(' ') + '></iso-gram>'
    $('#embed').textContent = '<script src="' + st.name + '.isogram.js"></script>\n' + tag
  }
  $$('input[name="pg-name"]').forEach(function (r) { r.addEventListener('change', function () { st.name = r.value; st.theme = drawnFor(r.value); apply() }) })
  $$('input[name="pg-look"]').forEach(function (r) { r.addEventListener('change', function () { st.look = r.value; apply() }) })
  $$('input[name="pg-theme"]').forEach(function (r) { r.addEventListener('change', function () { st.theme = r.value; apply() }) })
  $('#pg-frame').addEventListener('change', function (e) { st.frame = e.target.checked; apply() })
  $('#pg-labels').addEventListener('change', function (e) { st.labels = e.target.checked; apply() })
  $('#pg-progress').addEventListener('change', function (e) { st.progress = e.target.checked; apply() })
  $('#pg-accent').addEventListener('input', function (e) { st.accent = e.target.value; apply() })
  $('#pg-accent-reset').addEventListener('click', function () { st.accent = ''; apply() })
  $('#pg-bg').addEventListener('input', function (e) { st.background = e.target.value; apply() })
  $('#pg-bg-reset').addEventListener('click', function () { st.background = ''; apply() })
  $('#pg-pixel').addEventListener('change', function (e) { st.pixel = e.target.value; apply() })

  // ---- exports (downloads; the site is never framed) ----
  var status = $('#status')
  function save(blob, file) {
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = file
    document.body.appendChild(a); a.click(); a.remove()
    setTimeout(function () { URL.revokeObjectURL(a.href) }, 4000)
  }
  $$('[data-x]').forEach(function (b) {
    b.addEventListener('click', async function () {
      var x = b.dataset.x, base = st.name + '-' + st.look, o = { width: 800 }
      if (x === 'svg' && st.look === 'pixel') { status.textContent = 'Pixel art has no SVG. Export a PNG or GIF instead.'; return }
      $$('[data-x]').forEach(function (y) { y.disabled = true })
      try {
        if (x === 'gif') { status.textContent = 'Making the GIF…'; save(await main.toGIF({ width: 640, onProgress: function (p) { status.textContent = 'Making the GIF… ' + Math.round(p * 100) + '%' } }), base + '.gif') }
        if (x === 'png') save(await main.toPNG(o), base + '.png')
        if (x === 'svg') save(new Blob([main.toSVG(o)], { type: 'image/svg+xml' }), base + '.svg')
        if (x === 'webm') { status.textContent = 'Recording one loop…'; save(await main.toWebM(o), base + '.webm') }
        status.textContent = 'Saved ' + base + '.' + x
      } catch (e) { status.textContent = 'Export failed: ' + e.message }
      finally { $$('[data-x]').forEach(function (y) { y.disabled = false }) }
    })
  })

  // ---- copy buttons ----
  async function copy(btn, text, el) {
    try { await navigator.clipboard.writeText(text); btn.textContent = 'Copied' }
    catch (e) { var r = document.createRange(); r.selectNodeContents(el); var s = getSelection(); s.removeAllRanges(); s.addRange(r); btn.textContent = 'Press Ctrl+C' }
    setTimeout(function () { btn.textContent = 'Copy' }, 1600)
  }
  $('#copy-embed').addEventListener('click', function () { copy(this, $('#embed').textContent, $('#embed')) })
  $$('[data-copy]').forEach(function (b) { b.addEventListener('click', function () { var el = document.getElementById(b.dataset.copy); copy(b, el.textContent, el) }) })

  // ---- install tabs (arrow keys move between them) ----
  var tabs = $$('[role="tab"]')
  function select(tab) {
    tabs.forEach(function (t) {
      var on = t === tab
      t.setAttribute('aria-selected', on ? 'true' : 'false'); t.tabIndex = on ? 0 : -1
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on
    })
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { select(t) })
    t.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
      if (d) { var n = tabs[(i + d + tabs.length) % tabs.length]; select(n); n.focus(); e.preventDefault() }
    })
  })

  paintThemeBtn(); followTheme(); apply()
})()
