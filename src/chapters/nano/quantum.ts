/**
 * Chapter 7 (Topic 8 slides 4–13, 23–31): quantum confinement, exact.
 *
 * Units: energies in eV, lengths in nm, masses in units of m₀. The one
 * constant is ħ²/2m₀ = 0.0380998 eV·nm², so 2m/ħ² = m/0.0381 per eV·nm².
 *
 * - Infinite well (slides 6–8): Eₙ = n²π²ħ²/(2mL²), ψₙ = √(2/L) sin(nπx/L).
 * - Finite well (slide 10): solved two ways, both numerical: the symmetric
 *   well's transcendental equations by bisection (BenDaniel–Duke matching,
 *   ψ and ψ'/m continuous), and any band profile by finite differences
 *   (Sturm-sequence bisection for the eigenvalues, inverse iteration for the
 *   wavefunctions). The second is what the heterostructure view uses.
 * - Wires and dots (slides 12–13), and the density of states (slides 23–30).
 */
/** ħ²/2m₀ in eV·nm² (CODATA 2018) */
export const HB = (1.054571817e-34 ** 2 / (2 * 9.1093837015e-31) / 1.602176634e-19) * 1e18

/** free electron: E = ħ²k²/2m (k in nm⁻¹) */
export const freeEnergy = (k: number, m = 1) => (HB * k * k) / m
/** k = √(2mE/ħ²) */
export const freeK = (E: number, m = 1) => Math.sqrt((Math.max(0, E) * m) / HB)

/** infinite well level n (n = 1, 2, 3…) */
export const infiniteLevel = (n: number, L: number, m = 1) => (n * n * Math.PI * Math.PI * HB) / (m * L * L)
/** normalised infinite-well wavefunction, x in [0, L] */
export const infinitePsi = (n: number, L: number, x: number) => (x < 0 || x > L ? 0 : Math.sqrt(2 / L) * Math.sin((n * Math.PI * x) / L))

/** quantum wire: E = ħ²kx²/2m + (ħ²π²/2m)(n²/a² + l²/b²) */
export const wireLevel = (n: number, l: number, a: number, b: number, m = 1, kx = 0) => (HB / m) * (kx * kx + Math.PI * Math.PI * ((n * n) / (a * a) + (l * l) / (b * b)))
/** quantum dot: E = (ħ²π²/2m)(n²/a² + l²/b² + j²/c²) */
export const dotLevel = (n: number, l: number, j: number, a: number, b: number, c: number, m = 1) => ((HB * Math.PI * Math.PI) / m) * ((n * n) / (a * a) + (l * l) / (b * b) + (j * j) / (c * c))

/** lowest levels of a box with `dims` confined directions (1 well, 2 wire, 3 dot), sorted, with their quantum numbers */
export function boxLevels(dims: 1 | 2 | 3, a: number, b: number, c: number, m = 1, count = 6) {
  const out: { E: number; q: number[] }[] = []
  const N = 5
  for (let n = 1; n <= N; n++)
    for (let l = 1; l <= (dims >= 2 ? N : 1); l++)
      for (let j = 1; j <= (dims >= 3 ? N : 1); j++) {
        const E = dims === 1 ? infiniteLevel(n, a, m) : dims === 2 ? wireLevel(n, l, a, b, m) : dotLevel(n, l, j, a, b, c, m)
        out.push({ E, q: dims === 1 ? [n] : dims === 2 ? [n, l] : [n, l, j] })
      }
  return out.sort((x, y) => x.E - y.E).slice(0, count)
}

/* ── finite square well, exact (transcendental) ───────────────────────── */

export interface Level {
  n: number
  E: number
  parity: 'even' | 'odd'
}

/**
 * Bound states of a symmetric well of width L and depth V0 (eV), electron
 * mass mw inside and mb in the barriers. Even states: k·tan(kL/2) = (mw/mb)·κ;
 * odd: −k·cot(kL/2) = (mw/mb)·κ, with k = √(mw E)/√HB, κ = √(mb(V0 − E))/√HB.
 */
