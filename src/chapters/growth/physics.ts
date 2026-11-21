/**
 * Chapter 2 physics (Topic 3), pure and unit-tested. Everything on screen
 * in the growth chapter (the Czochralski ingot tint and graph, the band
 * diagram, the Miller-plane tool, the defect gauge, the process lab
 * read-outs) is computed here, so the questions' worked solutions use the
 * same numbers the scenes show.
 */

export const K_B = 8.617333e-5 // eV/K
export const kelvin = (c: number) => c + 273.15
export const kT = (celsius: number) => K_B * kelvin(celsius)

/* ───────────── segregation (slides 17–19) ───────────── */

export interface Dopant {
  el: string
  k0: number
  type: 'p' | 'n'
}
/** Topic 3 slide 17, Table 2.1 (the dopants and impurities used in the course) */
export const K0_TABLE: Dopant[] = [
  { el: 'B', k0: 0.8, type: 'p' },
  { el: 'P', k0: 0.35, type: 'n' },
  { el: 'As', k0: 0.3, type: 'n' },
  { el: 'Sb', k0: 0.023, type: 'n' },
  { el: 'Ga', k0: 8e-3, type: 'p' },
  { el: 'Al', k0: 2e-3, type: 'p' },
  { el: 'In', k0: 4e-4, type: 'p' },
  { el: 'C', k0: 0.07, type: 'n' },
  { el: 'O', k0: 1.25, type: 'n' },
]
export const K0_OF: Record<string, number> = Object.fromEntries(K0_TABLE.map((d) => [d.el, d.k0]))

/** Cs/C0 at solidified fraction f = M/M0 (slide 19): k0·(1 − f)^(k0 − 1) */
export function csOverC0(k0: number, f: number): number {
  const g = Math.min(Math.max(f, 0), 0.999)
  return k0 * Math.pow(1 - g, k0 - 1)
}
/** the melt's concentration CL/C0 = (1 − f)^(k0 − 1), from CL = Cs/k0 */
export const clOverC0 = (k0: number, f: number) => csOverC0(k0, f) / k0
/** dopant left in the melt S/(C0·M0) = (1 − f)^k0 */
export const meltDopantLeft = (k0: number, f: number) => Math.pow(1 - Math.min(Math.max(f, 0), 0.999), k0)

/* ───────────── point defects (slide 22) ───────────── */

/** equilibrium interstitials, cm⁻³ */
export const cI = (celsius: number) => 1e27 * Math.exp(-3.8 / kT(celsius))
/** equilibrium vacancies, cm⁻³ */
export const cV = (celsius: number) => 9e23 * Math.exp(-2.6 / kT(celsius))
/** atoms per cm³ in silicon (beyond the lecture: 8 atoms per a³, a = 0.543 nm) */
export const SI_ATOMS = 8 / Math.pow(0.5431e-7, 3)

/* ───────────── energy bands vs spacing (slides 8–10) ───────────── */

/**
 * Interatomic spacing r in units of the crystal spacing a (slide 9's axis):
 * a = 1, b, c and d further out. Energies are relative: 3s at 0, 3p at 1.
 * As r falls below c the 3s and 3p levels broaden into bands; at b they
 * meet (8N continuous states); below b they re-split into a filled 4N
 * valence band and an empty 4N conduction band, and at r = a the gap is Eg.
 */
export const SPACING = { a: 1, b: 1.4, c: 1.9, d: 2.8 } as const
export const E3S = 0
export const E3P = 1
/** the gap at the crystal spacing, in the same units (drawn; Si's Eg ≈ 1.12 eV is beyond the lecture) */
export const GAP_AT_A = 0.42

export type BandRegime = 'isolated' | 'splitting' | 'merged' | 'gap'
export interface Bands {
  regime: BandRegime
  /** the 3s / lower band [bottom, top] */
  lower: [number, number]
  /** the 3p / upper band [bottom, top] */
  upper: [number, number]
  /** forbidden gap (0 when merged or before the bands meet the regime 'gap') */
  gap: number
  /** states in each band, in units of N atoms */
  lowerStates: number
  upperStates: number
}

