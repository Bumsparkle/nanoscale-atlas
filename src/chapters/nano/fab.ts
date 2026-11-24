/**
 * Chapter 7 (Topic 8 slides 15–22, 32–33): numbers for the fabrication
 * scenes. Each model is illustrative and says so where it is shown.
 */

/** slide 16: VLS growth stages */
export const VLS_STEPS = [
  { t: 'Catalyst deposition', p: 'a droplet seed on GaAs(111)B' },
  { t: 'Eutectic formation', p: 'Ga dissolves into the droplet: a liquid alloy' },
  { t: 'Supersaturation and nucleation', p: 'Ga and As supersaturate it; GaAs nucleates underneath' },
  { t: 'Growth', p: 'the wire grows up under the droplet, layer by layer' },
  { t: 'Tapering', p: 'growth on the side walls widens the base' },
]

/**
 * Colloidal CdSe dot transition energy (eV) for diameter d (nm), from the
 * Brus model: Eg + (ħ²π²/2R²)(1/me + 1/mh) − 1.8e²/(4πεε₀R).
 * Beyond the lecture: Brus, J. Chem. Phys. 80, 4403 (1984); CdSe Eg 1.74 eV,
 * me 0.13, mh 0.45, ε 10.6. It overestimates for the smallest dots.
 */
export function colloidGapEv(d: number) {
  const R = d / 2
  const conf = ((0.0380998 * Math.PI * Math.PI) / (R * R)) * (1 / 0.13 + 1 / 0.45)
  const coul = (1.8 * 1.44) / (10.6 * R) // e²/4πε₀ = 1.44 eV·nm
  return 1.74 + conf - coul
}

/** an approximate sRGB colour for an emission wavelength (nm) */
export function wavelengthColour(nm: number): string {
  let r = 0
  let g = 0
  let b = 0
  if (nm < 440) [r, g, b] = [-(nm - 440) / 60, 0, 1]
  else if (nm < 490) [r, g, b] = [0, (nm - 440) / 50, 1]
  else if (nm < 510) [r, g, b] = [0, 1, -(nm - 510) / 20]
  else if (nm < 580) [r, g, b] = [(nm - 510) / 70, 1, 0]
  else if (nm < 645) [r, g, b] = [1, -(nm - 645) / 65, 0]
  else [r, g, b] = [1, 0, 0]
  const f = (v: number) => Math.round(255 * Math.min(1, Math.max(0, v)) ** 0.8).toString(16).padStart(2, '0')
  return `#${f(r)}${f(g)}${f(b)}`
}
export const colloidColour = (d: number) => wavelengthColour(1239.84 / colloidGapEv(d))

/**
 * InAs on GaAs (slides 21–22). Below the critical thickness the InAs is a
 * strained wetting layer; above it, 3D islands form, 2–10 nm high and
 * 20–40 nm wide (slide 22). The critical thickness of ≈ 1.7 monolayers is
 * beyond the lecture (Leonard, Pond & Petroff, Phys. Rev. B 50, 11687 (1994)).
 */
export const SK_CRITICAL_ML = 1.7
export const INAS_ML_NM = 0.303
export function skState(ml: number) {
  const islands = ml > SK_CRITICAL_ML
  const wet = Math.min(ml, SK_CRITICAL_ML) * INAS_ML_NM
  const x = islands ? Math.min(1, (ml - SK_CRITICAL_ML) / 1.3) : 0
  return { islands, wet, h: 2 + 8 * x, w: 20 + 20 * x }
}

/**
 * Threshold current against temperature, I = I₀·exp((T − 25)/T₀), with a
 * characteristic temperature T₀. Slide 33's curves: the QD laser's threshold
 * barely moves from −40 to +100 °C; the QW lasers' rise steeply. T₀ values
 * are illustrative (beyond the lecture: Mukai et al., IEEE JQE 32, 1996;
 * the Nature Photonics 3, 30 (2009) review on the slide).
 */
export function qdLaserThreshold(T: number, kind: 'qd' | 'qw') {
  return kind === 'qd' ? 11 * Math.exp((T - 25) / 2000) : 16 * Math.exp((T - 25) / 55)
}
