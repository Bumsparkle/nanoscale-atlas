/**
 * Chapter 6 (Topic 7): the optics of printing. Everything a lithography
 * scene, panel or worked solution shows is computed here.
 *
 * On the slides: R = k₁λ/NA, DOF = ±k₂λ/NA², the Airy radius 1.22λf/d,
 * MTF = (Imax − Imin)/(Imax + Imin), S = NA_condenser/NA_projection,
 * W_min ≈ √(λg) for λ < g < W²/λ, and the roadmap's 0.7× per 3 years.
 * Beyond the lecture (named in the panels): the Bessel function for the Airy
 * pattern, Abbe's method for partially coherent images of a grating
 * (Born & Wolf, Principles of Optics, ch. 8 and 10; Mack, Fundamental
 * Principles of Optical Lithography, ch. 2), and the Fresnel integrals.
 */

/** the slide 4 light sources (nm) */
export const SOURCES = [
  { id: 'g', name: 'g-line', lamp: 'Hg lamp', nm: 436, use: '' },
  { id: 'i', name: 'i-line', lamp: 'Hg lamp', nm: 365, use: '0.5, 0.35 µm' },
  { id: 'krf', name: 'KrF', lamp: 'excimer laser', nm: 248, use: '0.25, 0.18, 0.13 µm' },
  { id: 'arf', name: 'ArF', lamp: 'excimer laser', nm: 193, use: '130, 90 nm' },
  { id: 'f2', name: 'F₂', lamp: 'excimer laser', nm: 157, use: 'sub-90 nm' },
] as const
export type SourceId = (typeof SOURCES)[number]['id']
export const SOURCE_BY_ID = Object.fromEntries(SOURCES.map((s) => [s.id, s])) as Record<SourceId, (typeof SOURCES)[number]>

/** R = k₁λ/NA (same unit as λ) */
export const resolution = (k1: number, lambda: number, NA: number) => (k1 * lambda) / NA
/** DOF half-range = k₂λ/NA² (the DOF is ±this) */
export const depthOfFocus = (k2: number, lambda: number, NA: number) => (k2 * lambda) / (NA * NA)
/** NA = n sin α */
export const numericalAperture = (n: number, alpha: number) => n * Math.sin(alpha)
/** Airy radius to the first dark ring, Φ = 1.22λf/d */
export const airyRadius = (lambda: number, f: number, d: number) => (1.22 * lambda * f) / d
/** MTF = (Imax − Imin)/(Imax + Imin) */
export const mtf = (Imax: number, Imin: number) => (Imax + Imin > 0 ? (Imax - Imin) / (Imax + Imin) : 0)
/** S = s/d = NA_condenser/NA_projection */
export const coherence = (s: number, d: number) => s / d
/** proximity printing: W_min ≈ √(λg) */
export const wMin = (lambda: number, g: number) => Math.sqrt(lambda * g)
/** slide 14: Fresnel (near-field) theory applies when λ < g < W²/λ */
export const fresnelRegime = (lambda: number, g: number, W: number): 'contact' | 'fresnel' | 'fraunhofer' =>
  g <= lambda ? 'contact' : g < (W * W) / lambda ? 'fresnel' : 'fraunhofer'
/** the roadmap rule: 0.7× in linear dimension every 3 years */
export const roadmapNode = (startNm: number, years: number) => startNm * Math.pow(0.7, years / 3)

/* ── Bessel J₁ (Abramowitz & Stegun 9.4.4 and 9.4.6) ───────────────────── */
export function besselJ1(x: number): number {
  const ax = Math.abs(x)
  if (ax < 8) {
    const y = x * x
    const n = x * (72362614232.0 + y * (-7895059235.0 + y * (242396853.1 + y * (-2972611.439 + y * (15704.4826 + y * -30.16036606)))))
    const d = 144725228442.0 + y * (2300535178.0 + y * (18583304.74 + y * (99447.43394 + y * (376.9991397 + y))))
    return n / d
  }
  const z = 8 / ax
  const y = z * z
  const xx = ax - 2.356194491
  const p = 1 + y * (0.183105e-2 + y * (-0.3516396496e-4 + y * (0.2457520174e-5 + y * -0.240337019e-6)))
  const q = 0.04687499995 + y * (-0.2002690873e-3 + y * (0.8449199096e-5 + y * (-0.88228987e-6 + y * 0.105787412e-6)))
  const ans = Math.sqrt(0.636619772 / ax) * (Math.cos(xx) * p - z * Math.sin(xx) * q)
  return x < 0 ? -ans : ans
}

/**
 * Airy intensity at radius r in the image plane, normalised to 1 at the
 * centre: [2J₁(v)/v]², v = 1.22π·r/Φ, so the first zero is at r = Φ.
 */
