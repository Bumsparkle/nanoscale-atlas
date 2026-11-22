import { describe, expect, it } from 'vitest'
import { classCount, COUPLES, metalFate, nbYield, poissonYield, remaining, RCA_STEPS, scatter } from './physics'

describe('cleanroom classes (slide 7)', () => {
  it('class X allows X particles ≥ 0.5 µm per ft³, fewer for larger sizes', () => {
    expect(classCount(100, 0.5)).toBeCloseTo(100)
    expect(classCount(100, 5)).toBeLessThan(1)
    expect(classCount(100, 0.1)).toBeGreaterThan(1000)
  })
})

describe('the RCA sequence (slides 10–11)', () => {
  it('runs piranha, HF, rinse, SC-1, rinse, SC-2, rinse', () => {
    expect(RCA_STEPS.map((s) => s.id)).toEqual(['piranha', 'hf', 'rinse1', 'sc1', 'rinse2', 'sc2', 'rinse3'])
  })
  it('removes organics, then oxide, then particles, then alkali ions and the remaining metals', () => {
    expect(remaining(0).size).toBe(5)
    expect(remaining(1).has('organic')).toBe(false)
    expect(remaining(2).has('oxide')).toBe(false)
    expect(remaining(4).has('particle')).toBe(false)
    expect(remaining(4).has('metal')).toBe(true)
    const end = remaining(7)
    expect(end.has('metal') || end.has('alkali') || end.has('organic') || end.has('particle')).toBe(false)
    expect(end.has('oxide')).toBe(true) // H₂O₂ leaves a thin chemical oxide
  })
})

describe('redox (slides 18–19)', () => {
  it('the table is ordered with the strongest oxidants at the bottom', () => {
    for (let i = 1; i < COUPLES.length; i++) expect(COUPLES[i].E).toBeLessThan(COUPLES[i - 1].E)
    expect(COUPLES.at(-1)!.id).toBe('O3')
  })
  it('in water, metals below Si plate out; H₂O₂ dissolves them all', () => {
    expect(metalFate('Fe', 'water')).toBe('plates')
    expect(metalFate('Cu', 'water')).toBe('plates')
    expect(metalFate('Mn', 'water')).toBe('dissolves')
    for (const m of ['Cr', 'Ni', 'Fe', 'Cu', 'Au']) expect(metalFate(m, 'h2o2'), m).toBe('dissolves')
  })
})

describe('yield (slides 15–17)', () => {
  it('Poisson and negative binomial match the slide 16 graph at D0 = 1 cm⁻²', () => {
    expect(poissonYield(10, 1)).toBeCloseTo(4.5e-5, 6)
    expect(nbYield(10, 1, 10)).toBeCloseTo(1 / 1024, 6)
    expect(nbYield(10, 1, 2)).toBeCloseTo(1 / 36, 6)
  })
  it('negative binomial is always higher than Poisson and tends to it as C → ∞', () => {
    for (const A of [0.5, 2, 8]) expect(nbYield(A, 0.5, 2)).toBeGreaterThan(poissonYield(A, 0.5))
    expect(nbYield(3, 0.5, 1e6)).toBeCloseTo(poissonYield(3, 0.5), 5)
  })
  it('slide 17: with C = 2 and 16 cm² chips, D0 must fall to ~0.01 cm⁻² for high yield', () => {
    expect(nbYield(16, 0.01, 2)).toBeGreaterThan(0.85)
    expect(nbYield(16, 1, 2)).toBeLessThan(0.02)
  })
  it('the scattered particles reproduce the negative-binomial yield', () => {
    const n = 40000
    const hits = scatter(n, 1, 1, 2, 7, (i) => i)
    const good = hits.filter((h) => h === 0).length / n
    expect(Math.abs(good - nbYield(1, 1, 2))).toBeLessThan(0.012)
    const hitsP = scatter(n, 1, 1, 1e4, 9, (i) => i)
    expect(Math.abs(hitsP.filter((h) => h === 0).length / n - poissonYield(1, 1))).toBeLessThan(0.012)
  })
})
