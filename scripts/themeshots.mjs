// Theme and layout review. Screenshots every layer, every layer tab (the scene
// types: 3D scenes, plots, band diagrams), the section, masks, fab, logic,
// layout, lesson, Revise and the skill map, mastery and the slide viewer, in
// each theme and size, plus a HUD overlap check.
//   node scripts/themeshots.mjs <label> [baseUrl] [--sizes=1440,375] [--themes=dark,light] [--only=regex]
// → shots/theme/<label>/<theme>/<size>/<name>.png and shots/theme/<label>/overlaps.txt
// Pair the themes for review with: node scripts/montage.mjs out.png shots/theme/<label>/dark/1440 shots/theme/<label>/light/1440
import { chromium } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'node:fs'
const label = process.argv[2] ?? 'now'
const base = process.argv.find((a) => a.startsWith('http')) ?? 'http://localhost:5173'
const arg = (k, d) => process.argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3) ?? d
const SIZES = { 1440: [1440, 900], 1280: [1280, 800], 375: [375, 812] }
const sizes = arg('sizes', '1440,375').split(',')
const themes = arg('themes', 'dark,light').split(',')
const only = arg('only', null)
const filter = only ? new RegExp(only) : null

const ROUTES = [
  // Chapter 1: the inverter, its views, and the zoom ladder below it
  ['c1-01-wafer', '/cmos/wafer'],
  ['c1-02-die', '/cmos/die'],
  ['c1-03-cell', '/cmos/inverter'],
  ['c1-04-cell-focus', '/cmos/inverter?focus=nmos-source', 7000],
  ['c1-05-section', '/cmos/inverter?view=section&cut=slide27', 4500],
  ['c1-06-masks', '/cmos/inverter?view=masks'],
  ['c1-07-fab', '/cmos/inverter?view=fab&step=9', 4000],
  ['c1-08-logic', '/cmos/inverter?view=logic&a=1'],
  ['c1-09-layout', '/cmos/inverter?view=layout'],
  ['c1-10-nmos', '/cmos/inverter/nmos?vg=1.00', 4000],
  ['c1-11-oxide', '/cmos/inverter/nmos/gate-oxide'],
  ['c1-12-lattice', '/cmos/inverter/nmos/gate-oxide/lattice'],
  ['c1-13-mastery', '/cmos/inverter', 3500, async (p) => { await p.getByRole('button', { name: 'mastery' }).click(); await p.waitForTimeout(1500) }],
  // Chapter 2: growth
  ['c2-01-sand', '/growth/sand'],
  ['c2-02-polysilicon', '/growth/polysilicon'],
  ['c2-03-cz', '/growth/czochralski?tab=cz'],
  ['c2-04-fz', '/growth/czochralski?tab=fz'],
  ['c2-05-ingot', '/growth/ingot'],
  ['c2-06-wafers', '/growth/wafers'],
  ['c2-07-cells', '/cmos/inverter/nmos/gate-oxide/lattice?tab=cells'],
  ['c2-08-miller', '/cmos/inverter/nmos/gate-oxide/lattice?tab=miller&hkl=111'],
  ['c2-09-bands', '/cmos/inverter/nmos/gate-oxide/lattice?tab=bands'],
  ['c2-10-defects', '/cmos/inverter/nmos/gate-oxide/lattice?tab=defects'],
  ['c2-11-process', '/cmos/wafer?tab=process', 4000],
  // Chapter 3: clean
  ['c3-01-room', '/clean/cleanroom?tab=room'],
  ['c3-02-wetbench', '/clean/cleanroom?tab=wetbench'],
  ['c3-03-redox', '/clean/cleanroom?tab=redox'],
  ['c3-04-gettering', '/cmos/wafer?tab=gettering'],
  ['c3-05-yield', '/cmos/wafer?tab=yield'],
  // Chapters 4–5: films and epitaxy
  ['c4-01-cvd', '/films/deposition?tab=cvd'],
  ['c4-02-plasma', '/films/deposition?tab=plasma'],
  ['c4-03-pvd', '/films/deposition?tab=pvd'],
  ['c4-04-coverage', '/films/deposition?tab=coverage'],
  ['c5-01-siepi', '/films/deposition?tab=siepi'],
  ['c5-02-mbe', '/epi/mbe'],
  ['c5-03-modes', '/epi/surface?tab=modes'],
  ['c5-04-strain', '/epi/surface?tab=strain'],
  ['c5-05-soi', '/cmos/wafer?tab=soi'],
  // Chapter 6: lithography
  ['c6-01-tool', '/litho/stepper?tab=tool'],
  ['c6-02-optics', '/litho/stepper?tab=optics'],
  ['c6-03-mtf', '/litho/stepper?tab=mtf'],
  ['c6-04-fresnel', '/litho/stepper?tab=fresnel'],
  ['c6-05-resist', '/litho/stepper?tab=resist'],
  ['c6-06-roadmap', '/litho/stepper?tab=roadmap'],
  ['c6-07-ngl', '/litho/stepper?tab=ngl'],
  ['c6-08-write', '/litho/ebeam?tab=write'],
  ['c6-09-liftoff', '/litho/ebeam?tab=liftoff'],
  ['c6-10-proximity', '/litho/ebeam?tab=proximity'],
  // Chapter 7: nanostructures
  ['c7-01-qmbe', '/nano/mbe'],
  ['c7-02-scale', '/nano/sample?tab=scale'],
  ['c7-03-sample', '/nano/sample?tab=sample'],
  ['c7-04-stack', '/nano/layers?tab=stack'],
  ['c7-05-tem', '/nano/layers?tab=tem'],
  ['c7-06-bands', '/nano/bands?tab=bands'],
  ['c7-07-align', '/nano/bands?tab=align'],
  ['c7-08-free', '/nano/wave?tab=free'],
  ['c7-09-well', '/nano/wave?tab=well'],
  ['c7-10-confine', '/nano/wave?tab=confine'],
  ['c7-11-dos', '/nano/wave?tab=dos'],
  ['c7-12-wires', '/nano/fab?tab=wires'],
  ['c7-13-vls', '/nano/fab?tab=vls'],
  ['c7-14-pillars', '/nano/fab?tab=pillars'],
  ['c7-15-colloid', '/nano/fab?tab=colloid'],
  ['c7-16-patterned', '/nano/fab?tab=patterned'],
  ['c7-17-sk', '/nano/fab?tab=sk'],
  ['c7-18-laser', '/nano/fab?tab=laser'],
  // learning, the skill map and the slide viewer
  ['l-01-lesson-step', '/cmos/inverter?mode=lesson&at=cross-section-bodies', 6000],
  ['l-02-lesson-check', '/cmos/inverter?mode=lesson&at=cross-section-bodies', 6000, async (p) => { await p.locator('[data-testid=start-check]:not([disabled])').click(); await p.waitForTimeout(2000) }],
  ['l-03-revise', '/cmos/inverter?mode=revise', 4000],
  ['l-04-skillmap', '/cmos/inverter?mode=revise&rv=coverage', 3500],
  ['l-05-slides', '/cmos/inverter', 3500, async (p) => { await p.evaluate(() => window.__appSet({ source: { refs: [{ topic: 'topic2', slide: 25 }], index: 0 } })); await p.waitForTimeout(2500) }],
  ['l-06-home', '/', 2500],
]

