import { describe, expect, it } from 'vitest'
import { airy, airyRadius, besselJ1, blurSigmaNm, deBroglieNm, depthOfFocus, ELECTRON_MASS, fresnelCS, fresnelRegime, fresnelSlit, gratingImage, mtf, photonLambdaNm, PROTON_MASS, resolution, roadmapNode, twoPoints, wMin, type Optics } from './optics'
import { kanayaRangeNm, SI, simulate } from './ebeam'
import { processFor, printState } from '../cmos/recipe'
import { DEFAULT_LAYOUT } from '../cmos/layout'
import { signature, stackAt } from '../../sim/model'
import { aerialImage } from '../../sim/aerial'
import { fitFeature, printsOk } from './print'

describe('the slide formulas', () => {
  it('reproduce the worked example (slide 9)', () => {
    expect(resolution(0.75, 0.248, 0.6)).toBeCloseTo(0.31, 2)
    expect(depthOfFocus(0.5, 0.248, 0.6)).toBeCloseTo(0.344, 3)
  })
  it('Wmin ≈ 2 µm for g = 10 µm with the i-line (slide 14)', () => {
    expect(wMin(0.365, 10)).toBeCloseTo(1.91, 2)
    expect(fresnelRegime(0.365, 10, 2)).toBe('fresnel')
    expect(fresnelRegime(0.365, 0.2, 2)).toBe('contact')
    expect(fresnelRegime(0.365, 30, 2)).toBe('fraunhofer')
  })
  it('MTF and the roadmap rule', () => {
    expect(mtf(1, 0)).toBe(1)
    expect(mtf(0.6, 0.2)).toBeCloseTo(0.5)
    expect(roadmapNode(250, 6)).toBeCloseTo(122.5)
  })
  it('photon and particle wavelengths (slide 18)', () => {
    expect(photonLambdaNm(3.1)).toBeCloseTo(400, -1)
    expect(photonLambdaNm(2480)).toBeCloseTo(0.5, 2)
    expect(deBroglieNm(20e3, ELECTRON_MASS) * 10).toBeCloseTo(0.0859, 3)
    expect(deBroglieNm(100e3, PROTON_MASS) * 10).toBeCloseTo(9.05e-4, 5)
    // the slide's 0.62 Å is the photon relation applied to 20 keV
    expect(photonLambdaNm(20e3) * 10).toBeCloseTo(0.62, 2)
  })
})

describe('diffraction', () => {
  it('J₁ and the Airy pattern: first zero at Φ = 1.22λf/d', () => {
    expect(besselJ1(1)).toBeCloseTo(0.44005, 4)
    expect(besselJ1(10)).toBeCloseTo(0.04347, 4)
    expect(airy(0, 1)).toBe(1)
    expect(airy(1, 1)).toBeLessThan(1e-6)
    expect(airyRadius(0.5, 10, 5)).toBeCloseTo(1.22)
  })
  it('two points at the Rayleigh separation dip to ≈ 73.5 %', () => {
    const t = twoPoints(1)
    expect(t.dip).toBeCloseTo(0.735, 2)
    expect(twoPoints(0.4).dip).toBeGreaterThan(0.99)
  })
  it('Fresnel integrals', () => {
    const [c, s] = fresnelCS(1)
    expect(c).toBeCloseTo(0.7799, 3)
    expect(s).toBeCloseTo(0.4383, 3)
    expect(fresnelCS(5)[0]).toBeCloseTo(0.5636, 2)
  })
  it('a slit far wider than √(λg) prints with ringing; a narrow one spreads', () => {
    const xs = Array.from({ length: 81 }, (_, i) => -4 + i * 0.1)
    const wide = fresnelSlit(6, 10, 0.365, xs)
    expect(Math.max(...wide)).toBeGreaterThan(1.1) // ringing overshoots
    expect(wide[40]).toBeGreaterThan(0.6)
    const incoherent = fresnelSlit(6, 10, 0.365, xs, 0.05)
    expect(Math.max(...incoherent)).toBeLessThan(Math.max(...wide))
  })
})

