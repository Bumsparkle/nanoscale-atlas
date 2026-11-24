import { describe, expect, it } from 'vitest'
import { PALETTES } from './scene'

/**
 * The scene palette: the light theme keeps material meaning, and no module
 * captures a theme-dependent colour at import time (it would keep the
 * first theme's value after a switch).
 */
type Tree = Record<string, unknown>
const flat = (o: Tree, pre = ''): Record<string, unknown> =>
  Object.fromEntries(Object.entries(o).flatMap(([k, v]) => (v && typeof v === 'object' ? Object.entries(flat(v as Tree, pre + k + '.')) : [[pre + k, v]])))
const dark = flat(PALETTES.dark as never)
const light = flat(PALETTES.light as never)
const varying = Object.keys(dark).filter((k) => dark[k] !== light[k])

const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16) / 255)
function hue(c: string) {
  const [r, g, b] = hex(c)
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn
  if (d < 0.04) return null
  const h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4
  return ((h * 60) + 360) % 360
}

describe('scene palette', () => {
  it('material colours are the same in both themes', () => {
    for (const g of ['phys', 'legend', 'obj', 'atom', 'hetero'])
      for (const k of Object.keys(dark).filter((k) => k.startsWith(g + '.') && !k.endsWith('Edge') && k !== 'legend.edge'))
        expect(light[k], k).toBe(dark[k])
  })
  it('signal colours keep their hue family on the light theme (within 25°)', () => {
    for (const k of varying.filter((k) => k.startsWith('signal.') || k.startsWith('mastery.'))) {
      const a = hue(dark[k] as string), b = hue(light[k] as string)
      if (a === null || b === null) continue
      const d = Math.min(Math.abs(a - b), 360 - Math.abs(a - b))
      expect(d, `${k}: ${dark[k]} → ${light[k]}`).toBeLessThanOrEqual(25)
    }
  })
  it('n-well and p-substrate stay distinguishable (exterior hue and cut-face value)', () => {
    for (const p of [PALETTES.dark, PALETTES.light]) {
      expect(p.phys.siNwell).not.toBe(p.phys.siP)
      const [a, b] = [hex(p.legend.siP), hex(p.legend.siNwell)].map((c) => c[0] + c[1] + c[2])
      expect(Math.abs(a - b)).toBeGreaterThan(0.25)
    }
  })

  it('no module reads a theme-dependent token at import time', () => {
    const files = Object.entries(
      import.meta.glob(['../scene/**/*.{ts,tsx}', '../chapters/**/*.ts', '../ui/**/*.tsx'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>,
    ).filter(([f]) => !f.includes('.test.'))
    const bad: string[] = []
    const re = new RegExp(`\\bP\\.(${varying.map((v) => v.replace('.', '\\.')).join('|')})\\b`)
    for (const [f, src] of files) {
      // top-level statements: from a line starting at column 0 to the next one
      const lines = src.split('\n')
      let stmt = ''
      const flush = () => {
        // lazy forms are fine: functions, arrow functions, components
        const lazy = /^(export\s+)?(default\s+)?(async\s+)?function\b|^(export\s+)?const\s+\w+\s*(:[^=]+)?=\s*(\([^)]*\)|\w+)\s*(:[^=]+)?=>|^(export\s+)?const\s+\w+\s*=\s*(memo|forwardRef|lazy)\(/
        if (stmt && !lazy.test(stmt) && re.test(stmt)) bad.push(`${f}: ${stmt.split('\n')[0].slice(0, 90)}`)
        stmt = ''
      }
      for (const l of lines) {
        if (/^\S/.test(l) && !/^[})\]]/.test(l)) flush()
        stmt += l + '\n'
      }
      flush()
    }
    expect(bad).toEqual([])
  })
})
