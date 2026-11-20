// Every layer, view and fab step worth looking at. Used by shots.mjs.
const routes = [
  { name: 'home', path: '/' },
  { name: 'style', path: '/style', wait: 800 },
  { name: 'debug', path: '/debug' },
  { name: 'L1-wafer', path: '/cmos/wafer' },
  { name: 'L2-die', path: '/cmos/die' },
  { name: 'L3-cell', path: '/cmos/inverter' },
  { name: 'L4-nmos', path: '/cmos/inverter/nmos' },
  { name: 'L5-oxide', path: '/cmos/inverter/nmos/gate-oxide' },
  { name: 'L6-lattice', path: '/cmos/inverter/nmos/gate-oxide/lattice' },
]
export default routes
// interaction shots
routes.push({
  name: 'L3-cell-focus-poly', path: '/cmos/inverter?focus=poly-gate', wait: 3500,
})
routes.push({
  name: 'L3-cell-hover', path: '/cmos/inverter', wait: 3000,
  action: async (page) => { await page.mouse.move(700, 470); await page.waitForTimeout(600) },
})
routes.push({ name: 'L3-cell-focus-y', path: '/cmos/inverter?focus=metal-y', wait: 3500 })
routes.push({ name: 'L3-cell-focus-nsrc', path: '/cmos/inverter?focus=nmos-source', wait: 3500 })
routes.push({ name: 'M4-cut-slide27', path: '/cmos/inverter?view=section&cut=slide27', wait: 4000 })
routes.push({ name: 'M4-cut-ngate', path: '/cmos/inverter?view=section&cut=ngate', wait: 4000 })
routes.push({ name: 'M4-cut-pgate', path: '/cmos/inverter?view=section&cut=pgate', wait: 4000 })
routes.push({ name: 'M4-cut-free', path: '/cmos/inverter?view=section&cut=7.0&axis=y', wait: 3500 })
routes.push({
  name: 'M4-masks-exploded', path: '/cmos/inverter?view=masks', wait: 3500,
  action: async (page) => {
    await page.mouse.move(720, 470); await page.mouse.down()
    for (let i = 0; i < 20; i++) { await page.mouse.move(720, 470 - i * 12); await page.waitForTimeout(16) }
    await page.waitForTimeout(1600)
  },
})
routes.push({ name: 'M5-fab-07', path: '/cmos/inverter?view=fab&step=7', wait: 3500 })