const b = await chromium.launch({ args: ['--enable-unsafe-webgpu', '--enable-features=Vulkan,WebGPU', '--use-angle=metal', '--ignore-gpu-blocklist'] })
const report = []
for (const theme of themes)
  for (const sz of sizes) {
    const [w, h] = SIZES[sz]
    const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: sz === '375', isMobile: sz === '375', colorScheme: theme })
    const p = await ctx.newPage()
    const errors = []
    p.on('pageerror', (e) => errors.push(String(e)))
    const dir = `shots/theme/${label}/${theme}/${sz}`
    mkdirSync(dir, { recursive: true })
    for (const [name, path, wait = 3200, act] of ROUTES) {
      if (filter && !filter.test(name)) continue
      await p.goto(base + path + (path.includes('?') ? '&' : '?') + `shots=1&theme=${theme}`)
      await p.waitForTimeout(wait)
      if (act) await act(p).catch((e) => errors.push(`${name}: ${e.message.split('\n')[0]}`))
      const actual = await p.evaluate(() => document.documentElement.dataset.theme)
      if (actual !== theme) errors.push(`${name}: rendered ${actual}, wanted ${theme}`)
      await p.screenshot({ path: `${dir}/${name}.png` })
      // overlap check: visible fixed/absolute HUD boxes that intersect each other or leave the viewport
      const hits = await p.evaluate(() => {
        const sel = '.topbar, .top-icons, .topbar-tools, .outline-nav, .scenetools-sub, .seg.views, .speedbar, .scenetools-row .tool, .scenetools-hint, .timeline, .stepcard, .scalebar-row, .scalebar-ladder, .scalebar-meta, .panel, .learn-panel, .bench, .lc, .legend, .layout-panel, .mastery-legend'
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
      for (const hgt of hits) report.push(`${theme} ${sz} ${name}: ${hgt}`)
      console.log(`${theme} ${sz} ${name}${hits.length ? '  ⚠ ' + hits.length : ''}`)
    }
    if (errors.length) report.push(`${theme} ${sz} ERRORS: ` + [...new Set(errors)].join(' | '))
    await ctx.close()
  }
await b.close()
writeFileSync(`shots/theme/${label}/overlaps.txt`, report.join('\n') + '\n')
console.log(report.length ? 'REPORT\n' + report.join('\n') : 'no overlaps, no errors')
