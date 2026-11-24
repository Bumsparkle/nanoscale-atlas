// Render the lecture PDFs to slide images for the Source modal.
// Local only: reads the gitignored PDFs in docs/ and writes private/slides/<topic>/slide-NN.jpg
// (gitignored), plus an archive to upload to private storage for deployments:
//   private/slides-<topic>.tar.gz for one deck, private/slides-all.tar.gz for every deck found.
// usage: node scripts/render-slides.mjs            (every deck present in docs/)
//        node scripts/render-slides.mjs <pdf> <topic>
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, renameSync, rmSync } from 'node:fs'
import { join } from 'node:path'

const DECKS = {
  topic2: 'docs/topic2-cmos.pdf',
  topic3: 'docs/topic3-silicon-growth.pdf',
  topic4: 'docs/topic4-cleaning-cleanrooms.pdf',
  topic5: 'docs/topic5-thin-films.pdf',
  topic6: 'docs/topic6-epitaxy.pdf',
  topic7: 'docs/topic7-lithography.pdf',
  topic8: 'docs/topic8-iii-v-nanostructures.pdf',
}
const jobs = process.argv[2] ? [[process.argv[3] ?? 'topic2', process.argv[2]]] : Object.entries(DECKS).filter(([, pdf]) => existsSync(pdf))
if (!jobs.length || jobs.some(([, pdf]) => !existsSync(pdf))) {
  console.error('No lecture PDF found. The slides are not in the repository; put your own copies in docs/ (see README).')
  process.exit(1)
}
// no macOS extended attributes: Linux tar on the build machine would warn about every file
const tar = (name, topics) =>
  execFileSync('tar', ['--no-xattrs', '-czf', join('private', name), '-C', join('private', 'slides'), ...topics], { env: { ...process.env, COPYFILE_DISABLE: '1' } })

for (const [topic, pdf] of jobs) {
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
  tar(`slides-${topic}.tar.gz`, [topic])
  console.log(`${topic}: ${n} slides → ${out}`)
}
if (!process.argv[2]) {
  tar('slides-all.tar.gz', jobs.map(([t]) => t))
  console.log('archive → private/slides-all.tar.gz (upload this to private storage; never commit it)')
}
