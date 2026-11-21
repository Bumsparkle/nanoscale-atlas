import { describe, expect, it } from 'vitest'
import { createWafer, signature, stackAt } from './model'
import { anneal, deposit, develop, diffuse, epitaxy, etch, evaporate, expose, implant, oxidise, spinResist, strip, thermalOxide } from './ops'
import type { Mask, Model, Op } from './types'

/**
 * The Topic 3 upgrades to the process simulator. Each is opt-in, so the
 * Topic 2 recipe (and its tests) are unchanged.
 */
const grid = { x0: 0, y0: 0, nx: 40, ny: 1, d: 1 }
const run = (m: Model, ...ops: Op[]) => ops.reduce((a, op) => op(a, 1), m)
const at = (m: Model, x: number) => stackAt(m, x + 0.5, 0.5)
const sig = (m: Model, x: number) => signature(at(m, x))
const window: Mask = { id: 'w', name: 'window', slide: 0, rects: [{ x0: 15, y0: 0, x1: 25, y1: 1 }] }

describe('thermal oxidation consumes silicon (slide 27)', () => {
  const w = createWafer(grid, 3000)
  it('1 µm of SiO₂ uses 0.44 µm of Si: the interface moves down, the surface up', () => {
    const m = run(w, thermalOxide(1000))
    const c = at(m, 3)
    expect(signature(c)).toBe('si:p/ox')
    expect(c[0].z1).toBeCloseTo(-440)
    expect(c[1].z0).toBeCloseTo(-440)
    expect(c[1].z1).toBeCloseTo(560)
    expect(c[1].z1 - c[1].z0).toBeCloseTo(1000)
  })
  it('regrowth through existing oxide keeps consuming silicon', () => {
    const m = run(w, thermalOxide(100), thermalOxide((xi) => xi + 200))
    const c = at(m, 3)
    expect(c[1].z1 - c[1].z0).toBeCloseTo(300)
    expect(c[0].z1).toBeCloseTo(-0.44 * 300)
  })
  it('does not grow on resist-covered silicon, and is pure', () => {
    const before = JSON.stringify(w)
    const m = run(w, spinResist(500), thermalOxide(200))
    expect(sig(m, 3)).toBe('si:p/resist')
    expect(JSON.stringify(w)).toBe(before)
  })
  it('the old conformal oxidise is unchanged (Topic 2)', () => {
    const c = at(run(w, oxidise('ox', 200)), 3)
    expect(c[0].z1).toBe(0)
    expect(c[1].z1).toBe(200)
  })
  it('is continuous in progress', () => {
    const half = thermalOxide(1000)(w, 0.5)
    expect(at(half, 3)[1].z1 - at(half, 3)[1].z0).toBeCloseTo(500)
  })
})

describe('resist polarity (slide 28)', () => {
  const w = run(createWafer(grid, 1000), oxidise('ox', 200), spinResist(500), expose(window))
  it('positive: the exposed window dissolves', () => {
    const m = run(w, develop())
    expect(sig(m, 20)).toBe('si:p/ox')
    expect(sig(m, 5)).toBe('si:p/ox/resist')
  })
  it('negative: the unexposed resist dissolves and the exposed window stays', () => {
    const m = run(w, develop({ tone: 'negative' }))
    expect(sig(m, 20)).toBe('si:p/ox/resist:exposed')
    expect(sig(m, 5)).toBe('si:p/ox')
  })
  it('after the etch the same mask gives opposite oxide patterns', () => {
    const pos = run(w, develop(), etch('ox'), strip('resist'))
    const neg = run(w, develop({ tone: 'negative' }), etch('ox'), strip('resist'))
    expect([sig(pos, 20), sig(pos, 5)]).toEqual(['si:p', 'si:p/ox'])
    expect([sig(neg, 20), sig(neg, 5)]).toEqual(['si:p/ox', 'si:p'])
  })
})

