import type { Question } from './schema'
import { cI, cV, csOverC0, diffusivity, kT, millerFromIntercepts, SI_CONSUMED } from '../chapters/growth/physics'
import { nbYield, poissonYield } from '../chapters/clean/physics'

/**
 * Parameterised calculation questions. A calc question with `answer.gen`
 * names a generator here and lists the values each {var} in its prompt may
 * take. `realise` picks values from a seed, fills in the prompt and
 * computes the answer and a full worked solution, so the numbers change
 * every time the question comes round. The first value of each list gives
 * the stored answer (checked by the tests).
 */
type V = Record<string, number>
interface Gen {
  unit: string
  /** relative tolerance */
  rel: number
  value: (v: V) => number
  solution: (v: V, ans: number) => string
  /** how a variable is printed in the prompt */
  fmt?: Partial<Record<string, (n: number) => string>>
}

const SUPS: Record<string, string> = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' }
/** 3.2 × 10¹⁶ */
export function sci(n: number, d = 3): string {
  if (n === 0) return '0'
  const e = Math.floor(Math.log10(Math.abs(n)))
  if (e >= -2 && e <= 3) return String(+n.toPrecision(d))
  return `${+(n / 10 ** e).toPrecision(d)} × 10${String(e).split('').map((c) => SUPS[c]).join('')}`
}
const g3 = (n: number) => String(+n.toPrecision(3))