export function finiteWell(L: number, V0: number, mw = 1, mb = mw): Level[] {
  const k = (E: number) => Math.sqrt((mw * E) / HB)
  const kap = (E: number) => Math.sqrt((mb * Math.max(0, V0 - E)) / HB)
  const r = mw / mb
  // f(E) = 0 on each branch; written so it is continuous between the poles of tan/cot
  const fEven = (E: number) => k(E) * Math.sin((k(E) * L) / 2) - r * kap(E) * Math.cos((k(E) * L) / 2)
  const fOdd = (E: number) => -k(E) * Math.cos((k(E) * L) / 2) - r * kap(E) * Math.sin((k(E) * L) / 2)
  const levels: Level[] = []
  const N = 4000
  for (const [f, parity] of [[fEven, 'even'], [fOdd, 'odd']] as const) {
    let prev = f(1e-9 * V0)
    for (let i = 1; i <= N; i++) {
      const E = (V0 * i) / N - 1e-12
      const cur = f(E)
      if (Math.sign(cur) !== Math.sign(prev) && prev !== 0) {
        let lo = (V0 * (i - 1)) / N
        let hi = E
        for (let it = 0; it < 80; it++) {
          const mid = (lo + hi) / 2
          if (Math.sign(f(mid)) === Math.sign(f(lo))) lo = mid
          else hi = mid
        }
        levels.push({ n: 0, E: (lo + hi) / 2, parity })
      }
      prev = cur
    }
  }
  return levels.sort((a, b) => a.E - b.E).map((l, i) => ({ ...l, n: i + 1 }))
}

/** wavefunction of a finite-well level, x measured from the well's left wall (well in [0, L]); normalised numerically */
export function finitePsi(level: Level, L: number, V0: number, mw = 1, mb = mw) {
  const k = Math.sqrt((mw * level.E) / HB)
  const kap = Math.sqrt((mb * (V0 - level.E)) / HB)
  const even = level.parity === 'even'
  const inside = (u: number) => (even ? Math.cos(k * u) : Math.sin(k * u))
  const edge = inside(L / 2)
  const raw = (x: number) => {
    const u = x - L / 2
    if (Math.abs(u) <= L / 2) return inside(u)
    const s = even ? 1 : Math.sign(u)
    return s * edge * Math.exp(-kap * (Math.abs(u) - L / 2))
  }
  // normalise over the well plus generous tails
  const span = L / 2 + 8 / Math.max(kap, 1e-3)
  let sum = 0
  const n = 2000
  for (let i = 0; i <= n; i++) {
    const x = L / 2 - span + (2 * span * i) / n
    sum += raw(x) ** 2 * ((2 * span) / n)
  }
  const A = 1 / Math.sqrt(sum)
  return (x: number) => A * raw(x)
}

/** probability of finding the particle outside the well (in the barriers) */
export function barrierProbability(level: Level, L: number, V0: number, mw = 1, mb = mw) {
  const psi = finitePsi(level, L, V0, mw, mb)
  const kap = Math.sqrt((mb * (V0 - level.E)) / HB)
  const span = 10 / Math.max(kap, 1e-3)
  let p = 0
  const n = 1000
  for (let i = 0; i < n; i++) {
    const x = L + ((i + 0.5) / n) * span
    p += psi(x) ** 2 * (span / n)
  }
  return 2 * p
}

/* ── any profile: finite differences ──────────────────────────────────── */

/**
 * Bound states of −d/dz(HB/m(z) dψ/dz) + V(z)ψ = Eψ on a uniform grid with
 * ψ = 0 at both ends. Returns the `count` lowest eigenvalues below `Emax`
 * and their normalised eigenvectors (∑ψ²dz = 1).
 */
export function solveProfile(V: number[], m: number[], dz: number, count = 4, Emax = Infinity) {
  const N = V.length
  // symmetric tridiagonal: diagonal d, off-diagonal e (between i and i+1)
  const d = new Float64Array(N)
  const e = new Float64Array(N - 1)
  const mHalf = (i: number) => 2 / (1 / m[i] + 1 / m[i + 1]) // harmonic mean at i+½
  for (let i = 0; i < N; i++) {
    const left = i > 0 ? HB / mHalf(i - 1) : HB / m[i]
    const right = i < N - 1 ? HB / mHalf(i) : HB / m[i]
    d[i] = V[i] + (left + right) / (dz * dz)
  }
  for (let i = 0; i < N - 1; i++) e[i] = -HB / mHalf(i) / (dz * dz)
  // Sturm count: eigenvalues below x
  const below = (x: number) => {
    let c = 0
    let q = d[0] - x
    if (q < 0) c++
    for (let i = 1; i < N; i++) {
      q = d[i] - x - (e[i - 1] * e[i - 1]) / (q === 0 ? 1e-300 : q)
      if (q < 0) c++
    }
    return c
  }
  let lo0 = Infinity
  let hi0 = -Infinity
  for (let i = 0; i < N; i++) {
    const r = (i > 0 ? Math.abs(e[i - 1]) : 0) + (i < N - 1 ? Math.abs(e[i]) : 0)
    lo0 = Math.min(lo0, d[i] - r)
    hi0 = Math.max(hi0, d[i] + r)
  }
  const out: { E: number; psi: Float64Array }[] = []
  for (let k = 0; k < count; k++) {
    let lo = lo0
    let hi = hi0
    for (let it = 0; it < 100; it++) {
      const mid = (lo + hi) / 2
      if (below(mid) > k) hi = mid
      else lo = mid
    }
    const E = (lo + hi) / 2
    if (E > Emax) break
    out.push({ E, psi: inverseIteration(d, e, E) })
  }
  for (const s of out) {
    let sum = 0
    for (let i = 0; i < N; i++) sum += s.psi[i] * s.psi[i] * dz
    const A = 1 / Math.sqrt(sum)
    // sign convention: positive where it is largest in magnitude first
    let imax = 0
    for (let i = 0; i < N; i++) if (Math.abs(s.psi[i]) > Math.abs(s.psi[imax])) imax = i
    const sg = s.psi[imax] < 0 ? -1 : 1
    for (let i = 0; i < N; i++) s.psi[i] *= A * sg
  }
  return out
}

