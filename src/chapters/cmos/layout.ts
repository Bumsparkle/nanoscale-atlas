import type { Mask, Rect } from '../../sim/types'
import { GRID, MASKS } from './masks'

/**
 * The editable layout: the six masks of slide 28 as λ-grid rectangles.
 * The default is the slide 27–28 mask set from masks.ts. Edits in the
 * Layout view replace the current layout; the recipe, the simulator, the
 * 3D cell, the cross-sections and the rule checker all read from here.
 */
export type MaskId = 'nwell' | 'poly' | 'nplus' | 'pplus' | 'contact' | 'metal'
export type Side = 'x0' | 'x1' | 'y0' | 'y1'
export type Layout = Record<MaskId, Rect[]>

export const MASK_IDS: MaskId[] = ['nwell', 'poly', 'nplus', 'pplus', 'contact', 'metal']

/** names used in URLs (?layers=poly,ndiff) */
export const URL_LAYER: Record<MaskId, string> = { nwell: 'nwell', poly: 'poly', nplus: 'ndiff', pplus: 'pdiff', contact: 'contact', metal: 'metal' }
export const FROM_URL_LAYER: Record<string, MaskId> = Object.fromEntries(MASK_IDS.map((m) => [URL_LAYER[m], m]))

export const MASK_NAME: Record<MaskId, string> = Object.fromEntries(MASKS.map((m) => [m.id, m.name])) as Record<MaskId, string>

export const DEFAULT_LAYOUT: Layout = Object.fromEntries(MASKS.map((m) => [m.id, m.rects.map((r) => ({ ...r }))])) as Layout

/** layout bounds: the simulation grid (λ) */
export const BOUNDS = { x0: GRID.x0, y0: GRID.y0, x1: GRID.x0 + GRID.nx * GRID.d, y1: GRID.y0 + GRID.ny * GRID.d }

/** snap a coordinate to the λ grid */
export const snap = (v: number) => Math.round(v) + 0

/**
 * Move one edge of one rectangle to `value` (λ), snapped to the grid,
 * clamped to the bounds and so the rectangle stays at least 1λ wide.
 * Returns a new layout; the input is never mutated.
 */
export function moveEdge(layout: Layout, mask: MaskId, index: number, side: Side, value: number): Layout {
  const r = layout[mask][index]
  if (!r) return layout
  let v = snap(value)
  if (side === 'x0') v = Math.min(Math.max(v, BOUNDS.x0), r.x1 - 1)
  if (side === 'x1') v = Math.max(Math.min(v, BOUNDS.x1), r.x0 + 1)
  if (side === 'y0') v = Math.min(Math.max(v, BOUNDS.y0), r.y1 - 1)
  if (side === 'y1') v = Math.max(Math.min(v, BOUNDS.y1), r.y0 + 1)
  if (v === r[side]) return layout
  const rects = layout[mask].map((q, i) => (i === index ? { ...q, [side]: v } : q))
  return { ...layout, [mask]: rects }
}

export function layoutEquals(a: Layout, b: Layout) {
  return MASK_IDS.every((m) => a[m].length === b[m].length && a[m].every((r, i) => r.x0 === b[m][i].x0 && r.x1 === b[m][i].x1 && r.y0 === b[m][i].y0 && r.y1 === b[m][i].y1))
}

/** Mask objects for the recipe */
export function masksOf(layout: Layout): Record<MaskId, Mask> {
  return Object.fromEntries(MASKS.map((m) => [m.id, { ...m, rects: layout[m.id as MaskId] }])) as Record<MaskId, Mask>
}

/* ── current layout (module state; the UI mirrors its version into the store) ── */
let current: Layout = DEFAULT_LAYOUT
let version = 0
const listeners = new Set<() => void>()

export const layoutState = {
  get: () => current,
  version: () => version,
  set(l: Layout) {
    if (l === current) return
    current = l
    version++
    listeners.forEach((f) => f())
  },
  reset() {
    this.set(DEFAULT_LAYOUT)
  },
  isDefault: () => current === DEFAULT_LAYOUT || layoutEquals(current, DEFAULT_LAYOUT),
  subscribe(f: () => void) {
    listeners.add(f)
    return () => void listeners.delete(f)
  },
}

/**
 * Transistors in a layout: wherever a poly rectangle crosses a diffusion
 * rectangle. L is the poly width across the diffusion (the source–drain
 * distance, slide 46); W is the diffusion extent along the gate.
 */
export interface Transistor {
  type: 'nmos' | 'pmos'
  L: number
  W: number
  /** gate centre (λ) */
  at: [number, number]
}

export function transistors(layout: Layout): Transistor[] {
  const out: Transistor[] = []
  const diffs = [...layout.nplus.map((d) => ({ d, type: 'nmos' as const })), ...layout.pplus.map((d) => ({ d, type: 'pmos' as const }))]
  for (const p of layout.poly)
    for (const { d, type } of diffs) {
      const ox0 = Math.max(p.x0, d.x0)
      const ox1 = Math.min(p.x1, d.x1)
      const oy0 = Math.max(p.y0, d.y0)
      const oy1 = Math.min(p.y1, d.y1)
      if (ox1 <= ox0 || oy1 <= oy0) continue
      // the gate crosses the diffusion: vertical poly spans it in y, horizontal in x
      const vertical = p.y0 <= d.y0 && p.y1 >= d.y1
      const horizontal = p.x0 <= d.x0 && p.x1 >= d.x1
      if (!vertical && !horizontal) continue
      // the n-well diffusion of type p is the pMOS; taps have no poly over them
      out.push({ type, L: vertical ? ox1 - ox0 : oy1 - oy0, W: vertical ? oy1 - oy0 : ox1 - ox0, at: [(ox0 + ox1) / 2, (oy0 + oy1) / 2] })
    }
  return out
}