export function airy(r: number, Phi: number): number {
  const v = (3.8317059702 * r) / Phi
  if (Math.abs(v) < 1e-6) return 1
  const j = (2 * besselJ1(v)) / v
  return j * j
}

/**
 * Two incoherent point images a distance `sep` apart (in units of Φ):
 * the summed intensity along the line joining them, with its dip.
 * At sep = 1 (Rayleigh) the dip is ≈ 73.5 % of the peaks.
 */
export function twoPoints(sep: number, n = 241, span = 3) {
  const xs: number[] = []
  const I: number[] = []
  for (let i = 0; i < n; i++) {
    const x = -span + (2 * span * i) / (n - 1)
    xs.push(x)
    I.push(airy(x + sep / 2, 1) + airy(x - sep / 2, 1))
  }
  const peak = Math.max(...I)
  const mid = airy(sep / 2, 1) * 2
  return { xs, I, peak, mid, resolved: sep >= 1 - 1e-9, dip: mid / peak }
}

/**
 * Aerial image of an equal line/space grating (clear lines of width w,
 * period 2w) through a projection lens, by Abbe's method: the source is a
 * line of mutually incoherent points spanning ±S·NA; for each, the lens
 * passes the diffraction orders whose direction lies inside its pupil
 * (|nλ/p + σ| ≤ NA), the passed orders interfere, and the intensities of
 * all source points add. Returns I(x) over one period and its MTF.
 * S → 0 is coherent (cut-off p = λ/NA); S → 1 nearly incoherent (λ/2NA).
 */
export function gratingImage(w: number, lambda: number, NA: number, S: number, nx = 96) {
  const p = 2 * w
  const pts = Math.max(1, Math.round(1 + S * 30))
  const I = new Array(nx).fill(0)
  const nmax = Math.ceil(((1 + Math.max(S, 0)) * NA * p) / lambda) + 1
  const c = (n: number) => (n === 0 ? w / p : Math.sin((Math.PI * n * w) / p) / (Math.PI * n))
  for (let k = 0; k < pts; k++) {
    const sigma = pts === 1 ? 0 : (-S + (2 * S * k) / (pts - 1)) * NA
    const orders: number[] = []
    for (let n = -nmax; n <= nmax; n++) if (Math.abs((n * lambda) / p + sigma) <= NA + 1e-12) orders.push(n)
    for (let i = 0; i < nx; i++) {
      const x = (i / nx) * p - w / 2
      let re = 0
      let im = 0
      for (const n of orders) {
        const ph = (2 * Math.PI * n * x) / p
        re += c(n) * Math.cos(ph)
        im += c(n) * Math.sin(ph)
      }
      I[i] += (re * re + im * im) / pts
    }
  }
  // normalise to the open-frame intensity (a fully clear mask gives 1)
  const Imax = Math.max(...I)
  const Imin = Math.min(...I)
  return { I, Imax, Imin, mtf: mtf(Imax, Imin), period: p }
}

/** MTF against feature size w (same unit as λ) for one coherence S */
export function mtfCurve(lambda: number, NA: number, S: number, ws: number[]) {
  return ws.map((w) => gratingImage(w, lambda, NA, S, 64).mtf)
}

/* ── Fresnel integrals (series for small x, asymptotic for large) ──────── */
export function fresnelCS(x: number): [number, number] {
  const ax = Math.abs(x)
  let C: number
  let S: number
  if (ax < 2.5) {
    // power series: C = Σ (−1)ⁿ (π/2)^{2n} x^{4n+1}/((2n)!(4n+1)), S likewise
    C = 0
    S = 0
    let termC = ax
    let termS = (Math.PI / 2) * ax ** 3
    C += termC
    S += termS / 3
    const t = (Math.PI / 2) * (Math.PI / 2) * ax ** 4
    for (let n = 1; n < 40; n++) {
      termC *= -t / ((2 * n - 1) * (2 * n))
      termS *= -t / ((2 * n) * (2 * n + 1))
      C += termC / (4 * n + 1)
      S += termS / (4 * n + 3)
      if (Math.abs(termC) < 1e-16 && Math.abs(termS) < 1e-16) break
    }
  } else {
    // auxiliary functions f, g (Abramowitz & Stegun 7.3.9–7.3.10, rational approximations 7.3.32–33)
    const f = (1 + 0.926 * ax) / (2 + 1.792 * ax + 3.104 * ax * ax)
    const g = 1 / (2 + 4.142 * ax + 3.492 * ax * ax + 6.67 * ax ** 3)
    const a = (Math.PI / 2) * ax * ax
    C = 0.5 + f * Math.sin(a) - g * Math.cos(a)
    S = 0.5 - f * Math.cos(a) - g * Math.sin(a)
  }
  return x < 0 ? [-C, -S] : [C, S]
}