describe('isotropic vs anisotropic etch (slide 29)', () => {
  // 50 nm columns, a 500 nm oxide, a resist line opened over columns 15–24
  const base = run(createWafer(grid, 1000), deposit('ox', 500), spinResist(400), expose(window), develop())
  const iso = run(base, etch('ox', { isotropic: true, pitchNm: 50 }))
  const ani = run(base, etch('ox'))
  const oxIn = (m: Model, x: number) => at(m, x).filter((iv) => iv.mat === 'ox').reduce((s, iv) => s + iv.z1 - iv.z0, 0)
  it('both clear the opening', () => {
    expect(oxIn(iso, 20)).toBeCloseTo(0)
    expect(oxIn(ani, 20)).toBeCloseTo(0)
  })
  it('anisotropic leaves vertical walls: nothing under the mask is touched', () => {
    expect(oxIn(ani, 14)).toBeCloseTo(500)
  })
  it('isotropic undercuts the mask by about the film thickness, along a quarter circle', () => {
    expect(oxIn(iso, 14)).toBeLessThan(5) // 25 nm from the edge: almost all gone
    const x = 8 * 50 + 25 // column 6 is 425 nm from the window edge
    expect(oxIn(iso, 6)).toBeCloseTo(500 - Math.sqrt(500 * 500 - x * x), 0)
    expect(oxIn(iso, 4)).toBeCloseTo(500) // beyond 500 nm: untouched
    // the resist still sits on top: an overhang above the undercut
    expect(at(iso, 14).some((iv) => iv.mat === 'resist')).toBe(true)
  })
  it('undercut matters for narrow lines, not wide ones', () => {
    const narrow: Mask = { id: 'n', name: 'line', slide: 0, rects: [{ x0: 18, y0: 0, x1: 22, y1: 1 }] }
    const line = run(createWafer(grid, 1000), deposit('ox', 500), spinResist(400), expose(narrow, { keep: true }), develop(), etch('ox', { isotropic: true, pitchNm: 50 }))
    // a 200 nm line under a 500 nm etch is almost cut through (slide 29 b)
    expect(oxIn(line, 20)).toBeLessThan(25)
  })
})

describe('diffusion spreads under the mask edge (slide 30)', () => {
  const m = run(createWafer(grid, 3000), oxidise('ox', 300), spinResist(500), expose(window), develop(), etch('ox'), strip('resist'), diffuse('n+', 1000, { pitchNm: 100 }))
  it('the window is doped to xj', () => {
    const c = at(m, 20)
    expect(signature(c)).toBe('si:p/si:n+')
    expect(c[1].z0).toBeCloseTo(-1000)
  })
  it('the doping reaches under the oxide, shallower with distance', () => {
    const d1 = at(m, 14).find((iv) => iv.dop === 'n+')
    const d2 = at(m, 9).find((iv) => iv.dop === 'n+')
    expect(d1).toBeTruthy()
    expect(d2).toBeTruthy()
    expect(-d1!.z0).toBeGreaterThan(-d2!.z0)
    expect(at(m, 2).some((iv) => iv.dop === 'n+')).toBe(false)
  })
})

describe('implantation damages the crystal; the anneal restores it (slide 31)', () => {
  const w = createWafer(grid, 1000)
  it('implant marks damage, anneal clears it and keeps the doping', () => {
    const imp = run(w, implant('n+', 100, { damage: true }))
    expect(at(imp, 3).some((iv) => iv.dmg)).toBe(true)
    const an = run(imp, anneal())
    expect(at(an, 3).some((iv) => iv.dmg)).toBe(false)
    expect(sig(an, 3)).toBe('si:p/si:n+')
  })
  it('without the damage flag (Topic 2), nothing changes', () => {
    expect(at(run(w, implant('n+', 100)), 3).some((iv) => iv.dmg)).toBe(false)
  })
})

describe('epitaxy and evaporation (slides 25, 26, 32)', () => {
  it('epitaxy continues the silicon crystal, only on exposed silicon', () => {
    const m = run(createWafer(grid, 1000, 'p+'), oxidise('ox', 100), spinResist(400), expose(window), develop(), etch('ox'), strip('resist'), epitaxy(2000, 'p'))
    expect(sig(m, 20)).toBe('si:p+/si:p')
    expect(at(m, 20).find((iv) => iv.epi)?.z1).toBeCloseTo(2000)
    expect(sig(m, 3)).toBe('si:p+/ox')
  })
  it('evaporation lays a metal film on every top surface', () => {
    const m = run(createWafer(grid, 1000), evaporate('al', 300))
    expect(sig(m, 3)).toBe('si:p/al')
  })
})
