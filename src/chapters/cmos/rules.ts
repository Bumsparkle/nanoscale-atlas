import type { Rect } from '../../sim/types'
import { DEFAULT_LAYOUT, type Layout, type MaskId, type Side } from './layout'

/**
 * Slide 47 "Simplified Design Rules" (conservative λ rules), transcribed by
 * hand from the slide image. Values in λ.
 *
 *   Metal1:       width 4λ, spacing 4λ
 *   Metal2:       width 4λ, spacing 4λ          (not used in the inverter)
 *   Diffusion:    width 4λ, spacing 4λ
 *   Polysilicon:  width 2λ, spacing 3λ
 *   Poly gate extends 2λ beyond the diffusion it crosses
 *   n-well:       diffusion 6λ inside the well edge; 6λ outside it
 *   Metal1–diffusion contact: metal surrounds the contact by 1λ
 *   Metal1–poly contact: contact 2λ × 2λ
 *   Metal1–metal2 vias: spacing 3λ                (not used)
 *
 * Contacts are 2λ × 2λ and the diffusion also surrounds them by 1λ (the
 * slide 47 figure draws the cut inside both layers with the same margin).
 */
export const RULES = {
  metal1: { width: 4, spacing: 4 },
  metal2: { width: 4, spacing: 4 },
  diffusion: { width: 4, spacing: 4 },
  poly: { width: 2, spacing: 3, gateExtension: 2 },
  nwell: { diffInside: 6, diffOutside: 6 },
  contact: { size: 2, metalSurround: 1, diffSurround: 1 },
  via: { size: 2, spacing: 3 },
} as const

export type RuleId =
  | 'metal1.width' | 'metal1.spacing'
  | 'metal2.width' | 'metal2.spacing'
  | 'diffusion.width' | 'diffusion.spacing'
  | 'poly.width' | 'poly.spacing' | 'poly.gateExtension'
  | 'nwell.diffInside' | 'nwell.diffOutside'
  | 'contact.size' | 'contact.metalSurround' | 'contact.diffSurround'
  | 'via.spacing'

export const RULE_LABEL: Record<RuleId, string> = {
  'metal1.width': 'Metal1 width',
  'metal1.spacing': 'Metal1 spacing',
  'metal2.width': 'Metal2 width',
  'metal2.spacing': 'Metal2 spacing',
  'diffusion.width': 'Diffusion width',
  'diffusion.spacing': 'Diffusion spacing',
  'poly.width': 'Poly width',
  'poly.spacing': 'Poly spacing',
  'poly.gateExtension': 'Poly past diffusion',
  'nwell.diffInside': 'Diffusion inside n-well',
  'nwell.diffOutside': 'Diffusion outside n-well',
  'contact.size': 'Contact size',
  'contact.metalSurround': 'Metal over contact',
  'contact.diffSurround': 'Diffusion around contact',
  'via.spacing': 'Via spacing',
}

/** one rectangle side of one mask, identifying an edge the user can hover or drag */
export interface EdgeRef {
  mask: MaskId
  index: number
  side: Side
}

export interface RuleCheck {
  id: string
  rule: RuleId
  required: number
  measured: number
  ok: boolean
  /** exactly at the minimum: the tight spots */
  tight: boolean
  /** layout segment (λ) the measurement spans: the dimension line */
  a: [number, number]
  b: [number, number]
  /** edges this check constrains */
  edges: EdgeRef[]
  slide: number
  /** exact rules (contact size) must equal, not exceed, the value */
  exact?: boolean
}

type R = Rect & { mask: MaskId; index: number }

const touching = (a: Rect, b: Rect) => a.x0 <= b.x1 && b.x0 <= a.x1 && a.y0 <= b.y1 && b.y0 <= a.y1
const overlaps = (a: Rect, b: Rect) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1
const contains = (o: Rect, i: Rect) => i.x0 >= o.x0 && i.x1 <= o.x1 && i.y0 >= o.y0 && i.y1 <= o.y1
const rectsOf = (layout: Layout, mask: MaskId): R[] => layout[mask].map((r, index) => ({ ...r, mask, index }))
const e = (r: R, side: Side): EdgeRef => ({ mask: r.mask, index: r.index, side })

function make(rule: RuleId, required: number, measured: number, a: [number, number], b: [number, number], edges: EdgeRef[], exact = false): RuleCheck {
  const m = Math.round(measured * 1000) / 1000
  const ok = exact ? m === required : m >= required - 1e-9
  return { id: '', rule, required, measured: m, ok, tight: ok && Math.abs(m - required) < 1e-9, a, b, edges, slide: 47, exact }
}

