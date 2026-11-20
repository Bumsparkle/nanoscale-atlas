// Measures frame rate in headless Chromium while dragging the section plane
// (worst case: geometry rebuilt every frame). usage: node scripts/fps.mjs [base]
import { chromium } from '@playwright/test'
const base = process.argv[2] ?? 'http://localhost:5173'
const b = await chromium.launch({ args: ['--enable-unsafe-webgpu', '--use-angle=metal', '--ignore-gpu-blocklist'] })
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
await p.goto(base + '/cmos/inverter?view=section&cut=-6&axis=y')
await p.waitForTimeout(4000)
const backend = await p.evaluate(() => window.__atlas.renderer.backend)
// idle
await p.evaluate(() => { window.__frames = 0; const f = () => { window.__frames++; requestAnimationFrame(f) }; requestAnimationFrame(f) })
await p.waitForTimeout(2000)
const idle = await p.evaluate(() => window.__frames / 2)
// dragging: sweep the plane back and forth across the cell
await p.mouse.move(700, 600); await p.mouse.down()
await p.evaluate(() => (window.__frames = 0))
const t0 = Date.now()
for (let i = 0; i < 120; i++) { await p.mouse.move(700, 600 - (i % 60) * 5); await p.waitForTimeout(8) }
const dragFps = await p.evaluate((ms) => window.__frames / (ms / 1000), Date.now() - t0)
await p.mouse.up()
console.log(JSON.stringify({ backend, idleFps: idle, dragFps: +dragFps.toFixed(1) }))
await b.close()