export function bandsAt(r: number): Bands {
  const { b, c } = SPACING
  const mid = (E3S + E3P) / 2
  if (r >= c) return { regime: 'isolated', lower: [E3S, E3S], upper: [E3P, E3P], gap: E3P - E3S, lowerStates: 2, upperStates: 6 }
  if (r > b + 0.02) {
    // broadening: each band's half-width grows from 0 at c until they touch at b
    const w = ((c - r) / (c - b)) * ((E3P - E3S) / 2)
    return { regime: 'splitting', lower: [E3S - w * 0.9, E3S + w], upper: [E3P - w, E3P + w * 1.1], gap: E3P - E3S - 2 * w, lowerStates: 2, upperStates: 6 }
  }
  if (r >= b - 0.02) {
    const w = (E3P - E3S) / 2
    return { regime: 'merged', lower: [E3S - w * 0.9, mid], upper: [mid, E3P + w * 1.1], gap: 0, lowerStates: 4, upperStates: 4 }
  }
  // below b: the merged band re-splits; the gap grows towards GAP_AT_A at r = a
  const s = Math.min(1.15, (b - r) / (b - SPACING.a))
  const g = GAP_AT_A * s
  const w = (E3P - E3S) / 2
  return { regime: 'gap', lower: [E3S - w * (0.9 + 0.5 * s), mid - g / 2], upper: [mid + g / 2, E3P + w * (1.1 + 0.6 * s)], gap: g, lowerStates: 4, upperStates: 4 }
}
/** nearest-neighbour spacing of Si in nm (beyond the lecture: √3·a/4) */
export const R_SI_NM = (Math.sqrt(3) * 0.5431) / 4

export type Solid = 'metal' | 'semiconductor' | 'insulator'
/** slide 10: gap (eV, beyond the lecture: Sze) and band filling */
export const SOLIDS: Record<Solid, { gap: number; example: string; filled: string }> = {
  metal: { gap: 0, example: 'Al', filled: 'conduction band partly filled (overlap)' },
  semiconductor: { gap: 1.12, example: 'Si', filled: 'valence band full, conduction band empty at 0 K; small gap' },
  insulator: { gap: 9, example: 'SiO₂', filled: 'valence band full, conduction band empty; large gap' },
}

/* ───────────── Miller indices (slide 6) ───────────── */

const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b))
export function reduceHkl(h: number, k: number, l: number): [number, number, number] {
  const g = gcd(gcd(Math.abs(h), Math.abs(k)), Math.abs(l)) || 1
  return [h / g, k / g, l / g]
}

/**
 * Miller indices from intercepts (in units of a; Infinity = parallel):
 * take reciprocals, then clear fractions to the smallest whole numbers.
 */
export function millerFromIntercepts(x: number, y: number, z: number): [number, number, number] {
  const rec = [x, y, z].map((v) => (Number.isFinite(v) ? 1 / v : 0))
  for (let m = 1; m <= 120; m++) {
    const s = rec.map((r) => r * m)
    if (s.every((v) => Math.abs(v - Math.round(v)) < 1e-6)) {
      const [h, k, l] = s.map((v) => Math.round(v))
      return reduceHkl(h, k, l)
    }
  }
  throw new Error('intercepts are not simple fractions')
}

/** diamond-cubic basis in units of a: FCC A at the cube sites, FCC B shifted by (¼, ¼, ¼) (slide 5) */
export const FCC: [number, number, number][] = [
  [0, 0, 0], [0, 0.5, 0.5], [0.5, 0, 0.5], [0.5, 0.5, 0],
]
export const DIAMOND: [number, number, number][] = [...FCC, ...FCC.map(([x, y, z]) => [x + 0.25, y + 0.25, z + 0.25] as [number, number, number])]

/**
 * Atoms per unit area on the densest (hkl) sheet of a lattice (basis in
 * units of a), in atoms per a². One conventional cell is enough: every
 * sheet of a class (h·x + k·y + l·z ≡ s mod 1) is equivalent, and that
 * class holds (its atoms per cell)/|n| atoms per a².
 */
export function sheetDensity(h: number, k: number, l: number, basis = DIAMOND): number {
  ;[h, k, l] = reduceHkl(h, k, l)
  const n = Math.hypot(h, k, l)
  if (n === 0) return 0
  const classes = new Map<number, number>()
  for (const [x, y, z] of basis) {
    let s = (h * x + k * y + l * z) % 1
    if (s < 0) s += 1
    const key = Math.round(s * 1e6) / 1e6 % 1
    classes.set(key, (classes.get(key) ?? 0) + 1)
  }
  return Math.max(...classes.values()) / n
}
/** the same in atoms per cm² for silicon (a = 0.5431 nm, beyond the lecture) */
export const A_SI_CM = 0.5431e-7
export const sheetDensityCm2 = (h: number, k: number, l: number) => sheetDensity(h, k, l) / (A_SI_CM * A_SI_CM)

/**
 * The plane drawn in the unit cell for (hkl): intercepts 1/h, 1/k, 1/l
 * from the origin, with a negative index measured from the opposite face
 * (the usual drawing convention). Returns the polygon where it cuts the
 * cube [0,1]³, ordered around its centre.
 */
