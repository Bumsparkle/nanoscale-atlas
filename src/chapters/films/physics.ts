/**
 * Chapters 4 and 5 physics (Topics 5 and 6), pure and unit-tested: the CVD
 * kinetic model, vacuum, MBE flux and RHEED, lattice mismatch, step
 * coverage and the epi autodoping profile. Beyond-the-lecture constants are
 * named with their source.
 */
import { erfc, kT, DIFFUSERS, diffusivity } from '../growth/physics'

/* ───────────── CVD kinetics (Topic 5 slides 15–22) ───────────── */

/** Si atoms per cm³ incorporated in the film (slide 18) */
export const N1 = 5.0e22
/** activation energy of the surface reaction for single-crystal Si (slide 19) */
export const EA_SI = 1.6
/**
 * k0 and hG at one atmosphere are illustrative values chosen so the
 * crossover sits near 1000 °C, as on slide 20's plots (beyond the lecture:
 * of the order given in Plummer, Deal & Griffin, ch. 9).
 */
export const K0 = 1e7 // cm/s
export const HG_ATM = 3 // cm/s
/**
 * hG = DG/δS with DG ∝ 1/P and δS growing ~7× from 760 to 1 torr
 * (slide 22), i.e. δS ∝ P^(−log 7/log 760): hG rises ~100× at 1 torr.
 */
const DELTA_EXP = Math.log(7) / Math.log(760)
export const hG = (torr: number) => HG_ATM * Math.pow(760 / torr, 1 - DELTA_EXP)
export const kS = (celsius: number, Ea = EA_SI) => K0 * Math.exp(-Ea / kT(celsius))
/** total gas molecules per cm³ */
export const CT = (torr: number, celsius: number) => (torr * 133.322) / (1.380649e-23 * (celsius + 273.15)) * 1e-6

export type CvdRegime = 'reaction' | 'mixed' | 'transport'
/** growth velocity (cm/s) from slide 18: v = kS·hG/(kS + hG)·CT·Y/N1 */
export function cvdRate(celsius: number, torr: number, Y: number) {
  const ks = kS(celsius)
  const hg = hG(torr)
  const v = ((ks * hg) / (ks + hg)) * (CT(torr, celsius) * Y) / N1
  const ratio = ks / hg
  const regime: CvdRegime = ratio < 0.2 ? 'reaction' : ratio > 5 ? 'transport' : 'mixed'
  return { v, ks, hg, regime, nmPerMin: v * 1e7 * 60 }
}
/** steady-state surface concentration over gas concentration (slide 17) */
export const csOverCg = (ks: number, hg: number) => 1 / (1 + ks / hg)

/* ───────────── vacuum (Topic 5 slide 40, Topic 6 slide 18) ───────────── */

/** molecules per m³ at room temperature */
export const gasDensity = (torr: number) => 3.2e22 * torr
/** mean free path (m): 5 × 10⁻⁵ m at 1 Torr, inversely proportional to pressure (the slide table) */
export const meanFreePath = (torr: number) => 5e-5 / torr
/** time to form a monolayer (s), assuming every molecule sticks: 10⁻⁶ s at 1 Torr */
export const monolayerTime = (torr: number) => 1e-6 / torr
export function vacuumClass(torr: number) {
  if (torr > 100) return 'atmospheric'
  if (torr > 1e-2) return 'low'
  if (torr > 1e-5) return 'medium'
  if (torr > 1e-8) return 'high'
  return 'ultra-high'
}

/* ───────────── MBE (Topic 6 slides 17–25) ───────────── */

