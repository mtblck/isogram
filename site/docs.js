// Docs pages: the theme toggle, and old guide anchors. The guide (SKILL.md) moved from /docs/ to
// /docs/skill/, so a link like /docs/#workflow whose anchor isn't on this page goes on to the guide.
;(function () {
  var h = location.hash.slice(1)
  if (location.pathname === '/docs/' && h && !document.getElementById(decodeURIComponent(h))) location.replace('/docs/skill/#' + h)
  var root = document.documentElement, btn = document.getElementById('theme')
  var paint = function () { var next = root.dataset.theme === 'dark' ? 'light' : 'dark'; btn.setAttribute('aria-label', 'Switch to the ' + next + ' theme') }
  btn.addEventListener('click', function () {
    var next = root.dataset.theme === 'dark' ? 'light' : 'dark'; root.dataset.theme = next
    try { localStorage.setItem('isogram-theme', next) } catch (e) { /* private mode */ }
    paint()
  })
  paint()
})()
