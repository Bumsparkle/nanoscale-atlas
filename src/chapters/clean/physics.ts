/**
 * Chapter 3 (Topic 4), pure and unit-tested: cleanroom classes, the RCA
 * sequence, the redox ladder, gettering stages and the yield models.
 */

/* ───────────── cleanroom classes (slide 7) ───────────── */

export const CLASSES = [1, 10, 100, 1000, 10000, 100000]
/**
 * Allowed particles ≥ d µm per ft³ for class X. Slide 7: the class number
 * is the count ≥ 0.5 µm; the lines fall as d^−2.2 (beyond the lecture:
 * the FED-STD-209E slope).
 */
export const classCount = (cls: number, dUm: number) => cls * Math.pow(0.5 / dUm, 2.2)

/* ───────────── the RCA clean (slides 10–11) ───────────── */

export type Contaminant = 'organic' | 'oxide' | 'metal' | 'alkali' | 'particle'
export interface RcaStep {
  id: string
  name: string
  mix: string
  ratio: string
  temp: string
  time: string
  removes: Contaminant[]
  note: string
  /** leaves a thin chemical oxide (H₂O₂ oxidises the Si) */
  growsOxide?: boolean
  rinse?: boolean
}
export const RCA_STEPS: RcaStep[] = [
  { id: 'piranha', name: 'Piranha', mix: 'H₂SO₄ / H₂O₂', ratio: '1:1 to 4:1', temp: '120–150 °C', time: '10 min', removes: ['organic'], note: 'Strips organics, especially photoresist.', growsOxide: true },
  { id: 'hf', name: 'HF dip', mix: 'HF / H₂O', ratio: '1:10 to 1:50', temp: 'room T', time: '1 min', removes: ['oxide'], note: 'Strips the chemical oxide with its contaminants; leaves an H-passivated (or F) surface.' },
  { id: 'rinse1', name: 'DI rinse', mix: 'DI H₂O', ratio: '—', temp: 'room T', time: '', removes: [], note: 'Rinse.', rinse: true },
  { id: 'sc1', name: 'SC-1', mix: 'NH₄OH / H₂O₂ / H₂O', ratio: '1:1:5 to 0.05:1:5', temp: '80–90 °C', time: '10 min', removes: ['organic', 'metal', 'particle'], note: 'Strips organics, metals and particles; little NH₄OH keeps the surface smooth.', growsOxide: true },
  { id: 'rinse2', name: 'DI rinse', mix: 'DI H₂O', ratio: '—', temp: 'room T', time: '', removes: [], note: 'Rinse.', rinse: true },
  { id: 'sc2', name: 'SC-2', mix: 'HCl / H₂O₂ / H₂O', ratio: '1:1:6', temp: '80–90 °C', time: '10 min', removes: ['alkali', 'metal'], note: 'Strips the alkali ions and metals SC-1 left (Al³⁺, Fe³⁺, Mg²⁺).', growsOxide: true },
  { id: 'rinse3', name: 'DI rinse', mix: 'DI H₂O', ratio: '—', temp: 'room T', time: '', removes: [], note: 'Rinse. An HF dip can follow to remove the chemical oxide.', rinse: true },
]

/** which contaminants are left on the wafer after the first `done` steps */
export function remaining(done: number): Set<Contaminant> {
  const left = new Set<Contaminant>(['organic', 'oxide', 'metal', 'alkali', 'particle'])
  for (const s of RCA_STEPS.slice(0, done)) {
    for (const c of s.removes) {
      // SC-1 takes most metals; the ions it cannot dissolve go in SC-2
      if (c === 'metal' && s.id === 'sc1') continue
      left.delete(c)
    }
    if (s.growsOxide) left.add('oxide')
  }
  return left
}

/* ───────────── redox ladder (slides 18–19) ───────────── */

export interface Couple {
  id: string
  label: string
  E: number
  reaction: string
  /** a metal that could contaminate the wafer */
  metal?: boolean
  /** an oxidant used in cleaning solutions */
  oxidant?: 'h2o2' | 'o3'
}
/** standard oxidation potentials (V) as Topic 4 slide 19 lists them; O₂/H₂O with 4e⁻ (the slide has 2e⁻) */
export const COUPLES: Couple[] = [
  { id: 'Mn', label: 'Mn²⁺/Mn', E: 1.05, reaction: 'Mn ⇌ Mn²⁺ + 2e⁻', metal: true },
  { id: 'Si', label: 'SiO₂/Si', E: 0.84, reaction: 'Si + 2H₂O ⇌ SiO₂ + 4H⁺ + 4e⁻' },
  { id: 'Cr', label: 'Cr³⁺/Cr', E: 0.71, reaction: 'Cr ⇌ Cr³⁺ + 3e⁻', metal: true },
  { id: 'Ni', label: 'Ni²⁺/Ni', E: 0.25, reaction: 'Ni ⇌ Ni²⁺ + 2e⁻', metal: true },
  { id: 'Fe', label: 'Fe³⁺/Fe', E: 0.17, reaction: 'Fe ⇌ Fe³⁺ + 3e⁻', metal: true },
  { id: 'H2SO3', label: 'H₂SO₄/H₂SO₃', E: -0.2, reaction: 'H₂O + H₂SO₃ ⇌ H₂SO₄ + 2H⁺ + 2e⁻' },
  { id: 'Cu', label: 'Cu²⁺/Cu', E: -0.34, reaction: 'Cu ⇌ Cu²⁺ + 2e⁻', metal: true },
  { id: 'O2', label: 'O₂/H₂O', E: -1.23, reaction: '2H₂O ⇌ O₂ + 4H⁺ + 4e⁻' },
  { id: 'Au', label: 'Au³⁺/Au', E: -1.42, reaction: 'Au ⇌ Au³⁺ + 3e⁻', metal: true },
  { id: 'H2O2', label: 'H₂O₂/H₂O', E: -1.77, reaction: '2H₂O ⇌ H₂O₂ + 2H⁺ + 2e⁻', oxidant: 'h2o2' },
  { id: 'O3', label: 'O₃/O₂', E: -2.07, reaction: 'O₂ + H₂O ⇌ O₃ + 2H⁺ + 2e⁻', oxidant: 'o3' },
]
export const COUPLE_BY_ID = Object.fromEntries(COUPLES.map((c) => [c.id, c])) as Record<string, Couple>