/** impingement rate φ = 2.64 × 10²⁰ P/√(MT), molecules cm⁻² s⁻¹, P in Pa (slide 23) */
export const flux = (pa: number, M: number, T: number) => (2.64e20 * pa) / Math.sqrt(M * T)
/** the exact form P(2πmkT)^−½, for the test */
export const fluxExact = (pa: number, M: number, T: number) => (pa / Math.sqrt(2 * Math.PI * M * 1.66054e-27 * 1.380649e-23 * T)) * 1e-4
/** GaAs (001): one monolayer is a/2 = 0.2827 nm, 6.26 × 10¹⁴ Ga sites per cm² (beyond the lecture: a = 0.5653 nm) */
export const GAAS_ML_NM = 0.5653 / 2
export const GAAS_SITES = 2 / Math.pow(0.5653e-7, 2)
/** growth rate in monolayers per second when every Ga atom arriving is incorporated */
export const mlPerSecond = (gaFlux: number) => gaFlux / GAAS_SITES
/** one RHEED oscillation is one monolayer (slide 25) */
export const rateFromRheed = (periodS: number, mlNm = GAAS_ML_NM) => ({ mlPerS: 1 / periodS, umPerH: (mlNm * 1e-3 * 3600) / periodS })
/** RHEED specular intensity against coverage θ (monolayers): peaks at whole layers, dips at half, damping slowly */
export const rheedIntensity = (theta: number) => 0.55 + 0.45 * Math.cos(2 * Math.PI * theta) * Math.exp(-theta / 25)

/* ───────────── lattice matching (Topic 6 slides 4–6, 15) ───────────── */

export interface Semi {
  id: string
  a: number // Å
  gap: number // eV
  direct: boolean
}
/** values from slide 6's chart, refined to the usual tabulated ones (beyond the lecture: Vurgaftman et al., J. Appl. Phys. 89, 5815) */
export const SEMIS: Semi[] = [
  { id: 'Si', a: 5.431, gap: 1.12, direct: false },
  { id: 'Ge', a: 5.658, gap: 0.66, direct: false },
  { id: 'GaP', a: 5.451, gap: 2.26, direct: false },
  { id: 'AlP', a: 5.467, gap: 2.45, direct: false },
  { id: 'GaAs', a: 5.653, gap: 1.42, direct: true },
  { id: 'AlAs', a: 5.661, gap: 2.16, direct: false },
  { id: 'InP', a: 5.869, gap: 1.34, direct: true },
  { id: 'InAs', a: 6.058, gap: 0.36, direct: true },
  { id: 'GaSb', a: 6.096, gap: 0.73, direct: true },
  { id: 'AlSb', a: 6.136, gap: 1.62, direct: false },
  { id: 'InSb', a: 6.479, gap: 0.17, direct: true },
]
export const SEMI_BY_ID = Object.fromEntries(SEMIS.map((s) => [s.id, s])) as Record<string, Semi>
/** lattice mismatch f = (a_film − a_sub)/a_sub */
export const mismatch = (aFilm: number, aSub: number) => (aFilm - aSub) / aSub
/** Vegard's law for an alloy AₓB₁₋ₓ */
export const vegard = (x: number, aA: number, aB: number) => x * aA + (1 - x) * aB
/**
 * Rough critical thickness hc ≈ a_sub/(2|f|) (beyond the lecture: the simple
 * Frank–van der Merwe estimate; real values depend on the model). Below it
 * the film is pseudomorphic; above, it relaxes through misfit dislocations
 * spaced about a/|f| apart.
 */
export function strainState(aFilm: number, aSub: number, thicknessNm: number) {
  const f = mismatch(aFilm, aSub)
  const hc = Math.abs(f) < 1e-6 ? Infinity : (aSub / 10) / (2 * Math.abs(f))
  const relaxed = thicknessNm > hc
  return { f, hcNm: hc, mode: Math.abs(f) < 1e-4 ? 'matched' : relaxed ? 'metamorphic' : 'pseudomorphic', dislocationSpacingNm: Math.abs(f) < 1e-6 ? Infinity : aSub / 10 / Math.abs(f) } as const
}

/* ───────────── step coverage (Topic 5 slides 2, 42, 49) ───────────── */

