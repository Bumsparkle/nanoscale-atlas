// Build step (runs before `vite build`): make the slide images available to the build
// without them ever being in the repository.
//   1. If private/slides/ already exists (local machine), use it.
//   2. Else, if SLIDES_ARCHIVE_URL is set, download the .tar.gz made by render-slides.mjs from
//      private storage (Vercel Blob, a private bucket, a GitHub release asset…), optionally with
//      SLIDES_TOKEN as a bearer token, and unpack it into private/slides/.
//   3. Else, build without slides: the Source modal then says the image is unavailable.
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const dir = join('private', 'slides')
const count = () => (existsSync(dir) ? readdirSync(dir).flatMap((t) => (existsSync(join(dir, t)) ? readdirSync(join(dir, t)) : [])).length : 0)
if (count() > 0) {
  console.log(`slides: using ${count()} local images in ${dir}`)
  process.exit(0)
}
const url = process.env.SLIDES_ARCHIVE_URL
if (!url) {
  console.warn('slides: SLIDES_ARCHIVE_URL not set; building without lecture slides')
  process.exit(0)
}
const headers = { Accept: 'application/octet-stream' }
if (process.env.SLIDES_TOKEN) headers.Authorization = `Bearer ${process.env.SLIDES_TOKEN}`
const res = await fetch(url, { headers, redirect: 'follow' })
if (!res.ok) {
  console.error(`slides: download failed (${res.status}); building without lecture slides`)
  process.exit(0)
}
mkdirSync(dir, { recursive: true })
const tgz = join('private', 'slides.tar.gz')
writeFileSync(tgz, Buffer.from(await res.arrayBuffer()))
// refuse archives with paths outside <topic>/slide-NN.jpg
// (archives made on a Mac may also carry AppleDouble "._name" metadata entries: Linux tar
// lists them as files, so they are allowed in the check and left out on extraction)
const APPLEDOUBLE = /^(?:[a-z0-9]+\/)?\._[a-z0-9.-]+$/
const entries = execFileSync('tar', ['-tzf', tgz]).toString().trim().split('\n')
const bad = entries.filter((e) => !/^[a-z0-9]+\/?$|^[a-z0-9]+\/slide-\d{2}\.jpg$/.test(e) && !APPLEDOUBLE.test(e))
if (bad.length) {
  console.error('slides: archive contains unexpected paths, refusing it:', bad.slice(0, 5))
  process.exit(1)
}
execFileSync('tar', ['-xzf', tgz, '--exclude=._*', '-C', dir])
console.log(`slides: fetched ${count()} images`)
