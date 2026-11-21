// Theme and layout review: every layer, the section, fab, logic, layout, a lesson step,
// a lesson check and Revise, at 1440×900, 1280×800 and 375×812, plus a HUD overlap check.
//   node scripts/themeshots.mjs <label> [baseUrl] [--sizes=1440,1280,375] [--only=regex]
// → shots/theme/<label>/<size>/<name>.png and an overlap report
import { chromium } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'node:fs'
const label = process.argv[2] ?? 'now'
const base = process.argv.find((a) => a.startsWith('http')) ?? 'http://localhost:5173'
const sizesArg = process.argv.find((a) => a.startsWith('--sizes='))
const only = process.argv.find((a) => a.startsWith('--only='))
const SIZES = { 1440: [1440, 900], 1280: [1280, 800], 375: [375, 812] }
const sizes = sizesArg ? sizesArg.slice(8).split(',') : ['1440', '1280', '375']
const filter = only ? new RegExp(only.slice(7)) : null
const ROUTES = [
  ['01-wafer', '/cmos/wafer'],
  ['02-die', '/cmos/die'],
  ['03-cell', '/cmos/inverter'],
  ['04-cell-focus', '/cmos/inverter?focus=nmos-source', 4000],
  ['05-section', '/cmos/inverter?view=section&cut=slide27', 4500],
  ['06-masks', '/cmos/inverter?view=masks'],
  ['07-fab', '/cmos/inverter?view=fab&step=9', 4000],
  ['08-logic', '/cmos/inverter?view=logic&a=1'],
  ['09-layout', '/cmos/inverter?view=layout'],
  ['10-nmos', '/cmos/inverter/nmos?vg=1.00', 4000],
  ['11-oxide', '/cmos/inverter/nmos/gate-oxide'],
  ['12-lattice', '/cmos/inverter/nmos/gate-oxide/lattice'],
  ['13-lesson-step', '/cmos/inverter?mode=lesson&at=cross-section-bodies', 6000],
  ['14-lesson-check', '/cmos/inverter?mode=lesson&at=cross-section-bodies', 6000, async (p) => { await p.locator('[data-testid=start-check]:not([disabled])').click(); await p.waitForTimeout(2000) }],
  ['15-revise', '/cmos/inverter?mode=revise', 4000],
  ['16-coverage', '/cmos/inverter?mode=revise&rv=coverage', 3500],
]
const b = await chromium.launch({ args: ['--enable-unsafe-webgpu', '--enable-features=Vulkan,WebGPU', '--use-angle=metal', '--ignore-gpu-blocklist'] })
const report = []
for (const sz of sizes) {
  const [w, h] = SIZES[sz]
  const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: sz === '375', isMobile: sz === '375' })
  const p = await ctx.newPage()
  const errors = []
  p.on('pageerror', (e) => errors.push(String(e)))
  const dir = `shots/theme/${label}/${sz}`
  mkdirSync(dir, { recursive: true })
  for (const [name, path, wait = 3200, act] of ROUTES) {
    if (filter && !filter.test(name)) continue
    await p.goto(base + path + (path.includes('?') ? '&' : '?') + 'shots=1')
    await p.waitForTimeout(wait)
    if (act) await act(p)
    await p.screenshot({ path: `${dir}/${name}.png` })
    // overlap check: visible fixed/absolute HUD boxes that intersect each other or leave the viewport
    const hits = await p.evaluate(() => {
      const sel = '.topbar, .modes, .topbar-tools, .outline-nav, .scenetools-sub, .seg.views, .speedbar, .scenetools-row .tool, .scenetools-hint, .timeline, .stepcard, .scalebar-row, .scalebar-ladder, .scalebar-meta, .panel, .learn-panel, .bench, .lc, .legend, .layout-panel, .mastery-legend'
      const els = [...document.querySelectorAll(sel)].filter((e) => {
        const r = e.getBoundingClientRect(); const cs = getComputedStyle(e)
        return r.width > 2 && r.height > 2 && cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity > 0.05
      })
      const name = (e) => '.' + [...e.classList].join('.')
      const out = []
      const W = innerWidth, H = innerHeight
      for (const e of els) {
        const r = e.getBoundingClientRect()
        if (r.left < -1 || r.top < -1 || r.right > W + 1 || r.bottom > H + 1) out.push(`${name(e)} off-screen [${r.left|0},${r.top|0},${r.right|0},${r.bottom|0}]`)
      }
      for (let i = 0; i < els.length; i++)
        for (let j = i + 1; j < els.length; j++) {
          const a = els[i], c = els[j]
          if (a.contains(c) || c.contains(a)) continue
          const r = a.getBoundingClientRect(), s = c.getBoundingClientRect()
          const ox = Math.min(r.right, s.right) - Math.max(r.left, s.left)
          const oy = Math.min(r.bottom, s.bottom) - Math.max(r.top, s.top)
          if (ox > 2 && oy > 2) out.push(`${name(a)} × ${name(c)} (${ox|0}×${oy|0})`)
        }
      return out
    })
    for (const hgt of hits) report.push(`${sz} ${name}: ${hgt}`)
    console.log(`${sz} ${name}${hits.length ? '  ⚠ ' + hits.length : ''}`)
  }
  if (errors.length) report.push(`${sz} ERRORS: ` + [...new Set(errors)].join(' | '))
  await ctx.close()
}
await b.close()
writeFileSync(`shots/theme/${label}/overlaps.txt`, report.join('\n') + '\n')
console.log(report.length ? 'OVERLAPS\n' + report.join('\n') : 'no overlaps')
