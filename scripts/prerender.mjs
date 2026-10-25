// Writes dist/list/index.html: the list mode rendered at build time, shipped as plain HTML.
// No React on this page, only a few lines for the copy button: it paints and is usable at once.
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const root = process.cwd()
const { render } = await import(pathToFileURL(path.join(root, 'dist-ssr/entry-list-ssr.js')).href)
const template = fs.readFileSync(path.join(root, 'dist/index.html'), 'utf8')
const enhance = `<script>
document.querySelectorAll('[data-copy]').forEach(function (b) {
  b.addEventListener('click', function () {
    var done = function () { b.textContent = 'Copied'; setTimeout(function () { b.textContent = 'Copy' }, 2200) }
    if (navigator.clipboard) navigator.clipboard.writeText(b.getAttribute('data-copy')).then(done, done); else done()
  })
})
</script>`
const html = template
  .replace(/<script type="module"[^>]*><\/script>\s*/g, '')
  .replace(/<link rel="modulepreload"[^>]*>\s*/g, '')
  .replace(/<div id="root"><!--shell-->[\s\S]*?<!--\/shell--><\/div>/, `<div id="root">${render()}</div>${enhance}`)
  .replace(/<title>.*?<\/title>/, '<title>Allonzo Pensabene · Building Automation &amp; Energy Engineer · Projects</title>')
fs.mkdirSync(path.join(root, 'dist/list'), { recursive: true })
fs.writeFileSync(path.join(root, 'dist/list/index.html'), html)
fs.rmSync(path.join(root, 'dist-ssr'), { recursive: true, force: true })
console.log('prerendered dist/list/index.html', Math.round(html.length / 1024), 'KB')
