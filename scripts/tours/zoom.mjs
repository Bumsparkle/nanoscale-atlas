// Milestone 6 tour: wheel from the wafer down to the lattice and back up,
// recording the scale bar text at every frame to check it never jumps.
export default async ({ page, base, frame, wait }) => {
  await page.goto(base + '/cmos/wafer' + (process.env.GL ? '?gl=webgl' : ''))
  await wait(3500)
  await frame('wafer')
  const scales = []
  const sample = async () => scales.push(await page.evaluate(() => [window.__app.layer, window.__live.metresPerPixel]))
  const centre = [720, 450]
  await page.mouse.move(...centre)
  const order = ['die', 'cell', 'transistor', 'oxide', 'lattice']
  for (const target of order) {
    for (let i = 0; i < 60; i++) {
      await page.mouse.wheel(0, -200)
      await wait(70)
      await sample()
      if ((await page.evaluate(() => window.__app.layer)) === target) break
    }
    await wait(2200)
    await frame(target)
  }
  for (const target of ['oxide', 'transistor', 'cell', 'die', 'wafer']) {
    await page.keyboard.press('Escape')
    await wait(1800)
    await frame('up-' + target)
  }
  const layers = [...new Set(scales.map((s) => s[0]))]
  // biggest frame-to-frame jump in log scale during the descent
  let worst = 0
  for (let i = 1; i < scales.length; i++) worst = Math.max(worst, Math.abs(Math.log10(scales[i][1] / scales[i - 1][1])))
  console.log('layers visited', layers.join(' → '), '| worst scale jump between samples (decades):', worst.toFixed(2))
  for (let i = 1; i < scales.length; i++) {
    const j = Math.abs(Math.log10(scales[i][1] / scales[i - 1][1]))
    if (j > 0.3) console.log('jump', j.toFixed(2), scales[i - 1], '→', scales[i])
  }
}
