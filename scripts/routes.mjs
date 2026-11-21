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
routes.push({ name: 'M6-nmos-on', path: '/cmos/inverter/nmos?vg=1.00', wait: 3500 })
routes.push({ name: 'M6-pmos-on', path: '/cmos/inverter/pmos', wait: 3500 })
routes.push({ name: 'M6-lattice-P', path: '/cmos/inverter/nmos/gate-oxide/lattice', wait: 2500, action: async (p) => { await p.getByRole('button', { name: 'P · group V' }).click(); await p.waitForTimeout(2500) } })
routes.push({ name: 'M6-lattice-poly', path: '/cmos/inverter/nmos/gate-oxide/lattice', wait: 2500, action: async (p) => { await p.getByRole('button', { name: 'poly', exact: true }).click(); await p.waitForTimeout(2500) } })
routes.push({ name: 'M7-logic-a0', path: '/cmos/inverter?view=logic', wait: 3500 })
routes.push({ name: 'M7-logic-a1', path: '/cmos/inverter?view=logic&a=1', wait: 3500 })
routes.push({ name: 'M7-nand-10', path: '/cmos/inverter?view=logic&a=1', wait: 2500, action: async (p) => { await p.getByRole('tab', { name: 'NAND' }).click(); await p.waitForTimeout(500) } })
routes.push({ name: 'M7-junction-fwd', path: '/cmos/inverter?view=logic', wait: 2500, action: async (p) => { await p.getByRole('tab', { name: 'p-n junction' }).click(); await p.locator('input[type=range]').first().fill('0.4'); await p.waitForTimeout(500) } })
routes.push({ name: 'M8-gowning', path: '/', wait: 1500, action: async (p) => { await p.evaluate(() => localStorage.clear()); await p.getByRole('button', { name: 'Enter the cleanroom' }).click(); await p.waitForTimeout(1500) } })
routes.push({ name: 'M8-opening', path: '/', wait: 2500, action: async (p) => { await p.getByRole('button', { name: 'Enter the cleanroom' }).click(); await p.waitForTimeout(400); await p.keyboard.press('Escape'); await p.waitForTimeout(450) } })
routes.push({ name: 'M8-entered', path: '/', wait: 2500, action: async (p) => { await p.getByRole('button', { name: 'Enter the cleanroom' }).click(); await p.waitForTimeout(400); await p.keyboard.press('Escape'); await p.waitForTimeout(3000) } })
// Layout view (slides 46–48)
routes.push({ name: 'LY-all', path: '/cmos/inverter?view=layout', wait: 3500 })
for (const l of ['nwell', 'poly', 'ndiff', 'pdiff', 'contact', 'metal']) routes.push({ name: 'LY-only-' + l, path: '/cmos/inverter?view=layout&layers=' + l, wait: 3000 })
routes.push({ name: 'LY-combo-poly-ndiff', path: '/cmos/inverter?view=layout&layers=poly,ndiff', wait: 3000 })
routes.push({
  name: 'LY-hover-gate', path: '/cmos/inverter?view=layout&layers=poly,ndiff', wait: 3000,
  action: async (p) => {
    // hover the left edge of the nMOS poly leg (x = 9λ, y = 2λ)
    const pt = await p.evaluate(() => window.__layoutPoint(9, 2))
    await p.mouse.move(pt[0], pt[1]); await p.waitForTimeout(400)
  },
})
routes.push({
  name: 'LY-hover-gap', path: '/cmos/inverter?view=layout&layers=metal', wait: 3000,
  action: async (p) => { const pt = await p.evaluate(() => window.__layoutPoint(10, 2)); await p.mouse.move(pt[0], pt[1]); await p.waitForTimeout(400) },
})
routes.push({
  name: 'LY-violation', path: '/cmos/inverter?view=layout', wait: 3000,
  action: async (p) => {
    await p.getByRole('button', { name: 'edit masks' }).click()
    // drag the Y metal's left edge from 12λ to 10λ: metal spacing to GND drops to 2λ
    const a = await p.evaluate(() => window.__layoutPoint(12, 1))
    const b = await p.evaluate(() => window.__layoutPoint(10, 1))
    await p.mouse.move(a[0], a[1]); await p.mouse.down(); await p.mouse.move(b[0], b[1], { steps: 6 }); await p.mouse.up()
    await p.mouse.move(b[0], b[1] + 2); await p.waitForTimeout(400)
  },
})
routes.push({ name: 'LY-transistor-panel', path: '/cmos/inverter?view=layout&focus=min-transistor', wait: 3000 })
routes.push({
  name: 'LY-transition-mid', path: '/cmos/inverter', wait: 3500,
  action: async (p) => { await p.getByRole('button', { name: 'Layout', exact: true }).click(); await p.waitForTimeout(330) },
})
routes.push({
  name: 'LY-edited-then-3d', path: '/cmos/inverter?view=layout', wait: 3000,
  action: async (p) => {
    await p.getByRole('button', { name: 'edit masks' }).click()
    // widen the nMOS gate to 3λ (right edge 11 → 12) and keep the drain contact clear
    const a = await p.evaluate(() => window.__layoutPoint(11, 6))
    const b = await p.evaluate(() => window.__layoutPoint(12, 6))
    await p.mouse.move(a[0], a[1]); await p.mouse.down(); await p.mouse.move(b[0], b[1], { steps: 4 }); await p.mouse.up()
    await p.waitForTimeout(300)
    await p.getByRole('button', { name: 'Section', exact: true }).click()
    await p.waitForTimeout(400)
    await p.keyboard.press('1')
    await p.waitForTimeout(3200)
  },
})
// Learning modes
routes.push({ name: 'LN-lesson-start', path: '/cmos/inverter?mode=lesson&chunk=structures', wait: 5000 })
routes.push({ name: 'LN-lesson-layout', path: '/cmos/inverter?mode=lesson&chunk=rules-gate', wait: 6000 })
routes.push({ name: 'LN-revise-drill', path: '/cmos/inverter?mode=revise', wait: 5000 })