export type CoverageMethod = 'cvd' | 'sputter' | 'evaporation'
/**
 * Relative film thickness (top surface = 1) on the bottom, the sidewall
 * (half depth) and the bottom corner of a trench of aspect ratio d/w.
 * Evaporation: line of sight from a point source, so no sidewall.
 * Sputtering: a cosine spread from a large source, so each point sees only
 * the part of the sky its opening allows (view factor), with overhang.
 * CVD: reactants that do not stick (1 − Sc) bounce around and coat the
 * whole trench; a sticking coefficient Sc → 0 gives conformal films.
 * Illustrative geometry, not a feature-scale simulator.
 */
export function stepCoverage(method: CoverageMethod, aspect: number, Sc = 1) {
  const view = (depthOverWidth: number) => Math.sin(Math.atan(1 / (2 * Math.max(depthOverWidth, 1e-6)))) // bottom centre: half-angle seen through the opening
  const sideView = (depthOverWidth: number) => 0.5 * (1 - Math.cos(Math.atan(1 / Math.max(depthOverWidth, 1e-6))))
  if (method === 'evaporation') return { top: 1, side: 0, bottom: 1, overhang: 0 }
  if (method === 'sputter') return { top: 1, side: sideView(aspect / 2), bottom: view(aspect), overhang: Math.min(0.6, 0.25 * aspect) }
  // CVD: direct part scales with Sc, the re-emitted part is spread uniformly
  const s = Math.min(1, Math.max(0, Sc))
  const mix = (direct: number) => s * direct + (1 - s) * Math.pow(0.97, aspect)
  return { top: 1, side: mix(sideView(aspect / 2)), bottom: mix(view(aspect)), overhang: s * 0.1 * aspect }
}

/* ───────────── Si epitaxy and autodoping (Topic 6 slides 12–14) ───────────── */

export interface EpiOpts {
  celsius: number
  /** growth rate, µm/min */
  rate: number
  /** epi thickness, µm */
  thickness: number
  substrate: 'As' | 'Sb' | 'B'
  /** substrate doping (cm⁻³) and intended epi doping */
  cSub: number
  cEpi: number
  backsideSeal: boolean
  reducedPressure: boolean
}
/**
 * Dopant concentration against depth x (µm, 0 at the interface, positive
 * into the epi layer): solid-state out-diffusion of the substrate dopant
 * (an erfc, slide 21 of Topic 5) plus a gas-phase autodoping tail
 * C*·exp(−x/L) and the intentional level. The tail scale is illustrative.
 */
export function epiProfile(o: EpiOpts) {
  const d = DIFFUSERS[o.substrate === 'B' ? 'B' : o.substrate]
  const t = (o.thickness / o.rate) * 60 // s
  const D = diffusivity(d.D0, d.Q, o.celsius)
  const L2 = 2 * Math.sqrt(D * t) * 1e4 // µm
  // gas-phase autodoping: dopant evaporated from the substrate (back and front) is reincorporated
  let cStar = o.cSub * 1e-3 * (o.backsideSeal ? 0.25 : 1) * (o.reducedPressure ? 0.2 : 1)
  if (o.substrate === 'B' && o.celsius < 1000) cStar *= 0.4 // lower T reduces boron autodoping, not As
  const L = 0.08 + 0.05 * (1 / o.rate) // µm: slower growth leaves a longer tail
  const at = (x: number) => (x < 0 ? o.cSub : o.cEpi + 0.5 * o.cSub * erfc(x / Math.max(L2, 1e-6)) + cStar * Math.exp(-x / L))
  // transition width: depth where the profile falls to 2× the intended level
  let w = 0
  for (let x = 0; x <= o.thickness; x += o.thickness / 2000) if (at(x) > 2 * o.cEpi) w = x
  return { at, D, outDiffusionUm: L2, tailUm: L, transitionUm: w, cStar }
}