export function planeInCube(h: number, k: number, l: number): [number, number, number][] {
  ;[h, k, l] = reduceHkl(h, k, l)
  // flip negative axes so the plane hx'+ky'+lz' = 1 has positive intercepts
  const sx = h < 0 ? -1 : 1
  const sy = k < 0 ? -1 : 1
  const sz = l < 0 ? -1 : 1
  const H = Math.abs(h)
  const K = Math.abs(k)
  const L = Math.abs(l)
  const f = (p: number[]) => H * p[0] + K * p[1] + L * p[2] - 1
  const corners: number[][] = []
  for (let i = 0; i < 8; i++) corners.push([i & 1, (i >> 1) & 1, (i >> 2) & 1])
  const edges: [number, number][] = []
  for (let i = 0; i < 8; i++) for (const bit of [1, 2, 4]) if (!(i & bit)) edges.push([i, i | bit])
  const pts: number[][] = []
  for (const [i, j] of edges) {
    const a = corners[i]
    const b = corners[j]
    const fa = f(a)
    const fb = f(b)
    if (Math.abs(fa) < 1e-9) pts.push(a)
    if (fa * fb < 0) {
      const t = fa / (fa - fb)
      pts.push(a.map((v, q) => v + (b[q] - v) * t))
    }
  }
  if (Math.abs(f(corners[7])) < 1e-9) pts.push(corners[7])
  // dedupe
  const uniq: number[][] = []
  for (const p of pts) if (!uniq.some((q) => Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]) < 1e-7)) uniq.push(p)
  if (uniq.length < 3) return []
  // order around the centroid in the plane
  const c = uniq.reduce((s, p) => s.map((v, q) => v + p[q] / uniq.length), [0, 0, 0])
  const nrm = [H, K, L]
  const u = Math.abs(nrm[0]) < 0.9 * Math.hypot(...nrm) ? cross(nrm, [1, 0, 0]) : cross(nrm, [0, 1, 0])
  const v = cross(nrm, u)
  uniq.sort((p, q) => Math.atan2(dot(sub(p, c), v), dot(sub(p, c), u)) - Math.atan2(dot(sub(q, c), v), dot(sub(q, c), u)))
  // map flipped axes back
  return uniq.map((p) => [sx < 0 ? 1 - p[0] : p[0], sy < 0 ? 1 - p[1] : p[1], sz < 0 ? 1 - p[2] : p[2]] as [number, number, number])
}
/** distance (units of a) of point p from the drawn (hkl) plane */
export function distanceToPlane(h: number, k: number, l: number, p: [number, number, number]) {
  ;[h, k, l] = reduceHkl(h, k, l)
  const x = h < 0 ? 1 - p[0] : p[0]
  const y = k < 0 ? 1 - p[1] : p[1]
  const z = l < 0 ? 1 - p[2] : p[2]
  return (Math.abs(h) * x + Math.abs(k) * y + Math.abs(l) * z - 1) / Math.hypot(h, k, l)
}
const cross = (a: number[], b: number[]) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const dot = (a: number[], b: number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const sub = (a: number[], b: number[]) => a.map((v, i) => v - b[i])

/* ───────────── thermal oxidation (slide 27) ───────────── */

/** 1 µm of SiO₂ consumes 0.44 µm of Si (slide 27) */
export const SI_CONSUMED = 0.44

/**
 * Deal–Grove oxide thickness (µm) on 〈100〉 Si (slide 27 names the model;
 * the rate constants are beyond the lecture: Plummer, Deal & Griffin,
 * Silicon VLSI Technology, Table 6-2, with B/A ÷ 1.68 for 〈100〉).
 * Dry oxide includes the usual 25 nm initial regime (τ).
 */
export function dealGrove(celsius: number, hours: number, ambient: 'dry' | 'wet', initialUm = 0) {
  const e = kT(celsius)
  const B = ambient === 'dry' ? 772 * Math.exp(-1.23 / e) : 386 * Math.exp(-0.78 / e)
  const BA = (ambient === 'dry' ? 6.23e6 * Math.exp(-2.0 / e) : 1.63e8 * Math.exp(-2.05 / e)) / 1.68
  const A = B / BA
  const xi = Math.max(initialUm, ambient === 'dry' ? 0.025 : 0)
  const tau = (xi * xi + A * xi) / B
  const x = (A / 2) * (Math.sqrt(1 + (4 * B * (hours + tau)) / (A * A)) - 1)
  return { x, A, B, BA, linear: hours + tau < (A * A) / (4 * B) }
}

/* ───────────── diffusion (slide 30) ───────────── */

/** D0 (cm²/s) and Q (eV), intrinsic diffusion in Si (beyond the lecture: Plummer, Table 7-5) */
export const DIFFUSERS: Record<'B' | 'P' | 'As' | 'Sb', { D0: number; Q: number; type: 'p' | 'n' }> = {
  B: { D0: 0.76, Q: 3.46, type: 'p' },
  P: { D0: 3.85, Q: 3.66, type: 'n' },
  As: { D0: 0.066, Q: 3.44, type: 'n' },
  Sb: { D0: 0.214, Q: 3.65, type: 'n' },
}
/** slide 30: D = D0·exp(−Q/kT), cm²/s */
export const diffusivity = (D0: number, Q: number, celsius: number) => D0 * Math.exp(-Q / kT(celsius))

/** complementary error function (Abramowitz & Stegun 7.1.26, |ε| < 1.5e-7) */
export function erfc(x: number): number {
  if (x < 0) return 2 - erfc(-x)
  const t = 1 / (1 + 0.3275911 * x)
  const y = t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))))
  return y * Math.exp(-x * x)
}
/** inverse of erfc on (0, 2), by bisection */
export function erfcInv(y: number): number {
  let lo = -6
  let hi = 6
  for (let i = 0; i < 80; i++) {
    const m = (lo + hi) / 2
    if (erfc(m) > y) lo = m
    else hi = m
  }
  return (lo + hi) / 2
}