function inverseIteration(d: Float64Array, e: Float64Array, E: number) {
  const N = d.length
  let x = new Float64Array(N).fill(1)
  const shift = E + 1e-10 * (1 + Math.abs(E))
  for (let it = 0; it < 4; it++) {
    // solve (A − shift I) y = x by the Thomas algorithm
    const c = new Float64Array(N)
    const y = new Float64Array(N)
    let b = d[0] - shift
    c[0] = N > 1 ? e[0] / b : 0
    y[0] = x[0] / b
    for (let i = 1; i < N; i++) {
      b = d[i] - shift - e[i - 1] * c[i - 1]
      if (Math.abs(b) < 1e-300) b = 1e-300
      if (i < N - 1) c[i] = e[i] / b
      y[i] = (x[i] - e[i - 1] * y[i - 1]) / b
    }
    for (let i = N - 2; i >= 0; i--) y[i] -= c[i] * y[i + 1]
    let n = 0
    for (let i = 0; i < N; i++) n = Math.max(n, Math.abs(y[i]))
    for (let i = 0; i < N; i++) y[i] /= n
    x = y
  }
  return x
}

/* ── density of states (per eV, per nm^d) ─────────────────────────────── */

/** 3D: ρ = (1/2π²)(2m/ħ²)^(3/2) √E */
export const dos3 = (E: number, m = 1) => (E <= 0 ? 0 : (1 / (2 * Math.PI * Math.PI)) * Math.pow(m / HB, 1.5) * Math.sqrt(E))
/** 2D, one subband: ρ = m/(πħ²) = (1/2π)(2m/ħ²) */
export const dos2 = (E: number, m = 1) => (E <= 0 ? 0 : m / HB / (2 * Math.PI))
/**
 * 1D, one subband: ρ = (1/π)√(2m/ħ²) E^(−1/2). Topic 8 slide 29 prints
 * 1/2π, half this: its slide 28 count N = kL/π halves twice (see DECISIONS).
 */
export const dos1 = (E: number, m = 1) => (E <= 0 ? 0 : (1 / Math.PI) * Math.sqrt(m / HB) / Math.sqrt(E))

/**
 * Count states by placing them on the k-space grid (slides 24–29): standing
 * waves in a box of side Lbox have k = (π/Lbox)(n₁, n₂, n₃) with positive
 * integers; count those with |k| ≤ kmax, times 2 for spin. Compares with
 * N = k³V/3π² (3D), k²A/2π (2D), 2kL/π (1D; the slide's kL/π is half).
 */
export function countStates(dims: 1 | 2 | 3, kmax: number, Lbox: number) {
  const step = Math.PI / Lbox
  const nmax = Math.floor(kmax / step)
  let n = 0
  for (let a = 1; a <= nmax; a++)
    for (let b = 1; b <= (dims >= 2 ? nmax : 1); b++)
      for (let c = 1; c <= (dims >= 3 ? nmax : 1); c++) {
        const k2 = step * step * (a * a + (dims >= 2 ? b * b : 0) + (dims >= 3 ? c * c : 0))
        if (k2 <= kmax * kmax) n++
      }
  const counted = 2 * n
  const formula = dims === 3 ? (kmax ** 3 * Lbox ** 3) / (3 * Math.PI * Math.PI) : dims === 2 ? (kmax ** 2 * Lbox ** 2) / (2 * Math.PI) : (2 * kmax * Lbox) / Math.PI
  return { counted, formula }
}

/** ħ²/2m₀ as used in worked solutions, and kT at 300 K (eV) */
export const KT300 = 0.02585
