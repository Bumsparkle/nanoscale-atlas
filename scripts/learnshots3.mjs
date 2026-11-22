// Lesson and Revise screenshots for Chapters 2 and 3 → shots/learn3/*.png
// usage: node scripts/learnshots3.mjs [baseUrl]
import { chromium } from '@playwright/test'
import { mkdirSync } from 'node:fs'
const base = process.argv[2] ?? 'http://localhost:5182'
mkdirSync('shots/learn3', { recursive: true })
const b = await chromium.launch({ args: ['--enable-unsafe-webgpu', '--enable-features=Vulkan,WebGPU', '--use-angle=metal', '--ignore-gpu-blocklist'] })
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
p.on('pageerror', (e) => errors.push(String(e)))
const shot = (n) => p.screenshot({ path: `shots/learn3/${n}.png` })
const wait = (ms) => p.waitForTimeout(ms)
const open = async (q, ms = 5500) => { await p.goto(base + q); await wait(ms) }
const card = () => p.locator('[data-testid=question]')
const startCheck = async () => { await p.locator('[data-testid=start-check]:not([disabled])').waitFor({ timeout: 20000 }); await p.locator('[data-testid=start-check]').click(); await wait(1800) }

// Chapter 2: teaching step with a demo, then a "do" check solved on the model
await open('/growth/czochralski?mode=lesson&at=g-seg-k0')
await shot('01-c2-step-teach')
await startCheck()
await shot('02-c2-do-open')
await p.evaluate(() => window.__atlasSet({ growth: { k0: 0.8, frac: 0.3, dopant: 'B', passes: 1 } })); await wait(1200)
await shot('03-c2-do-solved')

// a parameterised calculation, answered wrong then opened
await open('/growth/czochralski?mode=lesson&at=g-seg-scheil')
await startCheck()
await shot('04-c2-calc-gen')
await card().locator('input').fill('1'); await card().getByRole('button', { name: 'Check' }).click(); await wait(500)
await card().locator('input').fill('2'); await card().getByRole('button', { name: 'Check' }).click(); await wait(800)
await shot('05-c2-calc-worked-solution')

// predict on the band chart
await open('/cmos/inverter/nmos/gate-oxide/lattice?mode=lesson&at=g-bands-split')
await startCheck()
await card().locator('.qopt').nth(1).click(); await wait(2200)
await shot('06-c2-predict-revealed')

// related link to Chapter 1, and the section menu with the chapter switcher
await open('/cmos/inverter/nmos/gate-oxide/lattice?mode=lesson&at=g-diamond')
await p.locator('.lp-menu-btn').click(); await wait(400)
await shot('07-c2-menu-chapters')

// Chapter 3: label check on the wet bench, and the yield calc
await open('/clean/cleanroom?mode=lesson&at=k-dirt')
await startCheck()
await shot('08-c3-label-open')
await open('/cmos/wafer?mode=lesson&at=k-y-nb')
await startCheck()
await shot('09-c3-calc-nb')
await open('/clean/cleanroom?mode=lesson&at=review:k-rca', 6000)
await shot('10-c3-review')

// Revise: topic filter, coverage with skill map, exam paper for Topic 3
await open('/growth/sand?mode=revise')
await p.getByRole('button', { name: 'T3 · growth' }).click(); await wait(800)
await shot('11-revise-topic3')
await p.getByRole('tab', { name: 'Coverage' }).click(); await wait(800)
await shot('12-coverage-skillmap')
await p.getByRole('button', { name: 'Topic 4' }).click(); await wait(500)
await shot('13-coverage-topic4')
await p.keyboard.press('Escape'); await wait(300)
await p.getByRole('tab', { name: 'Exam paper' }).click(); await wait(800)
await shot('14-exam-topic3')

console.log(errors.length ? 'ERRORS:\n' + [...new Set(errors)].join('\n') : 'no page errors')
await b.close()