/**
 * Predeposition then drive-in (slide 30). Concentrations in cm⁻³, times
 * in seconds, depths in µm. Predeposition: erfc profile at the solid
 * solubility Cs; its dose Q = 2·Cs·√(Dt/π) is then driven in as a Gaussian.
 */
export function predep(Cs: number, D: number, t: number) {
  const L = 2 * Math.sqrt(D * t) // cm
  return { dose: (2 * Cs * Math.sqrt(D * t)) / Math.sqrt(Math.PI), at: (xUm: number) => Cs * erfc((xUm * 1e-4) / L), L }
}
export function driveIn(dose: number, D: number, t: number) {
  const Dt = D * t
  return { at: (xUm: number) => (dose / Math.sqrt(Math.PI * Dt)) * Math.exp(-Math.pow(xUm * 1e-4, 2) / (4 * Dt)), surface: dose / Math.sqrt(Math.PI * Dt) }
}
/** depth (µm) where a profile falls to the background, by bisection */
export function junctionDepth(profile: (xUm: number) => number, background: number, maxUm = 20): number {
  if (profile(0) <= background) return 0
  let lo = 0
  let hi = maxUm
  for (let i = 0; i < 60; i++) {
    const m = (lo + hi) / 2
    if (profile(m) > background) lo = m
    else hi = m
  }
  return (lo + hi) / 2
}

/* ───────────── ion implantation (slide 31) ───────────── */

/**
 * Approximate projected range Rp (nm) and straggle in Si for 1–200 keV
 * (beyond the lecture: fitted to the LSS range tables in Plummer, Fig. 8-6;
 * good to ±20 %, enough to see the trend).
 */
export function projectedRange(species: 'B' | 'P' | 'As', keV: number) {
  const k = { B: 3.3, P: 1.25, As: 0.58 }[species]
  const p = { B: 0.9, P: 0.98, As: 1.0 }[species]
  const Rp = k * Math.pow(keV, p) * (species === 'B' ? 1.6 : 1)
  return { Rp, dRp: Rp * (species === 'B' ? 0.35 : species === 'P' ? 0.4 : 0.38) }
}

/* ───────────── epitaxy (slides 25–26) ───────────── */

/** MBE grows about 1000 nm per hour (slide 26) */
export const MBE_NM_PER_HOUR = 1000

/* ───────────── zone refining (slide 20) ───────────── */

/**
 * Float-zone refining, simulated by mass balance: a molten zone `zone`
 * segments long travels along a rod of `n` segments, freezing solid at
 * k·C_liquid behind it and melting fresh rod ahead. Returns C/C0 along the
 * rod after each requested number of passes (the end segments hold what
 * the zone swept along).
 */
export function zoneRefine(k: number, passes: number, n = 120, zone = 10): number[] {
  let rod = new Array(n).fill(1)
  for (let p = 0; p < passes; p++) {
    const out = new Array(n).fill(0)
    // the zone starts as the first `zone` segments melted together
    let liquid = 0
    for (let i = 0; i < zone; i++) liquid += rod[i]
    for (let i = 0; i < n; i++) {
      const cl = liquid / zone
      if (i + zone < n) {
        out[i] = k * cl
        liquid += rod[i + zone] - k * cl
      } else {
        // the zone reaches the end: normal freezing of the last zone
        const left = n - i
        out[i] = left === 1 ? liquid : k * (liquid / left)
        liquid -= out[i]
      }
    }
    rod = out
  }
  return rod
}
