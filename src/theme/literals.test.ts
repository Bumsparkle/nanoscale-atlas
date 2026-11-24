import { describe, expect, it } from 'vitest'

/**
 * Every colour goes through a theme token: CSS custom properties in
 * styles/tokens.css (and the app glass in styles/app.css), the scene palette
 * in theme/scene.ts. Anywhere else a hex or rgb() literal is a bug: it would
 * look the same in both themes.
 */
const ALLOWED = ['../styles/tokens.css', '../styles/app.css', './scene.ts', './theme.ts']
const LITERAL = /#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b(?=['"])|\b0x[0-9a-fA-F]{6}\b|\brgba?\(\s*\d/g

describe('colour literals', () => {
  it('appear only in the token files', () => {
    const files = import.meta.glob(['../**/*.{ts,tsx,css}', '!../**/*.test.ts', '!../learn/calcs.ts'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>
    const found: string[] = []
    for (const [f, src] of Object.entries(files)) {
      if (ALLOWED.includes(f)) continue
      src.split('\n').forEach((l, i) => {
        if (/^\s*(\/\/|\*|\/\*)/.test(l)) return
        for (const m of l.matchAll(LITERAL)) found.push(`${f}:${i + 1} ${m[0]}`)
      })
    }
    expect(found).toEqual([])
  })
})