/**
 * Does metal M end up dissolved (M^z+, desorbs) or plated on the wafer?
 * The stronger reaction dominates (slide 18). In water the Si wafer is the
 * best reductant: a metal below Si in the table is driven to the left
 * (reduced) and plates out, while Si oxidises. A strong oxidant lower in the
 * table than the metal grabs electrons and drives the metal into solution
 * (slide 19): that is how H₂O₂ in the RCA clean works.
 */
export function metalFate(metal: string, solution: 'water' | 'h2o2' | 'o3'): 'dissolves' | 'plates' {
  const m = COUPLE_BY_ID[metal]
  if (solution === 'water') return m.E > COUPLE_BY_ID.Si.E ? 'dissolves' : 'plates'
  const ox = COUPLE_BY_ID[solution === 'h2o2' ? 'H2O2' : 'O3']
  return m.E > ox.E ? 'dissolves' : 'plates'
}

/* ───────────── gettering (slides 12–14, 20) ───────────── */

export const CYCLE = [
  { name: 'as grown', T: 25, note: 'CZ silicon: interstitial oxygen ~10¹⁸ cm⁻³ everywhere.' },
  { name: 'outdiffusion', T: 1100, note: 'High temperature: oxygen diffuses out of the surface layer, which becomes the denuded zone.' },
  { name: 'nucleation', T: 700, note: 'Low temperature: SiO₂ nuclei form in the oxygen-rich bulk.' },
  { name: 'precipitation', T: 1000, note: 'The nuclei grow into SiO₂ precipitates with dislocations around them: the trap sites.' },
]
export const GETTER = [
  { name: 'metal in the device region', note: 'A substitutional Au atom (Au_s) sits in the active region near the surface.' },
  { name: '1 · made mobile', note: 'Kicked out to an interstitial site: Au_s + I ⇌ Au_i.' },
  { name: '2 · migration', note: 'Interstitial metals diffuse very fast, deep into the wafer.' },
  { name: '3 · trapped', note: 'They segregate to the dislocations around SiO₂ precipitates (intrinsic) or the backside damage (extrinsic).' },
]

/* ───────────── yield (slides 15–17) ───────────── */

/** Poisson: Y = exp(−Ac·D0) */
export const poissonYield = (A: number, D0: number) => Math.exp(-A * D0)
/** negative binomial: Y = 1/(1 + Ac·D0/C)^C */
export const nbYield = (A: number, D0: number, C: number) => Math.pow(1 + (A * D0) / C, -C)

/**
 * A wafer's worth of dies hit by particles. Each die's defect count is
 * Poisson with mean Ac·D0·g, where g is a cluster factor drawn from a gamma
 * distribution of shape C and mean 1 (shared by neighbouring dies), which
 * is exactly what makes the yield negative binomial. Returns, per die,
 * how many killer particles landed on it.
 */
export function scatter(nDies: number, A: number, D0: number, C: number, seed: number, clusterOf: (i: number) => number): number[] {
  let s = seed >>> 0 || 1
  const u = () => ((s = (s * 1664525 + 1013904223) >>> 0) + 0.5) / 4294967296
  const gauss = () => Math.sqrt(-2 * Math.log(u())) * Math.cos(2 * Math.PI * u())
  // Marsaglia–Tsang gamma(shape k, scale 1/k): mean 1
  const gamma = (k: number): number => {
    if (k < 1) return gamma(k + 1) * Math.pow(u(), 1 / k)
    const d = k - 1 / 3
    const c = 1 / Math.sqrt(9 * d)
    for (;;) {
      let x = gauss()
      let v = 1 + c * x
      if (v <= 0) continue
      v = v * v * v
      x = x * x
      if (Math.log(u()) < 0.5 * x + d * (1 - v + Math.log(v))) return (d * v) / k
    }
  }
  const poisson = (m: number) => {
    if (m > 30) return Math.max(0, Math.round(m + Math.sqrt(m) * gauss()))
    const L = Math.exp(-m)
    let k = 0
    let p = 1
    do {
      k++
      p *= u()
    } while (p > L)
    return k - 1
  }
  const g = new Map<number, number>()
  return Array.from({ length: nDies }, (_, i) => {
    const cl = clusterOf(i)
    if (!g.has(cl)) g.set(cl, gamma(C))
    return poisson(A * D0 * g.get(cl)!)
  })
}
