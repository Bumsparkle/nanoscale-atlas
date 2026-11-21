// Walk the whole lesson in the real UI: every chunk must show its question with Next locked,
// and Next must unlock after the worked solution. Saves a contact sheet of every chunk.
import { chromium } from '@playwright/test'
import { mkdirSync } from 'node:fs'
const base = process.argv[2] ?? 'http://localhost:5173'
mkdirSync('shots/lesson', { recursive: true })
const b = await chromium.launch({ args: ['--enable-unsafe-webgpu', '--enable-features=Vulkan,WebGPU', '--use-angle=metal', '--ignore-gpu-blocklist'] })
const p = await b.newPage({ viewport: { width: 1280, height: 800 } })
const errors = []
p.on('pageerror', (e) => errors.push(String(e)))
await p.goto(base + '/cmos/inverter?mode=lesson&chunk=intro')
await p.evaluate(() => localStorage.clear())
await p.reload()
await p.waitForTimeout(4000)
const problems = []
for (let i = 0; ; i++) {
  const card = p.locator('[data-testid=question]')
  await card.waitFor({ timeout: 15000 })
  await p.waitForTimeout(900)
  const qid = await card.getAttribute('data-qid')
  const title = await p.locator('.lp-title').innerText()
  const next = p.locator('.lp-next')
  if (!(await next.isDisabled())) problems.push(`${i + 1} ${title}: next unlocked before answering`)
  await p.screenshot({ path: `shots/lesson/${String(i + 1).padStart(2, '0')}.png` })
  await card.getByRole('button', { name: /worked solution/ }).click()
  await p.waitForTimeout(250)
  const label = (await next.innerText()).trim()
  if (label.includes('complete')) { console.log(`${i + 1} ${qid} · ${title} · end`); break }
  if (await next.isDisabled()) { problems.push(`${i + 1} ${title}: next still locked after solution`); break }
  console.log(`${i + 1} ${qid} · ${title}`)
  await next.click()
  await p.waitForTimeout(400)
}
const stored = await p.evaluate(() => JSON.parse(localStorage.getItem('atlas.lesson.v1') || '{}').done?.length)
console.log('chunks completed in localStorage:', stored)
console.log(problems.length ? 'PROBLEMS\n' + problems.join('\n') : 'no problems')
if (errors.length) console.log('ERRORS\n' + [...new Set(errors)].join('\n'))
await b.close()