describe('MTF of a grating by Abbe’s method (slides 10–12)', () => {
  const lam = 248, NA = 0.6
  it('is high for large features and falls to 0 below the cut-off', () => {
    expect(gratingImage(1500, lam, NA, 0).mtf).toBeGreaterThan(0.9)
    expect(gratingImage(150, lam, NA, 0).mtf).toBeLessThan(0.01) // p = 300 < λ/NA = 413 nm
  })
  it('more incoherent light: worse for larger features, better for very small ones (slide 12)', () => {
    expect(gratingImage(400, lam, NA, 0.9).mtf).toBeLessThan(gratingImage(400, lam, NA, 0).mtf)
    expect(gratingImage(150, lam, NA, 0.9).mtf).toBeGreaterThan(gratingImage(150, lam, NA, 0).mtf)
  })
})

describe('aerial-image exposure in the simulator', () => {
  const krf: Optics = { lambdaNm: 248, NA: 0.6, k1: 0.75, S: 0.6 }
  const gline: Optics = { lambdaNm: 436, NA: 0.28, k1: 0.8, S: 0.6 }
  it('an isolated dark line exactly R wide sits on the 0.5 threshold (incoherent)', () => {
    const R = resolution(krf.k1, krf.lambdaNm, krf.NA)
    // work in units of 10 nm so the raster stays small
    const u = 10
    const img = aerialImage([{ x0: -R / 2 / u, y0: -100, x1: R / 2 / u, y1: 100 }], { x0: -100, y0: -100, x1: 100, y1: 100 }, blurSigmaNm(krf) / u, 1, 4, true)
    expect(img.at(0, 0)).toBeCloseTo(0.5, 1)
  })
  it('the ideal mode is unchanged: no print settings means a perfect mask copy', () => {
    printState.set(null)
    expect(processFor(DEFAULT_LAYOUT)).toBe(processFor(DEFAULT_LAYOUT, null))
  })
  it('a KrF stepper prints the 0.6 µm inverter; a g-line contact-era tool cannot', () => {
    const gate = (P: ReturnType<typeof processFor>) => signature(stackAt(P.final(), 10, 6))
    const ideal = gate(processFor(DEFAULT_LAYOUT))
    expect(ideal).toContain('poly')
    expect(gate(processFor(DEFAULT_LAYOUT, { optics: krf, fNm: 600 }))).toBe(ideal)
    expect(gate(processFor(DEFAULT_LAYOUT, { optics: gline, fNm: 600 }))).not.toContain('poly')
    // shrink the design to the tool's limit instead: f = R prints again at the scaled layout
    const R = resolution(gline.k1, gline.lambdaNm, gline.NA)
    expect(gate(processFor(DEFAULT_LAYOUT, { optics: gline, fNm: Math.ceil(R / 100) * 100 }))).toContain('poly')
  })
})

describe('the layout printed by a tool (Topic 2 × Topic 7)', () => {
  const krf: Optics = { lambdaNm: 248, NA: 0.6, k1: 0.75, S: 0.6 }
  it('a 0.6 µm design prints with KrF but not with a coarse g-line tool', () => {
    expect(printsOk(DEFAULT_LAYOUT, krf, 600)).toBe(true)
    expect(printsOk(DEFAULT_LAYOUT, { lambdaNm: 436, NA: 0.28, k1: 0.8, S: 0.6 }, 600)).toBe(false)
  })
  it('the design that fits the tool shrinks with the wavelength, and sits at or above R', () => {
    const fits = (['g', 'i', 'krf', 'arf'] as const).map((id) => fitFeature(DEFAULT_LAYOUT, { ...krf, lambdaNm: { g: 436, i: 365, krf: 248, arf: 193 }[id] }))
    for (let i = 1; i < fits.length; i++) expect(fits[i]).toBeLessThan(fits[i - 1])
    expect(fits[2]).toBeGreaterThanOrEqual(resolution(0.75, 248, 0.6))
    expect(printsOk(DEFAULT_LAYOUT, krf, fits[2])).toBe(true)
    expect(printsOk(DEFAULT_LAYOUT, krf, fits[2] - 10)).toBe(false)
  })
})

describe('electron trajectories (slide 21)', () => {
  it('range grows with beam energy and some electrons backscatter', () => {
    const lo = simulate(10, 120, 500, 3)
    const hi = simulate(20, 120, 500, 3)
    expect(hi.maxDepthNm).toBeGreaterThan(lo.maxDepthNm * 1.8)
    expect(lo.backscatter).toBeGreaterThan(0.05)
    expect(lo.backscatter).toBeLessThan(0.4)
    expect(kanayaRangeNm(SI, 20)).toBeGreaterThan(kanayaRangeNm(SI, 10) * 3)
    expect(hi.maxDepthNm).toBeLessThan(kanayaRangeNm(SI, 20) * 1.3)
  })
})
