// Open Graph image: the slide 27 section, 1200×630 → public/og.png
import { chromium } from '@playwright/test'
const base = process.argv[2] ?? 'http://localhost:5173'
const b = await chromium.launch({ args: ['--enable-unsafe-webgpu', '--enable-features=Vulkan,WebGPU', '--use-angle=metal', '--ignore-gpu-blocklist'] })
const p = await b.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 })
await p.goto(base + '/cmos/inverter?view=section&cut=slide27')
await p.waitForTimeout(4500)
await p.addStyleTag({ content: '.scenetools,.legend,.outline-nav,.topbar-tools,.scalebar,.exaggeration{display:none!important}' })
await p.waitForTimeout(300)
await p.screenshot({ path: 'public/og.png' })
await b.close()
