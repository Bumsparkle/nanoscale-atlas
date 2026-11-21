// Render assets/app-icon.svg to a 1024 px PNG, then `tauri icon` makes the full macOS set.
import { chromium } from '@playwright/test'
import { readFileSync } from 'node:fs'
const svg = readFileSync('assets/app-icon.svg', 'utf8')
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1024, height: 1024 } })
await p.setContent(`<html><body style="margin:0;background:transparent">${svg.replace('<svg ', '<svg width="1024" height="1024" ')}</body></html>`)
await p.screenshot({ path: 'assets/app-icon.png', omitBackground: true })
await b.close()
console.log('assets/app-icon.png')
