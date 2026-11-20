import { describe, expect, it } from 'vitest'
import { checkRules, RULES } from './rules'

describe('slide 47 design rules', () => {
  const checks = checkRules()

  it('transcribed values match the slide', () => {
    expect(RULES.metal1).toEqual({ width: 4, spacing: 4 })
    expect(RULES.metal2).toEqual({ width: 4, spacing: 4 })
    expect(RULES.diffusion).toEqual({ width: 4, spacing: 4 })
    expect(RULES.poly).toEqual({ width: 2, spacing: 3, gateExtension: 2 })
    expect(RULES.nwell).toEqual({ diffInside: 6, diffOutside: 6 })
    expect(RULES.contact.size).toBe(2)
    expect(RULES.contact.metalSurround).toBe(1)
    expect(RULES.via.spacing).toBe(3)
  })

  it('the inverter layout passes every rule', () => {
    const bad = checks.filter((c) => !c.ok)
    expect(bad, JSON.stringify(bad, null, 1)).toEqual([])
  })

  it('every rule that applies to the inverter is actually exercised', () => {
    const seen = new Set(checks.map((c) => c.rule))
    for (const r of [
      'metal1.width', 'metal1.spacing', 'diffusion.width', 'diffusion.spacing', 'poly.width',
      'poly.gateExtension', 'nwell.diffInside', 'nwell.diffOutside', 'contact.size', 'contact.metalSurround', 'contact.diffSurround',
    ])
      expect(seen.has(r as never), r).toBe(true)
  })

  it('minimum transistor: L = 2λ (poly width, slide 46), W = 4λ (slide 48)', () => {
    const poly = checks.filter((c) => c.rule === 'poly.width')
    expect(Math.min(...poly.map((c) => c.measured))).toBe(2)
    const diff = checks.filter((c) => c.rule === 'diffusion.width')
    expect(Math.min(...diff.map((c) => c.measured))).toBe(4)
  })

  it('the metal spacings sit exactly at the 4λ minimum (the cell is as tight as the rules allow)', () => {
    const sp = checks.filter((c) => c.rule === 'metal1.spacing').map((c) => c.measured)
    expect(Math.min(...sp)).toBe(4)
  })
})
