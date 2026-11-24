import { evaluate, GATES, channelStrength } from '../chapters/cmos/device'
import { junction } from '../chapters/cmos/junction'
import { DEFAULT_LAYOUT, layoutState, moveEdge, transistors, type Layout, type MaskId } from '../chapters/cmos/layout'
import { checkLayout } from '../chapters/cmos/rules'
import { STEPS } from '../chapters/cmos/recipe'
import { SNAP_TARGETS, type AppState } from '../state/store'
import { defaultTab } from '../chapters/cmos/layers'
import type { Question, Scene, Target } from './schema'

/**
 * Pure question logic: scene → store patch, target checks against the real
 * app state, and grading. No rendering, so the build tests use exactly the
 * code the UI uses.
 */

export const stepIndex = (id: string) => STEPS.findIndex((s) => s.id === id)

/** the store patch for a scene (layer changes are animated by the UI, then this is applied) */
export function scenePatch(sc: Scene, st: AppState): Partial<AppState> {
  const p: Partial<AppState> = {}
  if (sc.layer) p.layer = sc.layer
  if (sc.device) p.device = sc.device
  if (sc.view) p.view = sc.view
  if (sc.step != null) {
    p.step = Math.max(0, stepIndex(sc.step))
    p.playing = false
  }
  if (sc.section !== undefined) {
    if (sc.section === null) p.section = { ...st.section, locked: null, gap: 0 }
    else {
      const t = SNAP_TARGETS[sc.section]
      p.section = { axis: t.axis, offset: t.offset, locked: sc.section, gap: 1 }
    }
  }
  if (sc.inputs) p.inputs = sc.inputs
  if (sc.vg != null) p.vg = sc.vg
  if (sc.lattice) p.lattice = sc.lattice
  if (sc.bench) p.bench = { ...st.bench, ...sc.bench }
  if (sc.layers) p.layoutLayers = sc.layers
  if (sc.editMode != null) p.layoutEdit = sc.editMode
  if (sc.look !== undefined) p.look = sc.look
  if (sc.tab != null) p.tab = sc.tab
  else if (sc.layer && sc.layer !== st.layer) p.tab = defaultTab(sc.layer)
  if (sc.growth) p.growth = { ...st.growth, ...sc.growth } as AppState['growth']
  if (sc.crystal) p.crystal = { ...st.crystal, ...sc.crystal } as AppState['crystal']
  if (sc.proc) p.proc = { ...st.proc, ...sc.proc } as AppState['proc']
  if (sc.clean) p.clean = { ...st.clean, ...sc.clean } as AppState['clean']
  if (sc.films) p.films = { ...st.films, ...sc.films } as AppState['films']
  if (sc.epi) p.epi = { ...st.epi, ...sc.epi } as AppState['epi']
  if (sc.litho) p.litho = { ...st.litho, ...sc.litho } as AppState['litho']
  if (sc.nano) p.nano = { ...st.nano, ...sc.nano } as AppState['nano']
  return p
}

/** read a dotted path from the store */
export function readPath(st: AppState, path: string): unknown {
  return path.split('.').reduce<unknown>((o, k) => (o == null ? undefined : (o as Record<string, unknown>)[k]), st)
}

/** layout part of a scene */
export function sceneLayout(sc: Scene, current: Layout): Layout {
  let l = sc.resetLayout ? DEFAULT_LAYOUT : current
  for (const e of sc.edits ?? []) l = moveEdge(l, e.mask as MaskId, e.index, e.side, e.value)
  return l
}

/** apply a scene synchronously (tests, and the UI once any layer transition has finished) */
export function applySceneNow(sc: Scene, store: { getState: () => AppState; setState: (p: Partial<AppState>) => void }) {
  if (sc.resetLayout || sc.edits?.length) layoutState.set(sceneLayout(sc, layoutState.get()))
  store.setState(scenePatch(sc, store.getState()))
}

