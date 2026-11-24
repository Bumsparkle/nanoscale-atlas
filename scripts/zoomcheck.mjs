// Walk the whole zoom ladder, sand to atoms, by scrolling in; print layer and scale readout at each stop.
import { chromium } from '@playwright/test'
const base = process.argv[2] ?? 'http://localhost:5182'
const b = await chromium.launch({ args: ['--enable-unsafe-webgpu', '--enable-features=Vulkan,WebGPU', '--use-angle=metal', '--ignore-gpu-blocklist'] })
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
p.on('pageerror', (e) => errors.push(String(e)))
await p.goto(base + '/growth/sand'); await p.waitForTimeout(4000)
const seen = []
for (let i = 0; i < 160 && seen.length < 12; i++) {
  const layer = await p.evaluate(() => window.__app.layer)
  if (seen[seen.length - 1]?.layer !== layer) {
    await p.waitForTimeout(1800)
    const field = await p.locator('.scalebar-meta span').first().textContent()
    const bar = await p.locator('.scalebar-label').textContent()
    seen.push({ layer, field, bar, path: new URL(p.url()).pathname })
  }
  await p.mouse.move(720, 450)
  await p.mouse.wheel(0, -600)
  await p.waitForTimeout(220)
}
console.table(seen)
console.log(errors.length ? 'ERRORS ' + errors.join('\n') : 'no page errors')
await b.close()