/**
 * Near-field intensity a gap g below a slit of width W (plane wave, 1D),
 * normalised to the unobstructed intensity. `spread` averages over a small
 * range of incidence angles (partial coherence), which washes out ringing.
 */
export function fresnelSlit(W: number, g: number, lambda: number, xs: number[], spread = 0): number[] {
  const k = Math.sqrt(2 / (lambda * g))
  const n = spread > 0 ? 9 : 1
  return xs.map((x) => {
    let I = 0
    for (let j = 0; j < n; j++) {
      const shift = n === 1 ? 0 : (-1 + (2 * j) / (n - 1)) * spread * g
      const [c2, s2] = fresnelCS((W / 2 - x - shift) * k)
      const [c1, s1] = fresnelCS((-W / 2 - x - shift) * k)
      I += 0.5 * ((c2 - c1) ** 2 + (s2 - s1) ** 2)
    }
    return I / n
  })
}

/* ── 2D aerial image for the process simulator ─────────────────────────── */

/** exposure tool settings, in physical units */
export interface Optics {
  lambdaNm: number
  NA: number
  k1: number
  /** partial coherence S (0 coherent … 1 incoherent) */
  S: number
}

/**
 * Effective blur of the printed image. A Gaussian stands in for the Airy
 * core; its width is calibrated so an isolated dark line exactly R = k₁λ/NA
 * wide just reaches the resist's 0.5 threshold at its centre (the resolution
 * criterion), so features wider than R print and narrower ones wash out.
 * 1 − erf(w/(2√2σ)) = ½ at w = 1.349σ.
 */
export const blurSigmaNm = (o: Optics) => resolution(o.k1, o.lambdaNm, o.NA) / 1.349

/** error function (Abramowitz & Stegun 7.1.26, |ε| < 1.5 × 10⁻⁷) */
export function erf(x: number) {
  const t = 1 / (1 + 0.3275911 * Math.abs(x))
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x)
  return x >= 0 ? y : -y
}

export { aerialImage } from '../../sim/aerial'

/* ── the roadmap (slide 2) ─────────────────────────────────────────────── */
export const ROADMAP = [
  { year: 1998, node: 250, gate: null, dram: '256M', mpu: null, cd: null, overlay: null, tech: '248 nm', data: null },
  { year: 2000, node: 180, gate: 100, dram: '512M', mpu: null, cd: null, overlay: null, tech: '248 nm', data: null },
  { year: 2002, node: 130, gate: 70, dram: '1G', mpu: null, cd: null, overlay: null, tech: '248 nm + RET', data: null },
  { year: 2004, node: 90, gate: 53, dram: '4G', mpu: 550, cd: 3.3, overlay: 32, tech: '193 nm + RET', data: 216 },
  { year: 2007, node: 65, gate: 35, dram: '16G', mpu: 1100, cd: 2.2, overlay: 23, tech: '193 nm + RET', data: 729 },
  { year: 2010, node: 45, gate: 25, dram: '32G', mpu: 2200, cd: 1.6, overlay: 18, tech: '193 nm + RET + H₂O', data: 1644 },
  { year: 2013, node: 32, gate: 18, dram: '64G', mpu: 4400, cd: 1.16, overlay: 12.8, tech: '193 nm + RET + H₂O (157 nm??)', data: 3700 },
  { year: 2016, node: 22, gate: 13, dram: '128G', mpu: 8800, cd: 0.8, overlay: 8.8, tech: '???', data: 8326 },
  { year: 2018, node: 18, gate: 10, dram: '128G', mpu: 14000, cd: 0.6, overlay: 7.2, tech: '???', data: 12490 },
] as const

/** exposure wavelength the roadmap used in a given year (nm), for the scene */
export const roadmapLambda = (year: number) => (year < 2004 ? 248 : 193)

/* ── wavelengths of the slide 18 table ─────────────────────────────────── */
const h = 6.62607015e-34
const q = 1.602176634e-19
const c = 2.99792458e8
const me = 9.1093837015e-31
const mp = 1.67262192369e-27
/** photon: λ = hc/E (nm, E in eV) */
export const photonLambdaNm = (eV: number) => (h * c) / (eV * q) * 1e9
/** de Broglie wavelength (nm) of a particle of rest mass m (kg) and kinetic energy eV, relativistic */
export const deBroglieNm = (eV: number, m: number) => {
  const E = eV * q
  return (h / Math.sqrt(2 * m * E * (1 + E / (2 * m * c * c)))) * 1e9
}
export const ELECTRON_MASS = me
export const PROTON_MASS = mp
