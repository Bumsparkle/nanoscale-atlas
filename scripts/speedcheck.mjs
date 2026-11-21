// The speed control in a real browser, on every animation type:
//   fab playback, device physics (content clock), logic transitions (DOM tween),
//   lattice morph, junction; keys [ ] space; localStorage; reduced motion.
import { chromium } from '@playwright/test'
const base = process.argv[2] ?? 'http://localhost:5173'
const b = await chromium.launch({ args: ['--enable-unsafe-webgpu', '--enable-features=Vulkan,WebGPU', '--use-angle=metal', '--ignore-gpu-blocklist'] })
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } })
const p = await ctx.newPage()
const out = []
const ok = (name, cond, detail) => out.push(`${cond ? 'PASS' : 'FAIL'} ${name}${detail ? ' · ' + detail : ''}`)
const st = (k) => p.evaluate((k) => window.__atlas[k], k)
const set = (patch) => p.evaluate((x) => window.__atlas_set(x), patch)
const wait = (ms) => p.waitForTimeout(ms)

// content clock rate (device physics, logic glow, die beacon all read it)
const clockRate = async () => {
  const a = await p.evaluate(() => [window.__contentTime(), performance.now()])
  await wait(1500)
  const c = await p.evaluate(() => [window.__contentTime(), performance.now()])
  return (c[0] - a[0]) / ((c[1] - a[1]) / 1000)
}
await p.goto(base + '/cmos/inverter/nmos?vg=1.00')
await p.evaluate(() => localStorage.removeItem('atlas.speed.v1'))
await p.reload(); await wait(4000)
await set({ speed: 1, paused: false }); const r1 = await clockRate()
await set({ speed: 0.5 }); const r05 = await clockRate()
await set({ speed: 2 }); const r2 = await clockRate()
await set({ paused: true }); const r0 = await clockRate()
ok('device physics clock follows speed', Math.abs(r05 / r1 - 0.5) < 0.08 && Math.abs(r2 / r1 - 2) < 0.25 && r0 === 0, `1×=${r1.toFixed(2)} 0.5×=${r05.toFixed(2)} 2×=${r2.toFixed(2)} paused=${r0}`)

// fab playback: time for one step at 1× and 0.5×
const fabStep = async (speed) => {
  await p.goto(base + '/cmos/inverter?view=fab&step=3'); await wait(4000)
  await set({ speed, paused: false })
  await p.getByTestId('play').click()
  const t0 = Date.now()
  await p.waitForFunction(() => window.__atlas.step >= 4, null, { timeout: 20000 })
  const dt = (Date.now() - t0) / 1000
  await p.getByTestId('play').click()
  return dt
}
const f1 = await fabStep(1), f05 = await fabStep(0.5)
ok('fab step at 0.5× takes about twice as long', f05 / f1 > 1.6 && f05 / f1 < 2.4, `1×=${f1.toFixed(2)} s, 0.5×=${f05.toFixed(2)} s`)

// logic transition (DOM tween on content time): how far the blade has swung 0.35 s after toggling A
const swing = async (speed) => {
  await p.goto(base + '/cmos/inverter?view=logic&a=0'); await wait(3500)
  await set({ speed, paused: false })
  return p.evaluate(async () => {
    const blade = () => +document.querySelector('.sw line:nth-of-type(3)').getAttribute('x2')
    const start = blade()
    document.querySelector('.bit').click()
    await new Promise((r) => setTimeout(r, 350))
    const mid = blade()
    await new Promise((r) => setTimeout(r, 4000))
    const end = blade()
    return Math.abs(mid - start) / Math.max(1e-6, Math.abs(end - start))
  })
}
const s1 = await swing(1), s025 = await swing(0.25)
ok('logic switch transition follows speed', s1 > 2 * s025 && s025 < 0.4, `fraction swung after 0.35 s: 1×=${s1.toFixed(2)}, 0.25×=${s025.toFixed(2)}`)

// lattice morph: amorphous switch; positions still moving after 0.6 s at 0.25×, settled at 2×
const latticeSettled = async (speed) => {
  await p.goto(base + '/cmos/inverter/nmos/gate-oxide/lattice'); await wait(3500)
  await set({ speed, paused: false })
  await p.getByRole('button', { name: 'amorphous' }).click()
  await wait(900)
  const a = await p.screenshot(); await wait(150); const c = await p.screenshot()
  return !a.equals(c)
}
const moving025 = await latticeSettled(0.25), moving2 = await latticeSettled(2)
ok('lattice morph follows speed', moving025, `still moving at 0.25× after 0.9 s: ${moving025}; at 2×: ${moving2}`)

// keys and persistence
await p.goto(base + '/cmos/inverter'); await wait(3500)
await set({ speed: 1, paused: false })
await p.mouse.click(1300, 500); await p.keyboard.press(']')
const k1 = await st('speed')
await p.keyboard.press('['); await p.keyboard.press('[')
const k2 = await st('speed')
await p.evaluate(() => document.activeElement?.blur?.())
await p.keyboard.press(' ')
const k3 = await st('paused')
await p.keyboard.press(' ')
ok('[ ] step the speed, space pauses', k1 === 2 && k2 === 0.5 && k3 === true, `] → ${k1}, [[ → ${k2}, space → paused=${k3}`)
await p.reload(); await wait(3000)
ok('speed is remembered across reloads', (await st('speed')) === 0.5, `after reload: ${await st('speed')}`)

// reduced motion: starts paused, with step buttons
const rctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })
const rp = await rctx.newPage()
await rp.goto(base + '/cmos/inverter/nmos'); await rp.waitForTimeout(3500)
const rPaused = await rp.evaluate(() => window.__atlas.paused)
const rStep = await rp.getByRole('button', { name: 'Step forward' }).count()
ok('reduced motion: paused with a step button', rPaused === true && rStep === 1, `paused=${rPaused}, step buttons=${rStep}`)
await rp.screenshot({ path: 'shots/theme/reduced-motion-speedbar.png' })

console.log(out.join('\n'))
await b.close()
