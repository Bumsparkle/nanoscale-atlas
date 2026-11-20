// Screenshot harness: node scripts/shots.mjs [baseUrl] [nameFilter] [--webgl]
// Renders each route headless, waits for the scene to settle, writes shots/<name>.png
import { chromium } from '@playwright/test'
import { mkdirSync } from 'node:fs'

const base = process.argv[2] && !process.argv[2].startsWith('-') ? process.argv[2] : 'http://localhost:5173'
const filter = process.argv[3] && !process.argv[3].startsWith('-') ? new RegExp(process.argv[3]) : null
const forceGL = process.argv.includes('--webgl')
const mobile = process.argv.includes('--mobile')
const routes = (await import('./routes.mjs')).default

mkdirSync('shots', { recursive: true })
const browser = await chromium.launch({
  headless: true,
  args: ['--enable-unsafe-webgpu', '--enable-features=Vulkan,WebGPU', '--use-angle=metal', '--ignore-gpu-blocklist'],
})
const ctx = await browser.newContext({
  viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 },
  deviceScaleFactor: mobile ? 2 : 1,
  reducedMotion: 'no-preference',
  hasTouch: mobile,
})
const page = await ctx.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
for (const r of routes) {
  if (filter && !filter.test(r.name)) continue
  const sep = r.path.includes('?') ? '&' : '?'
  const url = base + r.path + sep + 'shots=1' + (forceGL ? '&gl=webgl' : '')
  await page.goto(url, { waitUntil: 'load' })
  await page.waitForTimeout(r.wait ?? 2500)
  if (r.action) await r.action(page)
  const backend = await page.evaluate(() => window.__atlas?.renderer?.backend ?? 'n/a')
  const file = `shots/${mobile ? 'm-' : ''}${r.name}.png`
  await page.screenshot({ path: file })
  console.log(file, backend)
}
if (errors.length) console.log('ERRORS:\n' + [...new Set(errors)].join('\n'))
await browser.close()
