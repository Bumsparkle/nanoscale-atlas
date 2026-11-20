// Compose screenshots into one contact sheet: node scripts/sheet.mjs out.png cols file...
import { chromium } from '@playwright/test'
import { readFileSync } from 'node:fs'
const [out, cols, ...files] = process.argv.slice(2)
const imgs = files.map((f) => `<figure><img src="data:image/png;base64,${readFileSync(f).toString('base64')}"><figcaption>${f.split('/').pop()}</figcaption></figure>`).join('')
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 2200, height: 1200 } })
await p.setContent(`<body style="margin:0;background:#000;display:grid;grid-template-columns:repeat(${cols},1fr);gap:6px;font:14px monospace;color:#fff">${imgs}<style>figure{margin:0;position:relative}img{width:100%;display:block}figcaption{position:absolute;bottom:4px;left:6px;background:#000c;padding:1px 4px}</style></body>`)
await p.screenshot({ path: out, fullPage: true })
await b.close()
