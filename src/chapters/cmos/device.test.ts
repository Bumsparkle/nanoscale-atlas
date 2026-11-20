import { describe, expect, it } from 'vitest'
import { evaluate, GATES, nmosOn, pmosOn, conducts, channelStrength } from './device'
import { junction, V0 } from './junction'

const rows = (n: number) => (n === 1 ? [[0], [1]] : [[0, 0], [0, 1], [1, 0], [1, 1]]) as (0 | 1)[][]

describe('switch model (slide 14)', () => {
  it('nMOS ON at g = 1, pMOS ON at g = 0', () => {
    expect(nmosOn(1)).toBe(true)
    expect(nmosOn(0)).toBe(false)
    expect(pmosOn(0)).toBe(true)
    expect(pmosOn(1)).toBe(false)
  })
  it('the drawn channel strength agrees with the switch model at the rails', () => {
    expect(channelStrength('nmos', 1)).toBe(1)
    expect(channelStrength('nmos', 0)).toBe(0)
    expect(channelStrength('pmos', 0)).toBe(1)
    expect(channelStrength('pmos', 1)).toBe(0)
  })
})

describe('truth tables, every row from slides 15–23', () => {
  it('inverter (slides 15–17): A=1 → nMOS ON, pMOS OFF, Y=0; A=0 → Y=1', () => {
    const g = GATES.INV
    expect(evaluate(g, { A: 1, B: 0 })).toBe(0)
    expect(conducts(g.pullDown, { A: 1, B: 0 })).toBe(true)
    expect(conducts(g.pullUp, { A: 1, B: 0 })).toBe(false)
    expect(evaluate(g, { A: 0, B: 0 })).toBe(1)
  })
  it('NAND (slides 18–22): parallel pMOS, series nMOS', () => {
    const want = [1, 1, 1, 0]
    rows(2).forEach(([A, B], i) => expect(evaluate(GATES.NAND, { A, B }), `A=${A} B=${B}`).toBe(want[i]))
    // slide 20: A=0, B=1: the B nMOS is ON but the A nMOS is OFF, so the series pull-down is open and Y = 1
    expect(conducts(GATES.NAND.pullDown, { A: 0, B: 1 })).toBe(false)
  })
  it('NOR (slide 23): series pMOS, parallel nMOS', () => {
    const want = [1, 0, 0, 0]
    rows(2).forEach(([A, B], i) => expect(evaluate(GATES.NOR, { A, B }), `A=${A} B=${B}`).toBe(want[i]))
  })
  it('no input combination floats or fights in any gate (one network conducts, slide 16–17)', () => {
    for (const g of Object.values(GATES)) for (const [A, B = 0] of rows(g.inputs.length)) expect([0, 1]).toContain(evaluate(g, { A, B }))
  })
})

describe('p-n junction (slides 7–9)', () => {
  it('charge neutrality NaWp = NdWn for any doping ratio', () => {
    for (const r of [0.2, 1, 5]) {
      const j = junction(0, r)
      expect(r * j.Wp).toBeCloseTo(1 * j.Wn)
    }
  })
  it('forward bias lowers the barrier and narrows the depletion region; reverse widens both', () => {
    const z = junction(0, 1)
    const f = junction(0.4, 1)
    const r = junction(-3, 1)
    expect(z.barrier).toBeCloseTo(V0)
    expect(f.barrier).toBeLessThan(z.barrier)
    expect(f.W).toBeLessThan(z.W)
    expect(r.barrier).toBeGreaterThan(z.barrier)
    expect(r.W).toBeGreaterThan(z.W)
    expect(f.current).toBe('forward')
    expect(r.current).toBe('reverse-small')
  })
})
