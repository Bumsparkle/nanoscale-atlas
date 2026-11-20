// Screenshot every fab step and compose a contact sheet: shots/fab/sheet.png
// usage: node scripts/fabsheet.mjs [base] [--mid]   (--mid shoots each step half-way through)
import { chromium } from '@playwright/test'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
const base = process.argv[2] && !process.argv[2].startsWith('-') ? process.argv[2] : 'http://localhost:5173'
const mid = process.argv.includes('--mid')
mkdirSync('shots/fab', { recursive: true })
const b = await chromium.launch({ args: ['--enable-unsafe-webgpu', '--enable-features=Vulkan,WebGPU', '--use-angle=metal', '--ignore-gpu-blocklist'] })
const p = await b.newPage({ viewport: { width: 1280, height: 800 } })
await p.goto(base + '/cmos/inverter?view=fab&step=0')
await p.waitForTimeout(3500)
const n = 45
const files = []
for (let k = 0; k < n; k++) {
  await p.evaluate(([k, mid]) => {
    const rt = window.__cellRuntime
    const target = mid && k > 0 ? k - 0.5 : k
    rt.fab.snap(target)
    window.__atlas_set({ step: Math.round(target), playing: false })
  }, [k, mid])
  await p.waitForTimeout(500)
  const f = `shots/fab/${mid ? 'mid-' : ''}${String(k).padStart(2, '0')}.png`
  await p.screenshot({ path: f })
  files.push(f)
}
// contact sheet
const imgs = files.map((f) => `<figure><img src="data:image/png;base64,${readFileSync(f).toString('base64')}"><figcaption>${f.match(/(\d+)\.png/)[1]}</figcaption></figure>`).join('')
writeFileSync('shots/fab/sheet.html', `<html><body style="margin:0;background:#000;display:grid;grid-template-columns:repeat(5,1fr);gap:4px;font:12px monospace;color:#fff">${imgs}<style>figure{margin:0;position:relative}img{width:100%;display:block}figcaption{position:absolute;top:4px;left:6px;background:#000a;padding:1px 4px}</style></body></html>`)
const s = await b.newPage({ viewport: { width: 2000, height: 1400 } })
await s.goto('file://' + process.cwd() + '/shots/fab/sheet.html')
await s.screenshot({ path: `shots/fab/${mid ? 'mid-' : ''}sheet.png`, fullPage: true })
await b.close()
console.log('sheet written')
