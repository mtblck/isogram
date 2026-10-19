// Sets the page theme before first paint (a file, not inline: the CSP is script-src 'self').
;(function () {
  var t = null
  try { t = localStorage.getItem('isogram-theme') } catch (e) { /* storage blocked */ }
  if (t !== 'light' && t !== 'dark') t = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  document.documentElement.dataset.theme = t
})()
