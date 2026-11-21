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

// do: switch the lattice to amorphous
await open('/cmos/inverter?mode=lesson&chunk=structures')
await shot('01-do-open')
await p.getByRole('button', { name: 'amorphous' }).click(); await wait(900)
await shot('02-do-solved')

// predict: commit, then the reveal plays
await open('/cmos/inverter?mode=lesson&chunk=dopants')
await card().getByRole('button', { name: /spare electron/ }).click(); await wait(500)
await shot('03-predict-revealing')
await wait(1600)
await shot('04-predict-right')

// calc: wrong first (hint), then right
await open('/cmos/inverter?mode=lesson&chunk=lattice')
await card().locator('input').fill('3'); await card().getByRole('button', { name: 'Check' }).click(); await wait(500)
await shot('05-calc-wrong-hint')
await card().locator('input').fill('4'); await card().getByRole('button', { name: 'Check' }).click(); await wait(500)
await shot('06-calc-right')

// label: click the wrong region, then the right one, in the slide 27 section
await open('/cmos/inverter?mode=lesson&chunk=cross-section', 6000)
await shot('07-label-open')
await clickObject('nmos-source'); await wait(700)
await shot('08-label-wrong-hint')
await wait(600)
await clickObject('nwell'); await wait(700)
await shot('09-label-right')

// recall: wrong option, then the worked solution
await open('/cmos/inverter?mode=lesson&chunk=intro')
await card().getByRole('button', { name: /single transistor/ }).click(); await wait(400)
await shot('10-recall-wrong')
await card().getByRole('button', { name: /worked solution/ }).click(); await wait(400)
await shot('11-recall-solution')

// do on the layout: break a rule, live check
await open('/cmos/inverter?mode=lesson&chunk=rules-gate', 6000)
const a = await p.evaluate(() => window.__layoutPoint(11, 6)); const c = await p.evaluate(() => window.__layoutPoint(10, 6))
await p.mouse.move(a[0], a[1]); await p.mouse.down(); await p.mouse.move(c[0], c[1], { steps: 4 }); await p.mouse.up(); await wait(600)
await shot('12-do-layout-solved')

// seed some progress so coverage, drill and mastery have something to show
await p.evaluate(async () => {
  const mod = await import('/src/learn/bank.ts')
  const now = Date.now(), cards = {}
  mod.QUESTIONS.forEach((q, i) => {
    if (q.slide <= 23) cards[q.id] = { box: 4 + (i % 2), due: now + 7 * 864e5, seen: 3, right: 3 }
    else if (q.slide <= 33) cards[q.id] = { box: 1 + (i % 3), due: now, seen: 2, right: 1 }
    else if (q.slide >= 46 && q.slide <= 47) cards[q.id] = { box: 1, due: now, seen: 1, right: 0 }
    if (q.factIds.some((f) => f.startsWith('s26-'))) cards[q.id] = { box: 1, due: now, seen: 2, right: 0 }
  })
  localStorage.setItem('atlas.leitner.v1', JSON.stringify(cards))
})
await open('/cmos/inverter?mode=revise&rv=coverage', 4000)
await shot('13-coverage')
await p.locator('.cov-tile').filter({ hasText: 'Oxidation' }).click(); await wait(2500)
await shot('14-drill-slide30')

await open('/cmos/inverter?mode=revise&rv=exam', 3000)
await p.getByRole('button', { name: /start the 20-minute paper/ }).click(); await wait(600)
await shot('15-exam-sitting')
const inputs = p.locator('.exam-q input')
for (let i = 0; i < (await inputs.count()); i++) await inputs.nth(i).fill(i % 2 ? '0.3' : '2')
const qs = p.locator('.exam-q')
for (let i = 0; i < (await qs.count()); i++) { const o = qs.nth(i).locator('.qopt'); if (await o.count()) await o.nth(1).click() }
await p.getByRole('button', { name: /hand in/ }).click(); await wait(600)
await shot('16-exam-marked')

await open('/cmos/inverter', 4000)
await p.getByRole('button', { name: 'mastery' }).click(); await wait(1500)
await shot('17-mastery')
const weak = await p.evaluate(async () => {
  const m = await import('/src/learn/progress.ts')
  return ['substrate-tap', 'well-tap', 'nmos-source', 'pmos-source', 'poly-gate', 'contact', 'metal-y', 'metal-vdd', 'metal-gnd'].find((id) => m.objectMastery(id)?.level === 'weak') ?? null
})
console.log('weak object clicked:', weak)
await clickObject(weak ?? 'metal-gnd'); await wait(3500)
await shot('18-mastery-click-weak')
if (errors.length) console.log('ERRORS\n' + errors.join('\n'))
await b.close()
console.log('done')
