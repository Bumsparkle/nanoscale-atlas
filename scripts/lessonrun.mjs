// Walk the whole lesson in the real UI: every step teaches, then its checks take over the panel
// with Next locked; each check is cleared via "stuck? get a hint" → "show the worked solution"
// (predict: commit an answer); every section review ends in its summary. Saves a shot per position.
import { chromium } from '@playwright/test'
import { mkdirSync } from 'node:fs'
const base = process.argv[2] ?? 'http://localhost:5173'
mkdirSync('shots/lesson', { recursive: true })
const b = await chromium.launch({ args: ['--enable-unsafe-webgpu', '--enable-features=Vulkan,WebGPU', '--use-angle=metal', '--ignore-gpu-blocklist'] })
const p = await b.newPage({ viewport: { width: 1280, height: 800 } })
const errors = []
p.on('pageerror', (e) => errors.push(String(e)))
await p.goto(base + '/cmos/inverter?mode=lesson')
await p.evaluate(() => localStorage.clear())
await p.goto(base + '/cmos/inverter?mode=lesson')
await p.waitForTimeout(4000)
const problems = []
const next = p.locator('.lp-foot .lp-next')
const clear = async () => {
  const card = p.locator('[data-testid=question]')
  await card.waitFor({ timeout: 15000 })
  await p.waitForFunction(() => !document.querySelector('.qcard-setup'), null, { timeout: 15000 })
  const type = await card.getAttribute('data-qtype')
  if (type === 'predict') {
    await card.locator('.qopt').first().click()
    await p.locator('[data-testid=solution]').waitFor({ timeout: 5000 })
  } else {
    await card.getByRole('button', { name: /get a hint/ }).click()
    await card.getByRole('button', { name: /worked solution/ }).click()
  }
  return card.getAttribute('data-qid')
}
let n = 0, steps = 0, reviews = 0, checks = 0
for (;;) {
  n++
  const tag = String(n).padStart(3, '0')
  if (await p.locator('[data-testid=lesson-step]').count()) {
    steps++
    const title = await p.locator('.lp-title').innerText()
    if (!(await next.isDisabled())) problems.push(`${tag} ${title}: next unlocked before the check`)
    await p.locator('[data-testid=start-check]:not([disabled])').waitFor({ timeout: 15000 })
    await p.screenshot({ path: `shots/lesson/${tag}-teach.png` })
    await p.locator('[data-testid=start-check]').click()
    if (await p.locator('.lp-narration').count()) problems.push(`${tag} ${title}: text not collapsed during the check`)
    for (;;) {
      await clear(); checks++
      const more = p.getByRole('button', { name: 'next question →' })
      if (await more.count()) { await more.click(); continue }
      break
    }
    console.log(`${tag} step  · ${title}`)
  } else {
    reviews++
    for (;;) {
      await clear()
      const c = p.locator('[data-testid=continue]')
      const label = await c.innerText()
      await c.click(); await p.waitForTimeout(300)
      if (label.includes('finish')) break
    }
    await p.locator('[data-testid=section-summary]').waitFor()
    await p.screenshot({ path: `shots/lesson/${tag}-summary.png` })
    console.log(`${tag} review · ${await p.locator('.lp-title').innerText()}`)
  }
  if ((await next.innerText()).includes('complete')) break
  if (await next.isDisabled()) { problems.push(`${tag}: next still locked after answering`); break }
  await next.click()
  await p.waitForTimeout(500)
}
const stored = await p.evaluate(() => JSON.parse(localStorage.getItem('atlas.lesson.v2') || '{}').done?.length)
console.log(`steps ${steps}, checks ${checks}, reviews ${reviews}; positions done in localStorage: ${stored}`)
console.log(problems.length ? 'PROBLEMS\n' + problems.join('\n') : 'no problems')
if (errors.length) console.log('ERRORS\n' + [...new Set(errors)].join('\n'))
await b.close()
