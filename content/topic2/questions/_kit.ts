import { q, type QuestionInput, type Scene, type Target } from '../../../src/learn/schema'
import { T2 } from '../../../src/sources'

/**
 * Small builders so each question reads as one line of intent plus its
 * text. Every builder returns plain data validated by QuestionSchema.
 */
type Opts = { obj?: string | null; d?: 1 | 2 | 3; scene?: Scene }
type Hint = { text: string; highlight?: string }
export const H = (text: string, highlight?: string): Hint => ({ text, highlight })

const common = (id: string, slide: number, factIds: string[], prompt: string, hints: Hint[], workedSolution: string, o: Opts = {}) => ({
  id,
  source: T2(slide),
  factIds,
  prompt,
  hints,
  workedSolution,
  objectRef: o.obj ?? null,
  difficulty: o.d ?? 1,
  scene: o.scene,
})

/** multiple choice (correct = index) or short answer (correct = list of accepted answers) */
export function recall(id: string, slide: number, f: string[], prompt: string, options: string[], correct: number | string[], hints: Hint[], sol: string, o?: Opts): QuestionInput {
  return q({ ...common(id, slide, f, prompt, hints, sol, o), type: 'recall', answer: Array.isArray(correct) ? { accept: correct } : { options, correct } })
}
export const short = (id: string, slide: number, f: string[], prompt: string, accept: string[], hints: Hint[], sol: string, o?: Opts) => recall(id, slide, f, prompt, [], accept, hints, sol, o)

export function calc(id: string, slide: number, f: string[], prompt: string, value: number, tol: number, unit: string, hints: Hint[], sol: string, o?: Opts): QuestionInput {
  return q({ ...common(id, slide, f, prompt, hints, sol, { d: 2, ...o }), type: 'calc', answer: { value, tol, unit } })
}

export function label(id: string, slide: number, f: string[], prompt: string, objects: string[], scene: Scene, hints: Hint[], sol: string, o?: Opts): QuestionInput {
  return q({ ...common(id, slide, f, prompt, hints, sol, { obj: objects[0], ...o }), type: 'label', scene, answer: { objects } })
}

export function act(id: string, slide: number, f: string[], prompt: string, scene: Scene, target: Target, solve: Scene, hints: Hint[], sol: string, o?: Opts): QuestionInput {
  return q({ ...common(id, slide, f, prompt, hints, sol, { d: 2, ...o, scene }), type: 'do', answer: { target, solve } })
}

export function predict(id: string, slide: number, f: string[], prompt: string, scene: Scene, options: string[], correct: number, reveal: Scene, result: string, hints: Hint[], sol: string, o?: Opts): QuestionInput {
  return q({ ...common(id, slide, f, prompt, hints, sol, { d: 2, ...o, scene }), type: 'predict', answer: { options, correct, reveal, result } })
}

/* scenes used across files */
export const CELL: Scene = { layer: 'cell', view: 'explore' }
export const SECTION27: Scene = { layer: 'cell', view: 'section', section: 'slide27' }
export const LOGIC = (tab: 'inverter' | 'switch' | 'nand' | 'nor' | 'junction', a: 0 | 1 = 0, b: 0 | 1 = 0): Scene => ({ layer: 'cell', view: 'logic', bench: { tab }, inputs: { a, b } })
export const FAB = (step: string): Scene => ({ layer: 'cell', view: 'fab', step })
export const LAYOUT = (edit = false): Scene => ({ layer: 'cell', view: 'layout', resetLayout: true, layers: ['nwell', 'poly', 'nplus', 'pplus', 'contact', 'metal'], editMode: edit })
export const JUNCTION = (v: number, ratio = 1): Scene => ({ layer: 'cell', view: 'logic', bench: { tab: 'junction', v, ratio } })
