import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/**
 * WCAG contrast of the design tokens: body text ≥ 4.5:1 (AA) on every
 * surface it sits on; labels, mono readouts and signal colours ≥ 3:1; and
 * no font-size token or literal below 12px anywhere in the CSS.
 */
const css = readFileSync(new URL('./tokens.css', import.meta.url), 'utf8')
const tok = (name: string) => {
  const m = css.match(new RegExp(`--${name}:\\s*([^;]+);`))
  if (!m) throw new Error('no token ' + name)
  return m[1].trim()
}
const rgb = (c: string): [number, number, number] => {
  const h = c.match(/^#([0-9a-f]{6})$/i)
  if (h) return [0, 2, 4].map((i) => parseInt(h[1].slice(i, i + 2), 16)) as [number, number, number]
  const r = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (r) return [+r[1], +r[2], +r[3]]
  throw new Error('colour ' + c)
}
const alpha = (c: string) => +(c.match(/rgba\([^)]*,\s*([\d.]+)\)/)?.[1] ?? 1)
/** a translucent surface as it actually renders over the scene backdrop */
const over = (c: string, under: string): [number, number, number] => {
  const a = alpha(c)
  const [r, g, b] = rgb(c)
  const [R, G, B] = rgb(under)
  return [r * a + R * (1 - a), g * a + G * (1 - a), b * a + B * (1 - a)]
}
const lum = ([r, g, b]: number[]) => {
  const f = (v: number) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}
const ratio = (a: number[], b: number[]) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}

const scene = tok('scene')
const SURFACES: Record<string, number[]> = {
  scene: rgb(scene),
  'bg-1': rgb(tok('bg-1')),
  'bg-2': rgb(tok('bg-2')),
  'bg-3': rgb(tok('bg-3')),
  glass: over(tok('glass'), scene),
  'glass-strong': over(tok('glass-strong'), scene),
}

describe('text contrast (WCAG)', () => {
  for (const ink of ['ink-0', 'ink-1', 'ink-2', 'amber-ink', 'warn'])
    it(`${ink} is AA (4.5:1) on every surface`, () => {
      for (const [name, s] of Object.entries(SURFACES)) expect(ratio(rgb(tok(ink)), s), `${ink} on ${name}`).toBeGreaterThanOrEqual(4.5)
    })
  for (const ink of ['ink-3', 'on', 'lo', 'hi'])
    it(`${ink} (labels, readouts, signals) is at least 3:1 on every surface`, () => {
      for (const [name, s] of Object.entries(SURFACES)) expect(ratio(rgb(tok(ink)), s), `${ink} on ${name}`).toBeGreaterThanOrEqual(3)
    })
  it('text on amber buttons is AA', () => {
    expect(ratio(rgb(tok('on-amber')), rgb(tok('amber')))).toBeGreaterThanOrEqual(4.5)
  })
  it('panels separate from the scene backdrop', () => {
    expect(lum(SURFACES['bg-1'])).toBeGreaterThan(lum(SURFACES.scene))
    expect(lum(SURFACES.scene)).toBeGreaterThan(lum([16, 18, 20]))
  })
})

describe('type size', () => {
  it('no font size below 12px in any stylesheet', () => {
    const files = Object.entries(import.meta.glob('../**/*.css', { query: '?raw', import: 'default', eager: true }) as Record<string, string>)
    const small: string[] = []
    for (const [f, src] of files) for (const m of src.matchAll(/font-size:\s*(\d+(?:\.\d+)?)px/g)) if (+m[1] < 12) small.push(`${f}: ${m[0]}`)
    for (const m of css.matchAll(/--t-\d+:\s*(\d+)px/g)) if (+m[1] < 12) small.push(`tokens: ${m[0]}`)
    expect(small).toEqual([])
  })
})
