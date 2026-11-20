// Scripted 60 s tour, recorded as video (docs/recordings/<name>.webm) with
// still frames saved along the way so the run can be reviewed without a player.
// usage: node scripts/tour.mjs [baseUrl] [name]
import { chromium } from '@playwright/test'
import { mkdirSync, renameSync } from 'node:fs'

const base = process.argv[2] ?? 'http://localhost:5173'
const name = process.argv[3] ?? 'tour'
mkdirSync('docs/recordings', { recursive: true })
mkdirSync(`shots/${name}`, { recursive: true })
const browser = await chromium.launch({ args: ['--enable-unsafe-webgpu', '--enable-features=Vulkan,WebGPU', '--use-angle=metal', '--ignore-gpu-blocklist'] })
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, recordVideo: { dir: 'docs/recordings/tmp', size: { width: 1280, height: 800 } } })
const page = await ctx.newPage()
let n = 0
const frame = async (label) => page.screenshot({ path: `shots/${name}/${String(n++).padStart(2, '0')}-${label}.png` })
const wait = (ms) => page.waitForTimeout(ms)
const steps = (await import(`./tours/${name}.mjs`)).default
await steps({ page, base, frame, wait })
const video = page.video()
await ctx.close()
await browser.close()
if (video) renameSync(await video.path(), `docs/recordings/${name}.webm`)
console.log('done', n, 'frames')