/** is the target reached in this app state? */
export function checkTarget(t: Target, st: AppState, layout: Layout): boolean {
  switch (t.kind) {
    case 'gate': {
      const tab = t.gate === 'INV' ? 'inverter' : t.gate.toLowerCase()
      if (st.layer !== 'cell' || st.view !== 'logic' || st.bench.tab !== tab) return false
      const ins = { A: st.inputs.a, B: t.gate === 'INV' ? 0 : st.inputs.b } as const
      if (t.a != null && st.inputs.a !== t.a) return false
      if (t.b != null && st.inputs.b !== t.b) return false
      if (t.y != null && evaluate(GATES[t.gate], ins) !== t.y) return false
      return true
    }
    case 'switch':
      return st.layer === 'cell' && st.view === 'logic' && st.bench.tab === 'switch' && st.bench.g === t.g
    case 'section':
      return st.layer === 'cell' && st.view === 'section' && st.section.locked === t.cut
    case 'fab':
      return st.layer === 'cell' && st.view === 'fab' && t.steps.includes(STEPS[Math.round(st.step)]?.id)
    case 'layoutViolation':
      return checkLayout(layout).some((c) => !c.ok && c.rule === t.rule)
    case 'layoutClean': {
      if (checkLayout(layout).some((c) => !c.ok)) return false
      const fets = transistors(layout)
      const n = fets.find((f) => f.type === 'nmos')
      const p = fets.find((f) => f.type === 'pmos')
      if (t.nmosL != null && n?.L !== t.nmosL) return false
      if (t.nmosW != null && n?.W !== t.nmosW) return false
      if (t.pmosL != null && p?.L !== t.pmosL) return false
      if (t.pmosW != null && p?.W !== t.pmosW) return false
      return true
    }
    case 'layers': {
      if (st.layer !== 'cell' || st.view !== 'layout') return false
      const a = [...st.layoutLayers].sort().join()
      return a === [...t.layers].sort().join()
    }
    case 'vg':
      return st.layer === 'transistor' && st.device === t.device && channelStrength(t.device, st.vg) > 0.5 === t.on
    case 'lattice':
      return st.layer === 'lattice' && (t.structure == null || st.lattice.structure === t.structure) && (t.dopant == null || st.lattice.dopant === t.dopant)
    case 'junction': {
      if (st.layer !== 'cell' || st.view !== 'logic' || st.bench.tab !== 'junction') return false
      const j = junction(st.bench.v, st.bench.ratio)
      const regime = st.bench.v > 0.05 ? 'forward' : st.bench.v < -0.05 ? 'reverse' : 'zero'
      if (regime !== t.regime) return false
      if (t.minWidth != null && j.W < t.minWidth) return false
      if (t.maxWidth != null && j.W > t.maxWidth) return false
      if (t.wpOverWn === '>1' && !(j.Wp > j.Wn * 1.05)) return false
      if (t.wpOverWn === '<1' && !(j.Wp < j.Wn / 1.05)) return false
      return true
    }
    case 'layer':
      return st.layer === t.layer && (t.device == null || st.device === t.device)
    case 'state': {
      if (st.layer !== t.layer || (t.tab != null && st.tab !== t.tab)) return false
      return t.checks.every((c) => {
        const v = readPath(st, c.path)
        if (c.eq !== undefined) return JSON.stringify(v) === JSON.stringify(c.eq)
        if (typeof v !== 'number') return false
        return (c.min == null || v >= c.min - 1e-9) && (c.max == null || v <= c.max + 1e-9)
      })
    }
  }
}

export type Response =
  | { kind: 'choice'; index: number }
  | { kind: 'text'; text: string }
  | { kind: 'number'; value: number }
  | { kind: 'click'; object: string | null }
  | { kind: 'state' }

const norm = (s: string) => s.toLowerCase().replace(/[\s.,;:'"`()-]+/g, ' ').replace(/µ/g, 'u').trim()

/** grade a response; "do" grades the live state */
export function grade(q: Question, r: Response, st: AppState, layout: Layout): boolean {
  switch (q.type) {
    case 'do':
      return checkTarget(q.answer.target, st, layout)
    case 'predict':
      return r.kind === 'choice' && r.index === q.answer.correct
    case 'calc':
      return r.kind === 'number' && Number.isFinite(r.value) && Math.abs(r.value - q.answer.value) <= q.answer.tol + 1e-12
    case 'label':
      return r.kind === 'click' && r.object != null && q.answer.objects.includes(r.object)
    case 'recall':
      if ('options' in q.answer) return r.kind === 'choice' && r.index === q.answer.correct
      return r.kind === 'text' && q.answer.accept.some((a) => norm(a) === norm(r.text))
  }
}

/** a correct response for a question (tests, and worked-solution "show me") */
export function correctResponse(q: Question): Response {
  switch (q.type) {
    case 'do':
      return { kind: 'state' }
    case 'predict':
      return { kind: 'choice', index: q.answer.correct }
    case 'calc':
      return { kind: 'number', value: q.answer.value }
    case 'label':
      return { kind: 'click', object: q.answer.objects[0] }
    case 'recall':
      return 'options' in q.answer ? { kind: 'choice', index: q.answer.correct } : { kind: 'text', text: q.answer.accept[0] }
  }
}
