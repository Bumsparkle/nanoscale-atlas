import type { Model, Op } from './types'
import type { SourceRef } from '../sources'

export type StepKind = 'start' | 'oxidise' | 'deposit' | 'spin' | 'expose' | 'develop' | 'etch' | 'strip' | 'implant' | 'sputter'

export interface Step {
  id: string
  title: string
  /** lecture slide this step is drawn on */
  source: SourceRef
  /** module / phase, for grouping ticks on the timeline */
  group: string
  kind: StepKind
  tool: string
  chemistry: string
  /** one short sentence in a demonstrator's voice */
  note: string
  /** anything stated that is not on the slides, with its source */
  beyond?: string
  mask?: string
  op: Op
}

/**
 * Runs a recipe once and memoises the model after every step, so the
 * timeline can scrub instantly. `at(s)` evaluates fractional positions by
 * running step ⌈s⌉ at partial progress on the previous snapshot.
 */
export class Process {
  readonly snapshots: Model[]
  constructor(
    readonly initial: Model,
    readonly steps: Step[],
  ) {
    const snaps: Model[] = []
    let m = initial
    for (const s of steps) {
      m = s.op(m, 1)
      snaps.push(m)
    }
    this.snapshots = snaps
  }
  get length() {
    return this.steps.length
  }
  /** model after step k (k = 0 is the first step) */
  snapshot(k: number): Model {
    const i = Math.max(0, Math.min(this.steps.length - 1, Math.round(k)))
    return this.snapshots[i]
  }
  /** continuous position: s = k means "after step k"; s = k + t is step k+1 at progress t */
  at(s: number): Model {
    const max = this.steps.length - 1
    s = Math.max(0, Math.min(max, s))
    const k = Math.floor(s + 1e-9)
    const t = s - k
    if (t < 1e-6 || k >= max) return this.snapshots[k]
    return this.steps[k + 1].op(this.snapshots[k], t)
  }
  final(): Model {
    return this.snapshots[this.snapshots.length - 1]
  }
  indexOf(id: string) {
    return this.steps.findIndex((s) => s.id === id)
  }
}
