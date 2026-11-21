// Render the lecture PDF to slide images for the Source modal.
// Local only: reads docs/topic2-cmos.pdf (gitignored) and writes private/slides/topic2/slide-NN.jpg
// (gitignored), plus private/slides-topic2.tar.gz to upload to private storage for deployments.
// usage: node scripts/render-slides.mjs [pdf] [topic]
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, renameSync, rmSync } from 'node:fs'
import { join } from 'node:path'

const pdf = process.argv[2] ?? 'docs/topic2-cmos.pdf'
const topic = process.argv[3] ?? 'topic2'
if (!existsSync(pdf)) {
  console.error(`No PDF at ${pdf}. The lecture slides are not in the repository; put your own copy there.`)
  process.exit(1)
}
const out = join('private', 'slides', topic)
rmSync(out, { recursive: true, force: true })
mkdirSync(out, { recursive: true })
// 1600 px wide JPEG: sharp on a laptop screen, ~150 KB a slide
execFileSync('pdftoppm', ['-jpeg', '-jpegopt', 'quality=84', '-scale-to-x', '1600', '-scale-to-y', '-1', pdf, join(out, 'p')], { stdio: 'inherit' })
for (const f of readdirSync(out)) {
  const m = f.match(/^p-(\d+)\.jpg$/)
  if (m) renameSync(join(out, f), join(out, `slide-${String(+m[1]).padStart(2, '0')}.jpg`))
}
const n = readdirSync(out).filter((f) => f.startsWith('slide-')).length
// no macOS extended attributes: Linux tar on the build machine would warn about every file
execFileSync('tar', ['--no-xattrs', '-czf', join('private', `slides-${topic}.tar.gz`), '-C', join('private', 'slides'), topic], { env: { ...process.env, COPYFILE_DISABLE: '1' } })
console.log(`${n} slides → ${out}\narchive → private/slides-${topic}.tar.gz (upload this to private storage; never commit it)`)
