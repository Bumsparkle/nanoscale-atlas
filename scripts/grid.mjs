import { chromium } from '@playwright/test'
import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
const [out, dir, re, cols = '6'] = process.argv.slice(2)
const names = readdirSync(dir).filter((f) => f.endsWith('.png') && (!re || new RegExp(re).test(f))).sort()
const html = `<html><body style="margin:0;background:#777;font:11px sans-serif"><div style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:4px;padding:4px">${names.map((f) => `<figure style="margin:0"><img style="width:100%;display:block" src="data:image/png;base64,${readFileSync(resolve(dir, f)).toString('base64')}"><figcaption style="background:#222;color:#eee;padding:2px">${f}</figcaption></figure>`).join('')}</div></body></html>`
const br = await chromium.launch(); const p = await br.newPage({ viewport: { width: 1600, height: 800 } })
await p.setContent(html, { waitUntil: 'load' }); await p.screenshot({ path: out, fullPage: true }); await br.close()
