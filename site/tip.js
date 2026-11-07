// getisogram.com: the floating "Support" button (the tipjar package, copied in by tools/site.mjs).
// It goes to the same Ko-fi page as the footer's support line and tucks itself away while the
// footer is on screen, so the two never show at once. A module from a file: the CSP is script-src 'self'.
import { mount } from '/tipjar/index.js'

mount({
  href: 'https://ko-fi.com/mtblck',
  description: 'future projects on Ko-fi',
  icon: 'coffee',
  iconStyle: 'pixel',
  hideWhenVisible: 'footer',
})
