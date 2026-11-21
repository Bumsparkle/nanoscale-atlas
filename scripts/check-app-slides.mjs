// Guard: lecture material (slide images, PDFs) must never ship in a default or release build.
//   node scripts/check-app-slides.mjs                  dist/ only (run by `npm run build:app`)
//   node scripts/check-app-slides.mjs --binary         also the local release app
//   node scripts/check-app-slides.mjs --bundle <.app>  a given app bundle (files and embedded assets)
//   node scripts/check-app-slides.mjs --dmg <.dmg>     mount a .dmg read-only and check the app inside
// INCLUDE_SLIDES=1 allows slide images (personal builds only). PDFs are never allowed.
// Exits 1 on any finding.
import { execFileSync } from 'node:child_process'
import { existsSync, lstatSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const allowSlides = process.env.INCLUDE_SLIDES === '1'
const args = process.argv.slice(2)
const arg = (k) => (args.includes(k) ? args[args.indexOf(k) + 1] : null)
const problems = []
// lstat: never follow symlinks (a .dmg carries an Applications -> /Applications link)
const walk = (d) =>
  existsSync(d)
    ? readdirSync(d).flatMap((f) => {
        const st = lstatSync(join(d, f))
        return st.isSymbolicLink() ? [] : st.isDirectory() ? walk(join(d, f)) : [join(d, f)]
      })
    : []
const SLIDE_FILE = (f) => /(^|[/\\])slides?[/\\]/i.test(f) && /\.(jpe?g|png|webp|gif)$/i.test(f)
// Tauri embeds the frontend in the executable under its asset paths, so the paths show up as plain text
const SLIDE_KEY = /slides\/topic\d+\/slide-\d+\.(?:jpe?g|png|webp)/g
const PDF_KEY = /\/[\w.-]+\.pdf\b/g

function checkTree(root, label) {
  const files = walk(root)
  const slides = files.filter(SLIDE_FILE)
  const pdfs = files.filter((f) => /\.pdf$/i.test(f))
  if (slides.length && !allowSlides) problems.push(`${label}: ${slides.length} slide images, e.g. ${slides[0]}`)
  if (pdfs.length) problems.push(`${label}: ${pdfs.length} PDFs, e.g. ${pdfs[0]}`)
  return files
}
function checkApp(app, label) {
  if (!existsSync(app)) return problems.push(`${label}: ${app} not found`)
  const files = checkTree(app, label)
  for (const f of files.filter((f) => f.includes('/Contents/MacOS/'))) {
    const text = readFileSync(f).toString('latin1')
    const slides = text.match(SLIDE_KEY) ?? []
    const pdfs = (text.match(PDF_KEY) ?? []).filter((k) => !k.startsWith('/System/'))
    if (slides.length && !allowSlides) problems.push(`${label}: ${f.split('/').pop()} embeds ${slides.length} slide images`)
    if (pdfs.length) problems.push(`${label}: ${f.split('/').pop()} embeds PDFs: ${[...new Set(pdfs)].slice(0, 3).join(', ')}`)
    console.log(`${label}: ${f.split('/').pop()}: ${slides.length} slide paths, ${pdfs.length} pdf paths embedded`)
  }
}

checkTree('dist', 'dist/')
if (args.includes('--binary')) checkApp('src-tauri/target/release/bundle/macos/Nanoscale Atlas.app', 'local app')
if (arg('--bundle')) checkApp(arg('--bundle'), 'bundle')
if (arg('--dmg')) {
  const out = execFileSync('hdiutil', ['attach', '-nobrowse', '-readonly', arg('--dmg')]).toString()
  const mount = out.trim().split('\n').pop().split('\t').pop().trim()
  try {
    const app = readdirSync(mount).find((f) => f.endsWith('.app'))
    if (!app) problems.push('dmg: no .app inside')
    else checkApp(join(mount, app), 'dmg')
    checkTree(mount, 'dmg')
  } finally {
    execFileSync('hdiutil', ['detach', mount, '-quiet'])
  }
}

if (problems.length) {
  console.error('lecture material guard FAILED:\n  ' + problems.join('\n  '))
  process.exit(1)
}
console.log(`lecture material guard: ok (${allowSlides ? 'slides allowed by INCLUDE_SLIDES=1' : 'no slides'}, no PDFs)`)
