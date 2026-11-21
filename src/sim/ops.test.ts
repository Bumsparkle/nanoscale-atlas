import { describe, expect, it } from 'vitest'
import { createWafer, signature, stackAt } from './model'
import { mesh } from './mesher'
import { deposit, develop, etch, expose, implant, oxidise, spinResist, strip } from './ops'
import type { Mask, Model } from './types'
import { inverterProcess } from '../chapters/cmos/recipe'
import { MESH_OPTS } from '../chapters/cmos/display'

const grid = { x0: 0, y0: 0, nx: 10, ny: 2, d: 1 }
const half: Mask = { id: 'h', name: 'half', slide: 0, rects: [{ x0: 5, y0: 0, x1: 10, y1: 2 }] }
const run = (m: Model, ...ops: ((m: Model, p: number) => Model)[]) => ops.reduce((a, op) => op(a, 1), m)
const L = (m: Model) => signature(stackAt(m, 1.5, 0.5))
const R = (m: Model) => signature(stackAt(m, 7.5, 0.5))

describe('ops', () => {
  const w = createWafer(grid, 1000)

  it('ops are pure: the input model is never mutated', () => {
    const before = JSON.stringify(w)
    run(w, oxidise('ox', 100), spinResist(500), expose(half), develop(), etch('ox'))
    expect(JSON.stringify(w)).toBe(before)
  })

  it('positive resist: exposed areas develop away, the rest remains', () => {
    const m = run(w, oxidise('ox', 100), spinResist(500), expose(half), develop())
    expect(L(m)).toBe('si:p/ox/resist')
    expect(R(m)).toBe('si:p/ox')
  })

  it('dark-field exposure keeps resist where the mask is drawn', () => {
    const m = run(w, spinResist(500), expose(half, { keep: true }), develop())
    expect(L(m)).toBe('si:p')
    expect(R(m)).toBe('si:p/resist')
  })

  it('etch is selective and stops on other materials', () => {
    const m = run(w, oxidise('ox', 100), deposit('poly', 50), etch('ox'))
    expect(L(m)).toBe('si:p/ox/poly') // ox is buried under poly: untouched
    const m2 = run(w, oxidise('ox', 100), etch('ox'), etch('ox'))
    expect(L(m2)).toBe('si:p') // etching bare Si for oxide does nothing more
  })

  it('implant is blocked by anything on the silicon', () => {
    const m = run(w, oxidise('ox', 100), spinResist(500), expose(half), develop(), etch('ox'), strip('resist'), implant('n+', 200))
    expect(L(m)).toBe('si:p/ox')
    expect(R(m)).toBe('si:p/si:n+')
  })

  it('a deeper implant of another type replaces doping only within its depth', () => {
    const m = run(w, implant('nwell', 600), implant('p+', 200))
    expect(L(m)).toBe('si:p/si:nwell/si:p+')
  })

  it('planar deposition levels the top surface', () => {
    const m = run(w, spinResist(100), expose(half), develop(), spinResist(300))
    const l = stackAt(m, 1.5, 0.5)
    const r = stackAt(m, 7.5, 0.5)
    expect(l[l.length - 1].z1).toBeCloseTo(r[r.length - 1].z1)
  })

  it('fractional progress interpolates thickness linearly', () => {
    const half1 = oxidise('ox', 100)(w, 0.5)
    expect(stackAt(half1, 1.5, 0.5)[1].z1).toBeCloseTo(50)
    const e = etch('ox')(oxidise('ox', 100)(w, 1), 0.25)
    expect(stackAt(e, 1.5, 0.5)[1].z1).toBeCloseTo(75)
  })
})

describe('performance budget for live re-meshing', () => {
  it('fractional step + mesh averages under 8 ms', () => {
    const P = inverterProcess()
    // warm-up pass (JIT), then best of three so a busy machine doesn't fail it
    const run = () => {
      const t0 = performance.now()
      for (let k = 0; k < P.length - 1; k++) mesh(P.at(k + 0.5), MESH_OPTS)
      return (performance.now() - t0) / (P.length - 1)
    }
    run()
    const avg = Math.min(run(), run(), run())
    expect(avg).toBeLessThan(8)
  })
})
