// Screenshots of the Chapter 2 and 3 scenes, tabs and panels.
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
  { name: 'c3-06-home', path: '/' },
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
