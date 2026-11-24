// Screenshots of the Chapter 2–7 scenes, tabs and panels.
// usage: node scripts/chaptershots.mjs [baseUrl] [filter] [--mobile]
// writes shots/chapters/<name>.png and prints page errors
import { chromium } from '@playwright/test'
import { mkdirSync } from 'node:fs'

const base = process.argv[2] && !process.argv[2].startsWith('-') ? process.argv[2] : 'http://localhost:5182'
const filter = process.argv[3] && !process.argv[3].startsWith('-') ? new RegExp(process.argv[3]) : null
const mobile = process.argv.includes('--mobile')

const set = (patch) => async (page) => {
  await page.evaluate((p) => window.__atlasSet?.(p), patch)
  await page.waitForTimeout(1200)
}
const FD = { T: 900, P: 760, Y: 0.01, plasma: 'pecvd', logP: -6, ebeam: false, method: 'cvd', aspect: 2, Sc: 0.1 }
const ED = { T: 1100, rate: 1, sub: 'As', seal: false, rp: false, logGa: -3.5, shutter: true, ml: 0, mode: 'fvdm', coverage: 1.5, film: 'InAs', substrate: 'GaAs', thick: 1, soi: 0 }
const LD = { system: 'projection', source: 'krf', NA: 0.6, k1: 0.75, k2: 0.5, S: 0.6, sep: 1.6, feature: 300, gap: 10, W: 4, rstep: 0, rpm: 4000, dose: 150, year: 2004, keV: 20, eb: 0, print: false, fit: false, fNm: 600 }
const ND = { sample: 'qw', grown: 5, well: 'GaAs', barrier: 'AlGaAs', L: 10, V0: 0.3, m: 0.067, finite: false, level: 1, prob: false, k: 0.5, dims: 1, a: 10, b: 10, c: 10, dof: 3, E: 60, fstep: 0, seed: 'au', dotNm: 4, T: 25, logSize: -8 }
const ROUTES = [
  { name: 'c2-01-sand', path: '/growth/sand' },
  { name: 'c2-02-polysilicon', path: '/growth/polysilicon' },
  { name: 'c2-03-cz', path: '/growth/czochralski' },
  { name: 'c2-04-cz-boron-late', path: '/growth/czochralski?k0=0.8&f=0.9' },
  { name: 'c2-05-cz-sb', path: '/growth/czochralski?k0=0.023&f=0.7' },
  { name: 'c2-06-fz', path: '/growth/czochralski?tab=fz' },
  { name: 'c2-07-ingot', path: '/growth/ingot' },
  { name: 'c2-08-wafers', path: '/growth/wafers' },
  { name: 'c2-09-cells-diamond', path: '/cmos/inverter/nmos/gate-oxide/lattice?tab=cells' },
  { name: 'c2-10-cells-half', path: '/cmos/inverter/nmos/gate-oxide/lattice?tab=cells', action: set({ crystal: { cell: 'diamond', offset: 0.45, hkl: [1, 0, 0], r: 1, T: 1000 } }) },
  { name: 'c2-11-miller-100', path: '/cmos/inverter/nmos/gate-oxide/lattice?tab=miller&hkl=100' },
  { name: 'c2-12-miller-111', path: '/cmos/inverter/nmos/gate-oxide/lattice?tab=miller&hkl=111' },
  { name: 'c2-13-miller-110', path: '/cmos/inverter/nmos/gate-oxide/lattice?tab=miller&hkl=110' },
  { name: 'c2-14-bands-a', path: '/cmos/inverter/nmos/gate-oxide/lattice?tab=bands' },
  { name: 'c2-15-bands-far', path: '/cmos/inverter/nmos/gate-oxide/lattice?tab=bands', action: set({ crystal: { cell: 'diamond', offset: 1, hkl: [1, 0, 0], r: 2.2, T: 1000 } }) },
  { name: 'c2-16-defects', path: '/cmos/inverter/nmos/gate-oxide/lattice?tab=defects' },
  { name: 'c2-17-process-ox', path: '/cmos/wafer?tab=process', wait: 4500 },
  { name: 'c2-18-process-etch', path: '/cmos/wafer?tab=process', action: set({ procOp: 'etch' }), wait: 3000 },
  { name: 'c2-19-process-diff', path: '/cmos/wafer?tab=process', action: set({ procOp: 'diffusion' }), wait: 3000 },
  { name: 'c2-20-process-implant', path: '/cmos/wafer?tab=process', action: set({ procOp: 'implant' }), wait: 3000 },
  { name: 'c2-21-process-litho-neg', path: '/cmos/wafer?tab=process', action: set({ procOp: 'litho', tone: 'negative' }), wait: 3000 },
  { name: 'c3-01-cleanroom', path: '/clean/cleanroom' },
  { name: 'c3-02-wetbench', path: '/clean/cleanroom?tab=wetbench' },
  { name: 'c3-03-redox', path: '/clean/cleanroom?tab=redox' },
  { name: 'c3-04-gettering', path: '/cmos/wafer?tab=gettering' },
  { name: 'c3-05-yield', path: '/cmos/wafer?tab=yield' },
  { name: 'c4-01-cvd', path: '/films/deposition' },
  { name: 'c4-02-lpcvd', path: '/films/deposition', action: set({ films: { ...FD, P: 0.5, T: 620, Y: 1 } }) },
  { name: 'c4-03-plasma', path: '/films/deposition?tab=plasma' },
  { name: 'c4-04-magnetron', path: '/films/deposition?tab=plasma', action: set({ films: { ...FD, plasma: 'magnetron' } }) },
  { name: 'c4-05-evap', path: '/films/deposition?tab=pvd' },
  { name: 'c4-06-evap-rough', path: '/films/deposition?tab=pvd', action: set({ films: { ...FD, logP: -2, ebeam: true } }) },
  { name: 'c4-07-coverage', path: '/films/deposition?tab=coverage' },
  { name: 'c4-08-coverage-sputter', path: '/films/deposition?tab=coverage', action: set({ films: { ...FD, method: 'sputter', aspect: 3 } }) },
  { name: 'c5-01-siepi', path: '/films/deposition?tab=siepi' },
  { name: 'c5-02-mbe', path: '/epi/mbe', wait: 6000 },
  { name: 'c5-03-modes', path: '/epi/surface' },
  { name: 'c5-04-modes-sk', path: '/epi/surface', action: set({ epi: { ...ED, mode: 'sk', coverage: 3 } }) },
  { name: 'c5-05-strain', path: '/epi/surface?tab=strain' },
  { name: 'c5-06-strain-relaxed', path: '/epi/surface?tab=strain', action: set({ epi: { ...ED, thick: 15 } }) },
  { name: 'c5-07-soi', path: '/cmos/wafer?tab=soi', action: set({ epi: { ...ED, soi: 4 } }) },
  { name: 'c5-08-soi-done', path: '/cmos/wafer?tab=soi', action: set({ epi: { ...ED, soi: 5 } }) },
  { name: 'c5-09-soi-implant', path: '/cmos/wafer?tab=soi', action: set({ epi: { ...ED, soi: 2 } }) },
  { name: 'c3-06-home', path: '/' },
  { name: 'c6-01-tool', path: '/litho/stepper?tab=tool' },
  { name: 'c6-02-contact', path: '/litho/stepper?tab=tool', action: set({ litho: { ...LD, system: 'contact', source: 'g' } }) },
  { name: 'c6-03-proximity', path: '/litho/stepper?tab=tool', action: set({ litho: { ...LD, system: 'proximity', source: 'i' } }) },
  { name: 'c6-04-optics', path: '/litho/stepper?tab=optics' },
  { name: 'c6-05-optics-merged', path: '/litho/stepper?tab=optics', action: set({ litho: { ...LD, sep: 0.6 } }) },
  { name: 'c6-06-mtf', path: '/litho/stepper?tab=mtf' },
  { name: 'c6-07-mtf-lost', path: '/litho/stepper?tab=mtf', action: set({ litho: { ...LD, feature: 160, S: 0.1 } }) },
  { name: 'c6-08-fresnel', path: '/litho/stepper?tab=fresnel' },
  { name: 'c6-09-resist-expose', path: '/litho/stepper?tab=resist', action: set({ litho: { ...LD, rstep: 5 } }) },
  { name: 'c6-10-resist-done', path: '/litho/stepper?tab=resist', action: set({ litho: { ...LD, rstep: 8, dose: 70 } }) },
  { name: 'c6-11-roadmap', path: '/litho/stepper?tab=roadmap', action: set({ litho: { ...LD, year: 2013 } }) },
  { name: 'c6-12-ngl', path: '/litho/stepper?tab=ngl' },
  { name: 'c6-13-ebeam', path: '/litho/ebeam?tab=write', wait: 4000 },
  { name: 'c6-14-liftoff', path: '/litho/ebeam?tab=liftoff', action: set({ litho: { ...LD, eb: 5 } }) },
  { name: 'c6-15-proximity', path: '/litho/ebeam?tab=proximity' },
  { name: 'c6-16-layout-print', path: '/cmos/inverter?view=layout', action: set({ litho: { ...LD, print: true, fit: false, fNm: 600 } }) },
  { name: 'c6-17-layout-fail', path: '/cmos/inverter?view=layout', action: set({ litho: { ...LD, print: true, fit: false, fNm: 600, source: 'g', NA: 0.28, k1: 0.8 } }) },
  { name: 'c6-18-cell-fail', path: '/cmos/inverter', action: set({ litho: { ...LD, print: true, fit: false, fNm: 600, source: 'g', NA: 0.28, k1: 0.8 } }), wait: 3500 },
  { name: 'c7-01-qmbe', path: '/nano/mbe', action: set({ nano: { ...ND, grown: 3 } }) },
  { name: 'c7-02-scale', path: '/nano/sample?tab=scale' },
  { name: 'c7-03-sample', path: '/nano/sample?tab=sample' },
  { name: 'c7-04-layers', path: '/nano/layers?tab=stack' },
  { name: 'c7-05-tem', path: '/nano/layers?tab=tem', action: set({ nano: { ...ND, sample: 'mqw', grown: 7 } }) },
  { name: 'c7-06-bands', path: '/nano/bands?tab=bands' },
  { name: 'c7-07-align2', path: '/nano/bands?tab=align', action: set({ nano: { ...ND, well: 'InP', barrier: 'InAlAs' } }), wait: 4000 },
  { name: 'c7-08-free', path: '/nano/wave?tab=free' },
  { name: 'c7-09-well', path: '/nano/wave?tab=well' },
  { name: 'c7-10-finite', path: '/nano/wave?tab=well', action: set({ nano: { ...ND, finite: true, V0: 0.15, prob: true } }) },
  { name: 'c7-11-dot', path: '/nano/wave?tab=confine', action: set({ nano: { ...ND, dims: 3 } }) },
  { name: 'c7-12-wire', path: '/nano/wave?tab=confine', action: set({ nano: { ...ND, dims: 2 } }) },
  { name: 'c7-13-dos3', path: '/nano/wave?tab=dos', action: set({ nano: { ...ND, dof: 3, E: 80 } }) },
  { name: 'c7-14-dos2', path: '/nano/wave?tab=dos', action: set({ nano: { ...ND, dof: 2, E: 80 } }) },
  { name: 'c7-15-wires', path: '/nano/fab?tab=wires' },
  { name: 'c7-16-vls', path: '/nano/fab?tab=vls', action: set({ nano: { ...ND, fstep: 4 } }) },
  { name: 'c7-17-pillars', path: '/nano/fab?tab=pillars', action: set({ nano: { ...ND, fstep: 1 } }) },
  { name: 'c7-18-colloid', path: '/nano/fab?tab=colloid', action: set({ nano: { ...ND, dotNm: 6.5 } }) },
  { name: 'c7-19-patterned', path: '/nano/fab?tab=patterned', action: set({ nano: { ...ND, fstep: 1 } }) },
  { name: 'c7-20-sk', path: '/nano/fab?tab=sk', action: set({ nano: { ...ND, fstep: 5 } }) },
  { name: 'c7-21-laser', path: '/nano/fab?tab=laser', action: set({ nano: { ...ND, T: 85 } }) },
]

mkdirSync('shots/chapters', { recursive: true })
const browser = await chromium.launch({ headless: true, args: ['--enable-unsafe-webgpu', '--enable-features=Vulkan,WebGPU', '--use-angle=metal', '--ignore-gpu-blocklist'] })
const ctx = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 }, deviceScaleFactor: mobile ? 2 : 1 })
const page = await ctx.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
for (const r of ROUTES) {
  if (filter && !filter.test(r.name)) continue
  const sep = r.path.includes('?') ? '&' : '?'
  await page.goto(base + r.path + sep + 'shots=1', { waitUntil: 'load' })
  await page.waitForTimeout(r.wait ?? 2800)
  if (r.action) await r.action(page)
  const file = `shots/chapters/${mobile ? 'm-' : ''}${r.name}.png`
  await page.screenshot({ path: file })
  console.log(file)
}
if (errors.length) console.log('ERRORS:\n' + [...new Set(errors)].slice(0, 30).join('\n'))
await browser.close()
