import { describe, expect, it } from 'vitest'
import {
  csOverCg, cvdRate, epiProfile, flux, fluxExact, gasDensity, hG, kS, meanFreePath, mismatch, mlPerSecond, monolayerTime, rateFromRheed,
  rheedIntensity, SEMI_BY_ID, stepCoverage, strainState, vacuumClass, vegard,
} from './physics'

describe('CVD kinetics (Topic 5 slides 15–22)', () => {
  it('reaction-limited when cool, transport-limited when hot', () => {
    expect(cvdRate(700, 760, 0.01).regime).toBe('reaction')
    expect(cvdRate(1200, 760, 0.01).regime).toBe('transport')
  })
  it('reaction-limited growth is very temperature sensitive (Ea = 1.6 eV); transport-limited barely', () => {
    const r = (T: number) => cvdRate(T, 760, 0.01).v
    expect(r(750) / r(700)).toBeGreaterThan(2.2)
    expect(r(1250) / r(1200)).toBeLessThan(1.1)
  })
  it('low pressure raises hG about 100×, so the reaction regime extends to higher T', () => {
    expect(hG(1) / hG(760)).toBeGreaterThan(80)
    expect(hG(1) / hG(760)).toBeLessThan(130)
    expect(cvdRate(1000, 1, 1).regime).not.toBe('transport')
  })
  it('steady state: CS = CG/(1 + kS/hG), and v matches the smaller of the two in the limits', () => {
    expect(csOverCg(1, 1)).toBeCloseTo(0.5)
    const lo = cvdRate(650, 760, 0.01)
    expect(lo.ks).toBe(kS(650))
    expect(lo.ks).toBeLessThan(lo.hg)
  })
  it('APCVD Si at 1100 °C grows at the order of µm/min', () => {
    const r = cvdRate(1100, 760, 0.01)
    expect(r.nmPerMin).toBeGreaterThan(200)
    expect(r.nmPerMin).toBeLessThan(5000)
  })
})

describe('vacuum table (Topic 5 slide 40)', () => {
  it('reproduces the rows', () => {
    expect(meanFreePath(1e-6)).toBeCloseTo(50)
    expect(meanFreePath(1e-10)).toBeCloseTo(5e5, -3)
    expect(monolayerTime(1e-6)).toBeCloseTo(1)
    expect(monolayerTime(1e-10)).toBeCloseTo(1e4, -1)
    expect(gasDensity(760)).toBeGreaterThan(2e25)
    expect(vacuumClass(1e-10)).toBe('ultra-high')
    expect(vacuumClass(760)).toBe('atmospheric')
  })
})

describe('MBE (Topic 6 slides 23–25)', () => {
  it('2.64 × 10²⁰ P/√(MT) is P(2πmkT)^−½ in cm⁻² s⁻¹', () => {
    expect(flux(1e-4, 69.72, 1200) / fluxExact(1e-4, 69.72, 1200)).toBeCloseTo(1, 2)
  })
  it('one RHEED period is one monolayer', () => {
    const r = rateFromRheed(1)
    expect(r.mlPerS).toBe(1)
    expect(r.umPerH).toBeCloseTo(1.02, 2)
    expect(rheedIntensity(0)).toBeGreaterThan(rheedIntensity(0.5))
    expect(rheedIntensity(1)).toBeGreaterThan(rheedIntensity(1.5))
  })
  it('a typical Ga beam gives roughly a monolayer a second', () => {
    const ml = mlPerSecond(flux(5e-4, 69.72, 1200))
    expect(ml).toBeGreaterThan(0.2)
    expect(ml).toBeLessThan(3)
  })
})

describe('lattice matching (Topic 6 slides 5–6)', () => {
  it('AlAs on GaAs is nearly matched; InAs on GaAs is 7 % off', () => {
    expect(Math.abs(mismatch(SEMI_BY_ID.AlAs.a, SEMI_BY_ID.GaAs.a))).toBeLessThan(0.002)
    expect(mismatch(SEMI_BY_ID.InAs.a, SEMI_BY_ID.GaAs.a)).toBeCloseTo(0.0716, 3)
  })
  it('In0.53Ga0.47As is lattice-matched to InP (Vegard)', () => {
    expect(Math.abs(mismatch(vegard(0.53, SEMI_BY_ID.InAs.a, SEMI_BY_ID.GaAs.a), SEMI_BY_ID.InP.a))).toBeLessThan(0.001)
  })
  it('thin strained films are pseudomorphic, thick ones relax', () => {
    expect(strainState(SEMI_BY_ID.Ge.a, SEMI_BY_ID.Si.a, 1).mode).toBe('pseudomorphic')
    expect(strainState(SEMI_BY_ID.Ge.a, SEMI_BY_ID.Si.a, 100).mode).toBe('metamorphic')
    expect(strainState(SEMI_BY_ID.GaAs.a, SEMI_BY_ID.GaAs.a, 1000).mode).toBe('matched')
  })
})

describe('step coverage (Topic 5 slides 42, 49)', () => {
  it('evaporation leaves the sidewall bare; CVD with low sticking is conformal; sputtering is in between with overhang', () => {
    expect(stepCoverage('evaporation', 2).side).toBe(0)
    const cvd = stepCoverage('cvd', 2, 0.01)
    expect(cvd.side).toBeGreaterThan(0.85)
    expect(cvd.bottom).toBeGreaterThan(0.85)
    const sp = stepCoverage('sputter', 2)
    expect(sp.side).toBeGreaterThan(0)
    expect(sp.side).toBeLessThan(cvd.side)
    expect(sp.overhang).toBeGreaterThan(0)
  })
  it('deeper trenches get less into the bottom', () => {
    expect(stepCoverage('sputter', 4).bottom).toBeLessThan(stepCoverage('sputter', 1).bottom)
  })
})

describe('epi autodoping (Topic 6 slides 12–14)', () => {
  const base = { celsius: 1100, rate: 1, thickness: 5, substrate: 'As' as const, cSub: 1e19, cEpi: 1e15, backsideSeal: false, reducedPressure: false }
  it('the profile steps from the substrate to the epi level', () => {
    const p = epiProfile(base)
    expect(p.at(-0.5)).toBe(1e19)
    expect(p.at(4.9)).toBeLessThan(2e15)
  })
  it('sealing the backside, reduced pressure and faster growth all sharpen the transition', () => {
    const w = epiProfile(base).transitionUm
    expect(epiProfile({ ...base, backsideSeal: true }).transitionUm).toBeLessThan(w)
    expect(epiProfile({ ...base, reducedPressure: true }).transitionUm).toBeLessThan(w)
    expect(epiProfile({ ...base, rate: 3 }).transitionUm).toBeLessThan(w)
  })
})