/** width in both directions: every rectangle side is covered by at least this rule */
export function widthChecks(rects: R[], rule: RuleId, min: number): RuleCheck[] {
  const out: RuleCheck[] = []
  for (const r of rects) {
    const cy = (r.y0 + r.y1) / 2
    const cx = (r.x0 + r.x1) / 2
    out.push(make(rule, min, r.x1 - r.x0, [r.x0, cy], [r.x1, cy], [e(r, 'x0'), e(r, 'x1')]))
    out.push(make(rule, min, r.y1 - r.y0, [cx, r.y0], [cx, r.y1], [e(r, 'y0'), e(r, 'y1')]))
  }
  return out
}

/** gap between two rectangles: distance, the dimension line, and the facing edges */
function gap(a: R, b: R): { d: number; pa: [number, number]; pb: [number, number]; edges: EdgeRef[] } {
  const dx = Math.max(0, b.x0 - a.x1, a.x0 - b.x1)
  const dy = Math.max(0, b.y0 - a.y1, a.y0 - b.y1)
  const left = a.x1 <= b.x0 ? a : b
  const right = left === a ? b : a
  const low = a.y1 <= b.y0 ? a : b
  const high = low === a ? b : a
  if (dy === 0) {
    const ym = (Math.max(a.y0, b.y0) + Math.min(a.y1, b.y1)) / 2
    return { d: dx, pa: [left.x1, ym], pb: [right.x0, ym], edges: [e(left, 'x1'), e(right, 'x0')] }
  }
  if (dx === 0) {
    const xm = (Math.max(a.x0, b.x0) + Math.min(a.x1, b.x1)) / 2
    return { d: dy, pa: [xm, low.y1], pb: [xm, high.y0], edges: [e(low, 'y1'), e(high, 'y0')] }
  }
  return {
    d: Math.hypot(dx, dy),
    pa: [left.x1, low === left ? left.y1 : left.y0],
    pb: [right.x0, low === right ? right.y1 : right.y0],
    edges: [e(left, 'x1'), e(right, 'x0'), e(low, 'y1'), e(high, 'y0')],
  }
}

/** spacing between separate shapes of one layer (touching rectangles are one polygon) */
export function spacingChecks(rects: R[], rule: RuleId, min: number, reach = Infinity): RuleCheck[] {
  const out: RuleCheck[] = []
  for (let i = 0; i < rects.length; i++)
    for (let j = i + 1; j < rects.length; j++) {
      if (touching(rects[i], rects[j])) continue
      const g = gap(rects[i], rects[j])
      if (g.d > reach) continue
      out.push(make(rule, min, g.d, g.pa, g.pb, g.edges))
    }
  return out
}

/** inner rectangle surrounded by one of the outer rectangles, side by side */
function surroundChecks(inner: R, outers: R[], rule: RuleId, min: number): RuleCheck[] {
  const host = outers.filter((o) => overlaps(o, inner)).sort((a, b) => (contains(b, inner) ? 1 : 0) - (contains(a, inner) ? 1 : 0))[0]
  const cx = (inner.x0 + inner.x1) / 2
  const cy = (inner.y0 + inner.y1) / 2
  if (!host) return [make(rule, min, 0, [inner.x0, cy], [inner.x1, cy], [e(inner, 'x0'), e(inner, 'x1'), e(inner, 'y0'), e(inner, 'y1')])]
  return [
    make(rule, min, inner.x0 - host.x0, [host.x0, cy], [inner.x0, cy], [e(host, 'x0'), e(inner, 'x0')]),
    make(rule, min, host.x1 - inner.x1, [inner.x1, cy], [host.x1, cy], [e(inner, 'x1'), e(host, 'x1')]),
    make(rule, min, inner.y0 - host.y0, [cx, host.y0], [cx, inner.y0], [e(host, 'y0'), e(inner, 'y0')]),
    make(rule, min, host.y1 - inner.y1, [cx, inner.y1], [cx, host.y1], [e(inner, 'y1'), e(host, 'y1')]),
  ]
}

