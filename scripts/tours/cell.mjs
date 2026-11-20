// Milestone 3 tour: the inverter cell, hover and click-to-inspect.
export default async ({ page, base, frame, wait }) => {
  await page.goto(base + '/cmos/inverter' + (process.env.GL ? '?gl=webgl' : ''))
  await wait(4000)
  await frame('rest')
  // slow orbit by dragging
  await page.mouse.move(640, 300)
  await page.mouse.down()
  for (let i = 0; i < 40; i++) { await page.mouse.move(640 + i * 6, 300 + i * 0.8); await wait(30) }
  await page.mouse.up()
  await wait(1500)
  await frame('orbit')
  // hover around
  for (const [x, y] of [[520, 420], [620, 400], [760, 380], [880, 420]]) { await page.mouse.move(x, y); await wait(900) }
  await frame('hover')
  // open the parts list and inspect several objects by keyboard
  await page.getByRole('button', { name: /parts/ }).click()
  await wait(500)
  for (const t of ['Polysilicon gate (input A)', 'nMOS source (n+)', 'Output Y (metal1)', 'n-well', 'Contacts']) {
    await page.getByRole('button', { name: t, exact: true }).click()
    await wait(2600)
    await frame(t.replace(/\W+/g, '-').toLowerCase())
  }
  await page.keyboard.press('Escape')
  await wait(2500)
  await frame('back')
  // zoom with the wheel
  await page.mouse.move(640, 420)
  for (let i = 0; i < 10; i++) { await page.mouse.wheel(0, -120); await wait(120) }
  await wait(2500)
  await frame('zoomed')
  for (let i = 0; i < 6; i++) { await page.mouse.wheel(0, 160); await wait(120) }
  await wait(3000)
  await frame('end')
}
