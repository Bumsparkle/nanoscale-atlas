// The replay speed in a real browser: it changes the fab animation and nothing else.
//   fab playback follows the speed; device physics, logic transitions and the lattice stay at 1×;
//   the controls appear only in the Fab view; keys [ ] space; the setting is remembered.
import { chromium } from '@playwright/test'
const base = process.argv[2] ?? 'http://localhost:5173'
const b = await chromium.launch({ args: ['--enable-unsafe-webgpu', '--enable-features=Vulkan,WebGPU', '--use-angle=metal', '--ignore-gpu-blocklist'] })
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage()
const out = []
const ok = (name, cond, detail) => out.push(`${cond ? 'PASS' : 'FAIL'} ${name}${detail ? ' · ' + detail : ''}`)
const st = (k) => p.evaluate((k) => window.__atlas[k], k)
const set = (patch) => p.evaluate((x) => window.__atlas_set(x), patch)
const wait = (ms) => p.waitForTimeout(ms)

// device physics clock: always 1×
const clockRate = async () => {
  const a = await p.evaluate(() => [window.__contentTime(), performance.now()])
  await wait(1500)
  const c = await p.evaluate(() => [window.__contentTime(), performance.now()])
  return (c[0] - a[0]) / ((c[1] - a[1]) / 1000)
}
await p.goto(base + '/cmos/inverter/nmos?vg=1.00'); await wait(4000)
await set({ speed: 0.25 }); const r = await clockRate()
ok('device physics stays at 1× when the fab speed is 0.25×', Math.abs(r - 1) < 0.05, `clock rate ${r.toFixed(2)}`)
ok('no replay controls outside the Fab view', (await p.locator('.speedbar').count()) === 0)

// fab playback follows the speed
const fabStep = async (speed) => {
  await p.goto(base + '/cmos/inverter?view=fab&step=3'); await wait(4000)
  await set({ speed })
  await p.getByTestId('play').click()
  const t0 = Date.now()
  await p.waitForFunction(() => window.__atlas.step >= 4, null, { timeout: 20000 })
  const dt = (Date.now() - t0) / 1000
  await p.getByTestId('play').click()
  return dt
}
const f1 = await fabStep(1), f05 = await fabStep(0.5)
ok('fab step at 0.5× takes about twice as long', f05 / f1 > 1.6 && f05 / f1 < 2.4, `1×=${f1.toFixed(2)} s, 0.5×=${f05.toFixed(2)} s`)
ok('replay controls shown in the Fab view', (await p.locator('.speedbar').count()) === 1)

// logic transition: same at any fab speed
const swing = async (speed) => {
  await p.goto(base + '/cmos/inverter?view=logic&a=0'); await wait(3500)
  await set({ speed })
  return p.evaluate(async () => {
    const blade = () => +document.querySelector('.sw line:nth-of-type(3)').getAttribute('x2')
    const start = blade()
    document.querySelector('.bit').click()
    await new Promise((r) => setTimeout(r, 300))
    const mid = blade()
    await new Promise((r) => setTimeout(r, 1500))
    return Math.abs(mid - start) / Math.max(1e-6, Math.abs(blade() - start))
  })
}
const s1 = await swing(1), s025 = await swing(0.25)
ok('logic transitions ignore the fab speed', Math.abs(s1 - s025) < 0.15, `fraction swung after 0.3 s: ${s1.toFixed(2)} vs ${s025.toFixed(2)}`)

// keys in the Fab view, and persistence
await p.goto(base + '/cmos/inverter?view=fab&step=3'); await wait(3500)
await set({ speed: 1 })
await p.mouse.click(700, 400); await p.keyboard.press(']')
const k1 = await st('speed')
await p.keyboard.press('['); await p.keyboard.press('[')
const k2 = await st('speed')
await p.evaluate(() => document.activeElement?.blur?.())
await p.keyboard.press(' ')
const k3 = await st('playing')
await p.keyboard.press(' ')
ok('[ ] step the speed, space plays the replay', k1 === 2 && k2 === 0.5 && k3 === true, `] → ${k1}, [[ → ${k2}, space → playing=${k3}`)
await p.reload(); await wait(3000)
ok('speed is remembered across reloads', (await st('speed')) === 0.5)
await p.screenshot({ path: 'shots/theme/fab-replay-controls.png' })
console.log(out.join('\n'))
await b.close()