/** Check a layout against every slide 47 rule that applies to it. */
export function checkLayout(layout: Layout): RuleCheck[] {
  const out: RuleCheck[] = []
  const metal = rectsOf(layout, 'metal')
  const nplus = rectsOf(layout, 'nplus')
  const pplus = rectsOf(layout, 'pplus')
  const poly = rectsOf(layout, 'poly')
  const contact = rectsOf(layout, 'contact')
  const nwell = rectsOf(layout, 'nwell')
  const diffs = [...nplus, ...pplus]

  out.push(...widthChecks(metal, 'metal1.width', RULES.metal1.width))
  out.push(...spacingChecks(metal, 'metal1.spacing', RULES.metal1.spacing))
  out.push(...widthChecks(nplus, 'diffusion.width', RULES.diffusion.width))
  out.push(...widthChecks(pplus, 'diffusion.width', RULES.diffusion.width))
  out.push(...spacingChecks(nplus, 'diffusion.spacing', RULES.diffusion.spacing))
  out.push(...spacingChecks(pplus, 'diffusion.spacing', RULES.diffusion.spacing))
  out.push(...widthChecks(poly, 'poly.width', RULES.poly.width))
  out.push(...spacingChecks(poly, 'poly.spacing', RULES.poly.spacing))

  // the gate: poly crossing a diffusion overhangs it by 2λ at both ends
  for (const p of poly)
    for (const d of diffs) {
      if (!overlaps(p, d)) continue
      const vertical = p.y1 - p.y0 >= p.x1 - p.x0
      const ext = RULES.poly.gateExtension
      if (vertical) {
        const cx = (Math.max(p.x0, d.x0) + Math.min(p.x1, d.x1)) / 2
        out.push(make('poly.gateExtension', ext, d.y0 - p.y0, [cx, p.y0], [cx, d.y0], [e(p, 'y0'), e(d, 'y0')]))
        out.push(make('poly.gateExtension', ext, p.y1 - d.y1, [cx, d.y1], [cx, p.y1], [e(d, 'y1'), e(p, 'y1')]))
      } else {
        const cy = (Math.max(p.y0, d.y0) + Math.min(p.y1, d.y1)) / 2
        out.push(make('poly.gateExtension', ext, d.x0 - p.x0, [p.x0, cy], [d.x0, cy], [e(p, 'x0'), e(d, 'x0')]))
        out.push(make('poly.gateExtension', ext, p.x1 - d.x1, [d.x1, cy], [p.x1, cy], [e(d, 'x1'), e(p, 'x1')]))
      }
    }

  // n-well: diffusion inside sits ≥ 6λ from every well edge; diffusion outside stays ≥ 6λ away
  for (const w of nwell)
    for (const d of diffs) {
      if (contains(w, d) || overlaps(w, d)) out.push(...surroundChecks(d, [w], 'nwell.diffInside', RULES.nwell.diffInside))
      else {
        const g = gap(w, d)
        if (g.d <= 3 * RULES.nwell.diffOutside) out.push(make('nwell.diffOutside', RULES.nwell.diffOutside, g.d, g.pa, g.pb, g.edges))
      }
    }

  // contacts: exactly 2λ × 2λ, surrounded 1λ by metal and by diffusion (or poly)
  for (const c of contact) {
    const cy = (c.y0 + c.y1) / 2
    const cx = (c.x0 + c.x1) / 2
    out.push(make('contact.size', RULES.contact.size, c.x1 - c.x0, [c.x0, cy], [c.x1, cy], [e(c, 'x0'), e(c, 'x1')], true))
    out.push(make('contact.size', RULES.contact.size, c.y1 - c.y0, [cx, c.y0], [cx, c.y1], [e(c, 'y0'), e(c, 'y1')], true))
    out.push(...surroundChecks(c, metal, 'contact.metalSurround', RULES.contact.metalSurround))
    out.push(...surroundChecks(c, [...diffs, ...poly], 'contact.diffSurround', RULES.contact.diffSurround))
  }

  return out.map((c, i) => ({ ...c, id: `${c.rule}#${i}` }))
}

/** metal2 and vias are in the slide 47 table but not in the inverter; checked generically */
export function checkMetal2(rects: Rect[]): RuleCheck[] {
  const rs = rects.map((r, index) => ({ ...r, mask: 'metal' as MaskId, index }))
  return [...widthChecks(rs, 'metal2.width', RULES.metal2.width), ...spacingChecks(rs, 'metal2.spacing', RULES.metal2.spacing)]
}
export function checkVias(rects: Rect[]): RuleCheck[] {
  const rs = rects.map((r, index) => ({ ...r, mask: 'contact' as MaskId, index }))
  return spacingChecks(rs, 'via.spacing', RULES.via.spacing)
}

/** checks that constrain a given edge */
export function checksForEdge(checks: RuleCheck[], edge: EdgeRef) {
  return checks.filter((c) => c.edges.some((x) => x.mask === edge.mask && x.index === edge.index && x.side === edge.side))
}

/** one-line description, e.g. "Poly width: 2λ (min 2λ) · slide 47" */
export function describe(c: RuleCheck) {
  const v = (n: number) => (Number.isInteger(n) ? n : n.toFixed(1)) + 'λ'
  const req = c.exact ? `must be ${v(c.required)}` : `min ${v(c.required)}`
  const short = c.ok ? '' : c.exact ? ` · off by ${v(Math.abs(c.measured - c.required))}` : ` · short by ${v(c.required - c.measured)}`
  return `${RULE_LABEL[c.rule]}: ${v(c.measured)} (${req})${short} · slide ${c.slide}`
}

/** default layout, kept for the original call sites */
export function checkRules(): RuleCheck[] {
  return checkLayout(DEFAULT_LAYOUT)
}