export const GENS: Record<string, Gen> = {
  /** Topic 3 slide 19 */
  segregation: {
    unit: 'cm⁻³', rel: 0.02,
    value: ({ k0, f, C0 }) => C0 * csOverC0(k0, f),
    solution: ({ k0, f, C0 }, a) =>
      `Cs = k0·C0·(1 − M/M0)^(k0−1) = ${k0} × ${sci(C0)} × (1 − ${f})^(${k0} − 1) = ${k0} × ${sci(C0)} × ${g3(Math.pow(1 - f, k0 - 1))} = ${sci(a)} cm⁻³. ${k0 < 1 ? 'k0 < 1, so the crystal is richer in dopant than at the seed end (k0·C0 = ' + sci(k0 * C0) + ').' : ''}`,
    fmt: { C0: sci },
  },
  /** Topic 3 slide 22 */
  vacancies: {
    unit: 'cm⁻³', rel: 0.03,
    value: ({ T }) => cV(T),
    solution: ({ T }, a) => `T = ${T} + 273 = ${T + 273} K, so kT = 8.617 × 10⁻⁵ × ${T + 273} = ${(kT(T)).toFixed(4)} eV. CV* = 9 × 10²³ × exp(−2.6/${kT(T).toFixed(4)}) = 9 × 10²³ × ${sci(Math.exp(-2.6 / kT(T)))} = ${sci(a)} cm⁻³.`,
  },
  interstitials: {
    unit: 'cm⁻³', rel: 0.03,
    value: ({ T }) => cI(T),
    solution: ({ T }, a) => `T = ${T} + 273 = ${T + 273} K, so kT = ${(kT(T)).toFixed(4)} eV. CI* = 1 × 10²⁷ × exp(−3.8/${kT(T).toFixed(4)}) = 1 × 10²⁷ × ${sci(Math.exp(-3.8 / kT(T)))} = ${sci(a)} cm⁻³.`,
  },
  /** Topic 3 slide 27 */
  'si-consumed': {
    unit: 'nm', rel: 0.01,
    value: ({ x }) => SI_CONSUMED * x,
    solution: ({ x }, a) => `Every 1 µm of SiO₂ consumes 0.44 µm of Si, so ${x} nm of oxide uses 0.44 × ${x} = ${g3(a)} nm of silicon. The interface moves down ${g3(a)} nm and the top surface rises ${g3(x - a)} nm.`,
  },
  'oxide-from-si': {
    unit: 'nm', rel: 0.01,
    value: ({ s }) => s / SI_CONSUMED,
    solution: ({ s }, a) => `Oxide thickness = Si consumed / 0.44 = ${s} / 0.44 = ${g3(a)} nm.`,
  },
  /** Topic 3 slide 30 */
  diffusivity: {
    unit: 'cm²/s', rel: 0.03,
    value: ({ D0, Q, T }) => diffusivity(D0, Q, T),
    solution: ({ D0, Q, T }, a) => `D = D0·exp(−Q/kT). T = ${T + 273} K, kT = ${kT(T).toFixed(4)} eV, Q/kT = ${(Q / kT(T)).toFixed(2)}. D = ${D0} × exp(−${(Q / kT(T)).toFixed(2)}) = ${D0} × ${sci(Math.exp(-Q / kT(T)))} = ${sci(a)} cm²/s.`,
  },
  /** Topic 4 slides 15–16, yield in % */
  poisson: {
    unit: '%', rel: 0.01,
    value: ({ A, D0 }) => 100 * poissonYield(A, D0),
    solution: ({ A, D0 }, a) => `Y = exp(−Ac·D0) = exp(−${A} × ${D0}) = exp(−${g3(A * D0)}) = ${g3(a / 100)}, i.e. ${g3(a)} %.`,
  },
  negbin: {
    unit: '%', rel: 0.01,
    value: ({ A, D0, C }) => 100 * nbYield(A, D0, C),
    solution: ({ A, D0, C }, a) => `Y = 1/(1 + Ac·D0/C)^C = 1/(1 + ${A} × ${D0}/${C})^${C} = 1/${g3(1 + (A * D0) / C)}^${C} = ${g3(a / 100)}, i.e. ${g3(a)} %. Poisson would give ${g3(100 * poissonYield(A, D0))} %: clustering raises the yield.`,
  },
  /** Topic 3 slide 6: the answer is the three indices written as one number, e.g. 632 for (632) */
  miller: {
    unit: '(hkl)', rel: 1e-9,
    value: ({ x, y, z }) => {
      const [h, k, l] = millerFromIntercepts(x, y, z === 0 ? Infinity : z)
      return h * 100 + k * 10 + l
    },
    solution: ({ x, y, z }) => {
      const zz = z === 0 ? Infinity : z
      const [h, k, l] = millerFromIntercepts(x, y, zz)
      const rec = [x, y, zz].map((v) => (Number.isFinite(v) ? `1/${v}` : '0'))
      return `Reciprocals of the intercepts: (${rec.join(', ')}). Clear the fractions by multiplying through by the smallest common factor and reduce: (${h} ${k} ${l}).`
    },
    fmt: { z: (n) => (n === 0 ? '∞ (parallel to z)' : String(n)) },
  },
}

/** a seeded pick of variable values */
function pick(vars: Record<string, number[]>, seed: number): V {
  // scramble the seed (consecutive seeds would otherwise start the LCG in the same place)
  let s = Math.imul((seed >>> 0) ^ 0x9e3779b9, 0x85ebca6b) >>> 0 || 1
  s = Math.imul(s ^ (s >>> 13), 0xc2b2ae35) >>> 0 || 1
  const rnd = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296)
  rnd()
  return Object.fromEntries(Object.entries(vars).map(([k, list]) => [k, seed === 0 ? list[0] : list[Math.floor(rnd() * list.length)]]))
}

/** the question with its numbers filled in (seed 0: the stored values) */
export function realise(q: Question, seed: number): Question {
  if (q.type !== 'calc' || !q.answer.gen) return q
  const g = GENS[q.answer.gen.fn]
  const v = pick(q.answer.gen.vars, seed)
  const value = g.value(v)
  const fill = (t: string) => t.replace(/\{(\w+)\}/g, (_, k) => (g.fmt?.[k] ?? String)(v[k]))
  return { ...q, prompt: fill(q.prompt), answer: { ...q.answer, value, tol: Math.max(Math.abs(value) * g.rel, 1e-30), unit: g.unit }, workedSolution: g.solution(v, value) }
}
