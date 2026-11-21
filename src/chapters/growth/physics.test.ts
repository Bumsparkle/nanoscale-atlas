import { describe, expect, it } from 'vitest'
import {
  bandsAt, cI, csOverC0, cV, dealGrove, diffusivity, DIFFUSERS, distanceToPlane, driveIn, erfc, erfcInv, junctionDepth, K0_OF,
  meltDopantLeft, millerFromIntercepts, planeInCube, predep, projectedRange, sheetDensity, sheetDensityCm2, SI_ATOMS, SPACING,
} from './physics'

describe('segregation: Cs = k0·C0·(1 − M/M0)^(k0−1) (slides 17–19)', () => {
  it('starts at k0·C0', () => {
    for (const k0 of [0.8, 0.35, 0.023, 1.25]) expect(csOverC0(k0, 0)).toBeCloseTo(k0, 12)
  })
  it('rises along the ingot for k0 < 1 and falls for k0 > 1', () => {
    expect(csOverC0(0.35, 0.5)).toBeGreaterThan(csOverC0(0.35, 0.1))
    expect(csOverC0(1.25, 0.5)).toBeLessThan(csOverC0(1.25, 0.1))
    expect(csOverC0(1, 0.7)).toBeCloseTo(1, 12)
  })
  it('matches the slide 19 graph', () => {
    expect(csOverC0(K0_OF.B, 0)).toBeCloseTo(0.8)
    expect(csOverC0(K0_OF.B, 0.9)).toBeCloseTo(0.8 * Math.pow(0.1, -0.2), 6) // ≈ 1.27
    expect(csOverC0(K0_OF.P, 0.5)).toBeCloseTo(0.35 * Math.pow(0.5, -0.65), 6) // ≈ 0.55
    expect(csOverC0(K0_OF.Sb, 0)).toBeCloseTo(0.023)
  })
  it('conserves dopant: what left the melt is in the crystal', () => {
    const k0 = 0.35
    const N = 20000
    let inCrystal = 0
    for (let i = 0; i < N; i++) inCrystal += csOverC0(k0, (i + 0.5) / N * 0.8) * (0.8 / N)
    expect(inCrystal + meltDopantLeft(k0, 0.8)).toBeCloseTo(1, 3)
  })
})

describe('point defects (slide 22)', () => {
  it('≈ 0 at room temperature', () => {
    expect(cI(25)).toBeLessThan(1e-30)
    expect(cV(25)).toBeLessThan(1e-15)
  })
  it('10¹²–10¹⁴ cm⁻³ at 1000 °C', () => {
    for (const c of [cI(1000), cV(1000)]) {
      expect(c).toBeGreaterThan(1e11)
      expect(c).toBeLessThan(1e14)
    }
    expect(cI(1000)).toBeCloseTo(1e27 * Math.exp(-3.8 / (8.617333e-5 * 1273.15)), -9)
  })
  it('CI ≠ CV and both rise steeply with temperature', () => {
    expect(cV(1000) / cI(1000)).toBeGreaterThan(10)
    expect(cI(1100) / cI(1000)).toBeGreaterThan(5)
  })
  it('silicon has 5 × 10²² atoms per cm³', () => expect(SI_ATOMS).toBeCloseTo(4.99e22, -20))
})

describe('energy bands against spacing (slide 9)', () => {
  it('atomic levels at d, broadening below c, merged at b, a gap at a', () => {
    expect(bandsAt(SPACING.d).regime).toBe('isolated')
    expect(bandsAt((SPACING.b + SPACING.c) / 2).regime).toBe('splitting')
    expect(bandsAt(SPACING.b).regime).toBe('merged')
    const a = bandsAt(SPACING.a)
    expect(a.regime).toBe('gap')
    expect(a.gap).toBeGreaterThan(0.3)
    expect(a.lowerStates).toBe(4)
    expect(a.upperStates).toBe(4)
    expect(bandsAt(SPACING.b).lowerStates + bandsAt(SPACING.b).upperStates).toBe(8)
  })
  it('the bands widen continuously as atoms approach', () => {
    const w = (r: number) => bandsAt(r).lower[1] - bandsAt(r).lower[0]
    expect(w(1.6)).toBeGreaterThan(w(1.8))
  })
})

