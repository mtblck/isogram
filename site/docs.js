// Docs pages: just the theme toggle.
;(function () {
  var root = document.documentElement, btn = document.getElementById('theme')
  var paint = function () { var next = root.dataset.theme === 'dark' ? 'light' : 'dark'; btn.textContent = next === 'dark' ? 'Dark' : 'Light'; btn.setAttribute('aria-label', 'Switch to the ' + next + ' theme') }
  btn.addEventListener('click', function () {
    var next = root.dataset.theme === 'dark' ? 'light' : 'dark'; root.dataset.theme = next
    try { localStorage.setItem('isogram-theme', next) } catch (e) { /* private mode */ }
    paint()
  })
  paint()
})()
