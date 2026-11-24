import { q, type QuestionInput, type Scene, type Target } from '../src/learn/schema'
import type { SourceRef } from '../src/sources'
import t3 from './topic3/facts.json'
import t4 from './topic4/facts.json'
import t5 from './topic5/facts.json'
import t6 from './topic6/facts.json'
import t7 from './topic7/facts.json'
import t8 from './topic8/facts.json'
import { GENS } from '../src/learn/calcs'

/**
 * Question builders for Topics 3 and 4. A fact is named by its id without
 * the topic prefix ('s17-k0' → t3-s17-k0); the slide comes from the name.
 * Worked solutions default to the fact statement, so they always say what
 * the inventory says.
 */
type Hint = { text: string; highlight?: string }
export const H = (text: string, highlight?: string): Hint => ({ text, highlight })
type Opts = { obj?: string | null; d?: 1 | 2 | 3; scene?: Scene; sol?: string; also?: string[] }

const STATEMENT: Record<string, string> = Object.fromEntries([...t3.facts, ...t4.facts, ...t5.facts, ...t6.facts, ...t7.facts, ...t8.facts].map((f) => [f.id, f.statement]))

export function kit(prefix: 't3' | 't4' | 't5' | 't6' | 't7' | 't8', T: (n: number) => SourceRef) {
  const fid = (n: string) => `${prefix}-${n}`
  const slideOf = (n: string) => Number(n.slice(1, 3))
  const base = (id: string, facts: string[], prompt: string, hints: Hint[], o: Opts = {}) => {
    const ids = [...facts, ...(o.also ?? [])].map(fid)
    for (const f of ids) if (!(f in STATEMENT)) throw new Error(`${id}: unknown fact ${f}`)
    return {
      id: `q-${prefix}-${id}`,
      source: T(slideOf(facts[0])),
      factIds: ids,
      prompt,
      hints,
      workedSolution: o.sol ?? ids.filter((f) => facts.map(fid).includes(f)).map((f) => STATEMENT[f]).join(' '),
      objectRef: o.obj ?? null,
      difficulty: o.d ?? 1,
      scene: o.scene,
    }
  }
  return {
    fid,
    /** multiple choice on one fact: id is the fact name */
    mc: (fact: string, prompt: string, options: string[], correct: number, hint: string, o?: Opts): QuestionInput =>
      q({ ...base(fact, [fact], prompt, [H(hint)], o), type: 'recall', answer: { options, correct } }),
    /** short typed answer */
    short: (id: string, fact: string, prompt: string, accept: string[], hint: string, o?: Opts): QuestionInput =>
      q({ ...base(id, [fact], prompt, [H(hint)], o), type: 'recall', answer: { accept } }),
    calc: (id: string, facts: string[], prompt: string, value: number, tol: number, unit: string, hint: string, sol: string, o?: Opts): QuestionInput =>
      q({ ...base(id, facts, prompt, [H(hint)], { d: 2, ...o, sol }), type: 'calc', answer: { value, tol, unit } }),
    /** parameterised calc: prompt uses {var}; value at the first values of each list */
    gen: (id: string, facts: string[], prompt: string, fn: string, vars: Record<string, number[]>, hint: string, o?: Opts): QuestionInput => {
      const g = GENS[fn]
      const first = Object.fromEntries(Object.entries(vars).map(([k, v]) => [k, v[0]]))
      const value = g.value(first)
      return q({ ...base(id, facts, prompt, [H(hint)], { d: 2, ...o, sol: g.solution(first, value) }), type: 'calc', answer: { value, tol: Math.max(Math.abs(value) * g.rel, 1e-30), unit: g.unit, gen: { fn, vars } } })
    },
    label: (id: string, facts: string[], prompt: string, objects: string[], scene: Scene, hint: string, o?: Opts): QuestionInput =>
      q({ ...base(id, facts, prompt, [H(hint)], { obj: objects[0], ...o }), type: 'label', scene, answer: { objects } }),
    act: (id: string, facts: string[], prompt: string, scene: Scene, target: Target, solve: Scene, hint: string, o?: Opts): QuestionInput =>
      q({ ...base(id, facts, prompt, [H(hint)], { d: 2, ...o, scene }), type: 'do', answer: { target, solve } }),
    predict: (id: string, facts: string[], prompt: string, scene: Scene, options: string[], correct: number, reveal: Scene, result: string, hint: string, o?: Opts): QuestionInput =>
      q({ ...base(id, facts, prompt, [H(hint)], { d: 2, ...o, scene }), type: 'predict', answer: { options, correct, reveal, result } }),
  }
}

/** a state target: on `layer` (and `tab`), with store values in range */
export const ST = (layer: Target extends infer _ ? Scene['layer'] : never, tab: string | undefined, checks: { path: string; eq?: unknown; min?: number; max?: number }[]): Target =>
  ({ kind: 'state', layer: layer!, tab, checks }) as Target
