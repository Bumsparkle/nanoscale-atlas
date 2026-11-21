// Learning-mode screenshots: every question type answered for real (right and wrong),
// the coverage screen, the exam paper and the mastery overlay. → shots/learn/*.png
import { chromium } from '@playwright/test'
import { mkdirSync } from 'node:fs'
const base = process.argv[2] ?? 'http://localhost:5173'
mkdirSync('shots/learn', { recursive: true })
const b = await chromium.launch({ args: ['--enable-unsafe-webgpu', '--enable-features=Vulkan,WebGPU', '--use-angle=metal', '--ignore-gpu-blocklist'] })
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
p.on('pageerror', (e) => errors.push(String(e)))
const shot = (n) => p.screenshot({ path: `shots/learn/${n}.png` })
const wait = (ms) => p.waitForTimeout(ms)
const open = async (q, ms = 4500) => { await p.goto(base + q); await wait(ms) }
const card = () => p.locator('[data-testid=question]')
const clickObject = async (id) => {
  const pt = await p.evaluate((i) => window.__objectPoint?.(i), id)
  if (!pt) throw new Error('no point for ' + id)
  await p.mouse.click(pt[0], pt[1])
}

const panel = () => p.locator('.learn-panel')
const startCheck = async () => { await p.locator('[data-testid=start-check]:not([disabled])').waitFor({ timeout: 15000 }); await p.locator('[data-testid=start-check]').click(); await wait(1500) }

// a section opens with its intro, then the first step teaches and drives the model
await open('/cmos/inverter?mode=lesson&at=silicon-chips')
await shot('01-section-intro')
// a step with a worked example
await open('/cmos/inverter?mode=lesson&at=lambda-f', 6000)
await shot('02-step-worked-example')
// the check takes over: text folded into a bar
await startCheck()
await shot('03-check-collapsed')
// calc: wrong → hint, one more try
await card().locator('input').fill('0.35'); await card().getByRole('button', { name: 'Check' }).click(); await wait(500)
await shot('04-calc-wrong-hint')
// peek re-opens the text (a peeked answer won't count as mastered)
await p.locator('[data-testid=peek]').click(); await wait(300)
await shot('05-peek-open')
await p.locator('[data-testid=peek]').click()
await card().locator('input').fill('0.175'); await card().getByRole('button', { name: 'Check' }).click(); await wait(500)
await shot('06-calc-right-second-try')
// second question of the step: a do on the real layout
await p.getByRole('button', { name: 'next question →' }).click(); await wait(2500)
await shot('07-do-layout-open')

// label: a wrong click outlines a hint on the model, the right one solves it
await open('/cmos/inverter?mode=lesson&at=cross-section-bodies', 6000)
await startCheck(); await wait(1500)
await clickObject('nmos-source'); await wait(800)
await shot('08-label-wrong-hint')
await wait(600)
await clickObject('nwell'); await wait(800)
await shot('09-label-right')

// predict: commit, then the reveal plays
await open('/cmos/inverter?mode=lesson&at=lithography-resist', 6000)
await startCheck()
await card().locator('.qopt').first().click(); await wait(500)
await shot('10-predict-revealing')
await wait(1600)
await shot('11-predict-right')

// recall: two wrong answers → the worked solution opens
await open('/cmos/inverter?mode=lesson&at=diffusion-poly', 6000)
await startCheck()
await card().locator('.qopt').nth(0).click(); await wait(400)
await shot('12-recall-wrong-option-disabled')
await card().locator('.qopt').nth(2).click(); await wait(500)
await shot('13-recall-solution-after-two-tries')

// the Source modal
await panel().getByRole('button', { name: /source/i }).first().click(); await wait(900)
await shot('14-source-modal')
await p.keyboard.press('Escape')

// a section review mixing sections, then the summary
await open('/cmos/inverter?mode=lesson&at=review:gate', 4000)
await shot('15-review-question')
for (let i = 0; i < 4; i++) {
  const c = card(); await c.waitFor()
  await p.waitForFunction(() => !document.querySelector('.qcard-setup'))
  if ((await c.getAttribute('data-qtype')) === 'predict') { await c.locator('.qopt').nth(0).click(); await wait(1700) }
  else { await c.getByRole('button', { name: /get a hint/ }).click(); await c.getByRole('button', { name: /worked solution/ }).click() }
  const go = p.locator('[data-testid=continue]'); const label = await go.innerText(); await go.click(); await wait(500)
  if (label.includes('finish')) break
}
await shot('16-section-summary')

// seed some progress so coverage, drill and mastery have something to show
await p.evaluate(async () => {
  const mod = await import('/src/learn/bank.ts')
  const now = Date.now(), cards = {}
  mod.QUESTIONS.forEach((q, i) => {
    if (q.source.slide <= 23) cards[q.id] = { box: 4 + (i % 2), due: now + 7 * 864e5, seen: 3, right: 3 }
    else if (q.source.slide <= 33) cards[q.id] = { box: 1 + (i % 3), due: now, seen: 2, right: 1 }
    else if (q.source.slide >= 46 && q.source.slide <= 47) cards[q.id] = { box: 1, due: now, seen: 1, right: 0 }
    if (q.factIds.some((f) => f.startsWith('s26-'))) cards[q.id] = { box: 1, due: now, seen: 2, right: 0 }
  })
  localStorage.setItem('atlas.leitner.v1', JSON.stringify(cards))
})
await open('/cmos/inverter?mode=revise&rv=coverage', 4000)
await shot('17-coverage')
await p.locator('.cov-tile').filter({ hasText: 'Oxidation' }).click(); await wait(2500)
await shot('18-drill-slide30')

await open('/cmos/inverter?mode=revise&rv=exam', 3000)
await p.getByRole('button', { name: /start the 20-minute paper/ }).click(); await wait(600)
await shot('19-exam-sitting')
const inputs = p.locator('.exam-q input')
for (let i = 0; i < (await inputs.count()); i++) await inputs.nth(i).fill(i % 2 ? '0.3' : '2')
const qs = p.locator('.exam-q')
for (let i = 0; i < (await qs.count()); i++) { const o = qs.nth(i).locator('.qopt'); if (await o.count()) await o.nth(1).click() }
await p.getByRole('button', { name: /hand in/ }).click(); await wait(600)
await shot('20-exam-marked')

await open('/cmos/inverter', 4000)
await p.getByRole('button', { name: 'mastery' }).click(); await wait(1500)
await shot('21-mastery')
const weak = await p.evaluate(async () => {
  const m = await import('/src/learn/progress.ts')
  return ['substrate-tap', 'well-tap', 'nmos-source', 'pmos-source', 'poly-gate', 'contact', 'metal-y', 'metal-vdd', 'metal-gnd'].find((id) => m.objectMastery(id)?.level === 'weak') ?? null
})
console.log('weak object clicked:', weak)
await clickObject(weak ?? 'metal-gnd'); await wait(3500)
await shot('22-mastery-click-weak')
if (errors.length) console.log('ERRORS\n' + errors.join('\n'))
await b.close()
console.log('done')
