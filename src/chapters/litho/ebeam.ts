/**
 * Chapter 6 (Topic 7 slides 19–22): electron trajectories in resist on
 * silicon, for the proximity-effect view.
 *
 * Beyond the lecture: a single-scattering Monte Carlo after Joy
 * (Monte Carlo Modeling for Electron Microscopy and Microanalysis, 1995):
 * screened-Rutherford elastic scattering and Bethe's continuous energy loss
 * (with Joy & Luo's low-energy mean ionisation correction). Good to tens of
 * per cent, which is all the picture needs: forward scattering in the thin
 * resist, backscattering from the substrate, and a range that grows with
 * beam energy (slide 21's 10 kV and 20 kV plots).
 */
export interface Material {
  name: string
  Z: number
  A: number
  /** g/cm³ */
  rho: number
}
export const PMMA: Material = { name: 'PMMA', Z: 3.6, A: 6.67, rho: 1.19 }
export const SI: Material = { name: 'Si', Z: 14, A: 28.09, rho: 2.33 }

const NA = 6.02214076e23

/** screening parameter α (E in keV) */
const alphaOf = (Z: number, E: number) => (3.4e-3 * Math.pow(Z, 0.67)) / E
/** screened Rutherford total cross-section (cm²) */
function sigma(m: Material, E: number) {
  const a = alphaOf(m.Z, E)
  return 5.21e-21 * ((m.Z * m.Z) / (E * E)) * ((4 * Math.PI) / (a * (1 + a))) * Math.pow((E + 511) / (E + 1024), 2)
}
/** elastic mean free path (nm) */
export const meanFreePath = (m: Material, E: number) => (m.A / (NA * m.rho * sigma(m, E))) * 1e7
/** Bethe stopping power with Joy–Luo correction (keV/nm) */
export function stopping(m: Material, E: number) {
  const J = (9.76 * m.Z + 58.5 * Math.pow(m.Z, -0.19)) * 1e-3
  const Jp = J / (1 + (0.85 * J) / E)
  return ((78500 * m.rho * m.Z) / (m.A * E)) * Math.log((1.166 * E) / Jp) * 1e-7
}

export interface Trajectory {
  /** (x, z) points in nm; z positive downwards from the resist surface */
  pts: [number, number][]
  backscattered: boolean
  /** points where the electron was still in the resist with E between 0.05 and 2 keV: drawn as secondary-electron sparks */
  sparks: [number, number][]
}

/** deterministic RNG */
function rng(seed: number) {
  let s = seed >>> 0 || 1
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) + 0.5) / 4294967296
}

/**
 * Run `n` electrons of energy keV into a resist film of thickness tNm on
 * silicon. Returns the trajectories (projected onto the x–z plane) and the
 * energy each deposits in the resist, binned by lateral distance.
 */
export function simulate(keV: number, n: number, tNm = 500, seed = 7) {
  const r = rng(seed)
  const trajs: Trajectory[] = []
  const binNm = 100
  const deposit = new Array(60).fill(0)
  let back = 0
  let maxDepth = 0
  let maxR = 0
  for (let e = 0; e < n; e++) {
    let x = 0
    let y = 0
    let z = 0
    // direction cosines: straight down
    let cx = 0
    let cy = 0
    let cz = 1
    let E = keV
    const pts: [number, number][] = [[0, 0]]
    const sparks: [number, number][] = []
    let bs = false
    for (let k = 0; k < 4000 && E > 0.5; k++) {
      const m = z < tNm ? PMMA : SI
      const lam = meanFreePath(m, E)
      let s = -lam * Math.log(r())
      // don't step through the resist/substrate interface in one go
      if (m === PMMA && cz > 0 && z + s * cz > tNm) s = Math.max(1, (tNm - z) / cz + 0.5)
      const dE = stopping(m, E) * s
      x += s * cx
      y += s * cy
      z += s * cz
      if (z < tNm && z > 0) {
        const rr = Math.min(deposit.length - 1, Math.floor(Math.abs(x) / binNm))
        deposit[rr] += Math.min(E, dE)
        if (r() < 0.25) sparks.push([x, z])
      }
      E -= dE
      pts.push([x, z])
      if (z < 0) {
        bs = true
        break
      }
      maxDepth = Math.max(maxDepth, z)
      maxR = Math.max(maxR, Math.abs(x))
      // scattering angle (screened Rutherford) and a random azimuth
      const a = alphaOf(m.Z, Math.max(E, 0.5))
      const R = r()
      const cosT = 1 - (2 * a * R) / (1 + a - R)
      const sinT = Math.sqrt(Math.max(0, 1 - cosT * cosT))
      const phi = 2 * Math.PI * r()
      const cosP = Math.cos(phi)
      const sinP = Math.sin(phi)
      // rotate the direction (cx, cy, cz) by (θ, φ)
      if (Math.abs(cz) > 0.99999) {
        cx = sinT * cosP
        cy = sinT * sinP
        cz = (cz > 0 ? 1 : -1) * cosT
      } else {
        const sq = Math.sqrt(1 - cz * cz)
        const ncx = cx * cosT + (sinT * (cx * cz * cosP - cy * sinP)) / sq
        const ncy = cy * cosT + (sinT * (cy * cz * cosP + cx * sinP)) / sq
        const ncz = cz * cosT - sinT * cosP * sq
        cx = ncx
        cy = ncy
        cz = ncz
      }
    }
    if (bs) back++
    trajs.push({ pts, backscattered: bs, sparks })
  }
  return { trajs, deposit, binNm, backscatter: back / n, maxDepthNm: maxDepth, maxRadiusNm: maxR }
}

/**
 * Kanaya–Okayama electron range (nm): R = 27.6·A·E^1.67/(Z^0.89·ρ), E in keV
 * (beyond the lecture: Kanaya & Okayama, J. Phys. D 5, 43 (1972)).
 */
export const kanayaRangeNm = (m: Material, keV: number) => (27.6 * m.A * Math.pow(keV, 1.67)) / (Math.pow(m.Z, 0.89) * m.rho)
