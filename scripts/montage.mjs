// Side-by-side sheets: node scripts/montage.mjs out.png colA colB [names regex] [pairs per row, default 1]
import { chromium } from '@playwright/test'
import { readdirSync, readFileSync } from "node:fs"
import { resolve } from 'node:path'
const [out, a, b, re, per = '1'] = process.argv.slice(2)
const names = readdirSync(a).filter((f) => f.endsWith('.png') && (!re || new RegExp(re).test(f))).sort()
const cell = (dir, f) => `<figure><img src="data:image/png;base64,${readFileSync(resolve(dir, f)).toString("base64")}"><figcaption>${dir.split('/').slice(-2).join('/')} · ${f}</figcaption></figure>`
const html = `<html><body style="margin:0;background:#888;font:12px sans-serif"><div style="display:grid;grid-template-columns:repeat(${2 * +per},1fr);gap:6px;padding:6px">${names.map((f) => cell(a, f) + cell(b, f)).join('')}</div><style>figure{margin:0}img{width:100%;display:block}figcaption{padding:2px 4px;background:#222;color:#eee}</style></body></html>`
const br = await chromium.launch()
const p = await br.newPage({ viewport: { width: 1600, height: 800 } })
await p.setContent(html, { waitUntil: 'load' })
await p.screenshot({ path: out, fullPage: true })
await br.close()
console.log(out, names.length)