describe('Miller indices (slide 6)', () => {
  it('reciprocals of the intercepts, cleared to whole numbers', () => {
    expect(millerFromIntercepts(1, Infinity, Infinity)).toEqual([1, 0, 0])
    expect(millerFromIntercepts(1, 1, Infinity)).toEqual([1, 1, 0])
    expect(millerFromIntercepts(1, 1, 1)).toEqual([1, 1, 1])
    expect(millerFromIntercepts(1, 2, 3)).toEqual([6, 3, 2])
    expect(millerFromIntercepts(0.5, 1, Infinity)).toEqual([2, 1, 0])
    expect(millerFromIntercepts(2, 2, 2)).toEqual([1, 1, 1])
    expect(millerFromIntercepts(-1, 1, Infinity)).toEqual([-1, 1, 0])
  })
  it('sheet densities of diamond Si: (110) > (111) > (100)', () => {
    expect(sheetDensity(1, 0, 0)).toBeCloseTo(2, 9)
    expect(sheetDensity(1, 1, 1)).toBeCloseTo(4 / Math.sqrt(3), 9)
    expect(sheetDensity(1, 1, 0)).toBeCloseTo(4 / Math.SQRT2, 9)
    expect(sheetDensity(2, 0, 0)).toBeCloseTo(2, 9) // same family as (100)
    expect(sheetDensityCm2(1, 0, 0)).toBeCloseTo(6.78e14, -12)
    expect(sheetDensityCm2(1, 1, 1)).toBeCloseTo(7.83e14, -12)
  })
  it('draws the plane through its intercepts', () => {
    expect(planeInCube(1, 0, 0)).toHaveLength(4)
    const t = planeInCube(1, 1, 1)
    expect(t).toHaveLength(3)
    for (const p of t) expect(distanceToPlane(1, 1, 1, p)).toBeCloseTo(0, 9)
    expect(planeInCube(1, 1, 0)).toHaveLength(4)
    expect(planeInCube(-1, 1, 1).length).toBe(3)
  })
})

describe('Deal–Grove oxidation (slide 27)', () => {
  it('wet is much faster than dry: thick vs thin oxides', () => {
    const dry = dealGrove(1000, 1, 'dry').x
    const wet = dealGrove(1000, 1, 'wet').x
    expect(dry).toBeGreaterThan(0.03)
    expect(dry).toBeLessThan(0.08)
    expect(wet).toBeGreaterThan(0.3)
    expect(wet).toBeLessThan(0.5)
  })
  it('linear at first, then parabolic: the rate slows as the oxide thickens', () => {
    const r1 = dealGrove(1100, 0.1, 'wet').x / 0.1
    const r2 = (dealGrove(1100, 10, 'wet').x - dealGrove(1100, 9.9, 'wet').x) / 0.1
    expect(r2).toBeLessThan(r1 / 3)
    const x4 = dealGrove(1100, 40, 'wet').x
    const x1 = dealGrove(1100, 10, 'wet').x
    expect(x4 / x1).toBeGreaterThan(1.7) // ≈ 2 when parabolic (√4)
    expect(x4 / x1).toBeLessThan(2.3)
  })
})

describe('diffusion (slide 30)', () => {
  it('D = D0·exp(−Q/kT)', () => {
    const { D0, Q } = DIFFUSERS.B
    expect(diffusivity(D0, Q, 1100)).toBeCloseTo(0.76 * Math.exp(-3.46 / (8.617333e-5 * 1373.15)), 20)
    expect(diffusivity(D0, Q, 1100)).toBeGreaterThan(1e-14)
    expect(diffusivity(D0, Q, 1100)).toBeLessThan(1e-12)
  })
  it('erfc and its inverse', () => {
    expect(erfc(0)).toBeCloseTo(1, 6)
    expect(erfc(1)).toBeCloseTo(0.1572992, 6)
    expect(erfcInv(erfc(1.3))).toBeCloseTo(1.3, 5)
  })
  it('drive-in conserves the predeposited dose and deepens the junction', () => {
    const D = diffusivity(DIFFUSERS.B.D0, DIFFUSERS.B.Q, 950)
    const pre = predep(3e20, D, 1800)
    const D2 = diffusivity(DIFFUSERS.B.D0, DIFFUSERS.B.Q, 1100)
    const drv = driveIn(pre.dose, D2, 3600)
    let dose = 0
    for (let x = 0; x < 10; x += 0.0005) dose += drv.at(x + 0.00025) * 0.0005e-4
    expect(dose / pre.dose).toBeCloseTo(1, 2)
    expect(junctionDepth(drv.at, 1e16)).toBeGreaterThan(junctionDepth(pre.at, 1e16))
  })
})

describe('ion implantation range', () => {
  it('deeper with energy, shallower for heavier ions', () => {
    expect(projectedRange('B', 100).Rp).toBeGreaterThan(projectedRange('B', 10).Rp)
    expect(projectedRange('As', 100).Rp).toBeLessThan(projectedRange('P', 100).Rp)
    expect(projectedRange('P', 100).Rp).toBeLessThan(projectedRange('B', 100).Rp)
  })
})

import { zoneRefine } from './physics'
describe('float-zone refining (slide 20)', () => {
  it('one pass matches C/C0 = 1 − (1 − k)·exp(−k·x/l) away from the end', () => {
    const k = 0.35
    const rod = zoneRefine(k, 1, 400, 10)
    for (const i of [0, 10, 40, 100]) expect(rod[i]).toBeCloseTo(1 - (1 - k) * Math.exp((-k * (i + 0.5)) / 10), 1)
  })
  it('conserves the impurity and refines further with every pass', () => {
    const one = zoneRefine(0.35, 1)
    const three = zoneRefine(0.35, 3)
    expect(one.reduce((a, b) => a + b, 0)).toBeCloseTo(120, 6)
    expect(three.reduce((a, b) => a + b, 0)).toBeCloseTo(120, 6)
    expect(three[5]).toBeLessThan(one[5])
    expect(three[119]).toBeGreaterThan(one[119])
  })
})
