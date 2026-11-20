import type { Mask, Rect } from '../../sim/types'
import { CONTACT, METAL, NPLUS, NWELL, POLY, PPLUS } from './masks'

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
  via: { spacing: 3 },
} as const

export type RuleId =
  | 'metal1.width' | 'metal1.spacing'
  | 'diffusion.width' | 'diffusion.spacing'
  | 'poly.width' | 'poly.spacing' | 'poly.gateExtension'
  | 'nwell.diffInside' | 'nwell.diffOutside'
  | 'contact.size' | 'contact.metalSurround' | 'contact.diffSurround'

export interface RuleCheck {
  rule: RuleId
  required: number
  measured: number
  ok: boolean
  /** layout segment (λ) the measurement spans, for the hover overlay */
  a: [number, number]
  b: [number, number]
  layer: string
  note: string
}

const touching = (a: Rect, b: Rect) => a.x0 <= b.x1 && b.x0 <= a.x1 && a.y0 <= b.y1 && b.y0 <= a.y1
const overlaps = (a: Rect, b: Rect) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1
const contains = (o: Rect, i: Rect) => i.x0 >= o.x0 && i.x1 <= o.x1 && i.y0 >= o.y0 && i.y1 <= o.y1

function gap(a: Rect, b: Rect): { d: number; pa: [number, number]; pb: [number, number] } {
  const dx = Math.max(0, b.x0 - a.x1, a.x0 - b.x1)
  const dy = Math.max(0, b.y0 - a.y1, a.y0 - b.y1)
  const ym = (Math.max(a.y0, b.y0) + Math.min(a.y1, b.y1)) / 2
  const xm = (Math.max(a.x0, b.x0) + Math.min(a.x1, b.x1)) / 2
  if (dy === 0) {
    const left = a.x1 <= b.x0 ? a : b
    const right = left === a ? b : a
    return { d: dx, pa: [left.x1, ym], pb: [right.x0, ym] }
  }
  if (dx === 0) {
    const low = a.y1 <= b.y0 ? a : b
    const high = low === a ? b : a
    return { d: dy, pa: [xm, low.y1], pb: [xm, high.y0] }
  }
  return { d: Math.hypot(dx, dy), pa: [a.x1, a.y1], pb: [b.x0, b.y0] }
}

function widthChecks(mask: Mask, rule: RuleId, min: number, out: RuleCheck[]) {
  for (const r of mask.rects) {
    const w = Math.min(r.x1 - r.x0, r.y1 - r.y0)
    const horiz = r.x1 - r.x0 <= r.y1 - r.y0
    const cy = (r.y0 + r.y1) / 2
    const cx = (r.x0 + r.x1) / 2
    out.push({
      rule, required: min, measured: w, ok: w >= min - 1e-9, layer: mask.id,
      a: horiz ? [r.x0, cy] : [cx, r.y0], b: horiz ? [r.x1, cy] : [cx, r.y1],
      note: `${mask.name} width ≥ ${min}λ`,
    })
  }
}

function spacingChecks(rects: Rect[], rule: RuleId, min: number, layer: string, name: string, out: RuleCheck[]) {
  for (let i = 0; i < rects.length; i++)
    for (let j = i + 1; j < rects.length; j++) {
      if (touching(rects[i], rects[j])) continue
      const g = gap(rects[i], rects[j])
      out.push({ rule, required: min, measured: g.d, ok: g.d >= min - 1e-9, a: g.pa, b: g.pb, layer, note: `${name} spacing ≥ ${min}λ` })
    }
}

export function checkRules(): RuleCheck[] {
  const out: RuleCheck[] = []
  widthChecks(METAL, 'metal1.width', RULES.metal1.width, out)
  spacingChecks(METAL.rects, 'metal1.spacing', RULES.metal1.spacing, 'metal', 'Metal1', out)
  widthChecks(NPLUS, 'diffusion.width', RULES.diffusion.width, out)
  widthChecks(PPLUS, 'diffusion.width', RULES.diffusion.width, out)
  spacingChecks(NPLUS.rects, 'diffusion.spacing', RULES.diffusion.spacing, 'nplus', 'n+ diffusion', out)
  spacingChecks(PPLUS.rects, 'diffusion.spacing', RULES.diffusion.spacing, 'pplus', 'p+ diffusion', out)
  widthChecks(POLY, 'poly.width', RULES.poly.width, out)
  spacingChecks(POLY.rects, 'poly.spacing', RULES.poly.spacing, 'poly', 'Poly', out)

  const diffs = [...NPLUS.rects, ...PPLUS.rects]
  // gate extension: every poly rect that crosses a diffusion overhangs it by ≥ 2λ on both ends
  for (const p of POLY.rects)
    for (const d of diffs) {
      if (!overlaps(p, d)) continue
      const vertical = p.y1 - p.y0 > p.x1 - p.x0
      if (vertical) {
        const lo = d.y0 - p.y0
        const hi = p.y1 - d.y1
        const cx = (p.x0 + p.x1) / 2
        out.push({ rule: 'poly.gateExtension', required: 2, measured: lo, ok: lo >= 2, layer: 'poly', a: [cx, p.y0], b: [cx, d.y0], note: 'Poly extends ≥ 2λ past diffusion' })
        out.push({ rule: 'poly.gateExtension', required: 2, measured: hi, ok: hi >= 2, layer: 'poly', a: [cx, d.y1], b: [cx, p.y1], note: 'Poly extends ≥ 2λ past diffusion' })
      }
    }

  // n-well: diffusion inside is ≥ 6λ from the edge, diffusion outside is ≥ 6λ away
  for (const w of NWELL.rects)
    for (const d of diffs) {
      const cy = (d.y0 + d.y1) / 2
      const cx = (d.x0 + d.x1) / 2
      if (contains(w, d)) {
        const margins: [number, [number, number], [number, number]][] = [
          [d.x0 - w.x0, [w.x0, cy], [d.x0, cy]],
          [w.x1 - d.x1, [d.x1, cy], [w.x1, cy]],
          [d.y0 - w.y0, [cx, w.y0], [cx, d.y0]],
          [w.y1 - d.y1, [cx, d.y1], [cx, w.y1]],
        ]
        const m = margins.reduce((a, b) => (b[0] < a[0] ? b : a))
        out.push({ rule: 'nwell.diffInside', required: 6, measured: m[0], ok: m[0] >= 6, layer: 'nwell', a: m[1], b: m[2], note: 'Diffusion ≥ 6λ inside the n-well' })
      } else {
        const g = gap(w, d)
        if (g.d > 18) continue
        out.push({ rule: 'nwell.diffOutside', required: 6, measured: g.d, ok: g.d >= 6, layer: 'nwell', a: g.pa, b: g.pb, note: 'Diffusion ≥ 6λ outside the n-well' })
      }
    }

  // contacts: 2λ × 2λ, surrounded 1λ by metal and by diffusion
  for (const c of CONTACT.rects) {
    const s = Math.min(c.x1 - c.x0, c.y1 - c.y0)
    const cy = (c.y0 + c.y1) / 2
    out.push({ rule: 'contact.size', required: 2, measured: s, ok: s === 2 && c.x1 - c.x0 === c.y1 - c.y0, layer: 'contact', a: [c.x0, cy], b: [c.x1, cy], note: 'Contact is 2λ × 2λ' })
    const surround = (rs: Rect[]) => {
      let best = -Infinity
      for (const r of rs) if (contains(r, c)) best = Math.max(best, Math.min(c.x0 - r.x0, r.x1 - c.x1, c.y0 - r.y0, r.y1 - c.y1))
      return best
    }
    const ms = surround(METAL.rects)
    out.push({ rule: 'contact.metalSurround', required: 1, measured: ms, ok: ms >= 1, layer: 'metal', a: [c.x0 - 1, c.y0], b: [c.x0, c.y0], note: 'Metal1 surrounds contact by 1λ' })
    const ds = surround(diffs)
    out.push({ rule: 'contact.diffSurround', required: 1, measured: ds, ok: ds >= 1, layer: 'diffusion', a: [c.x0 - 1, c.y1], b: [c.x0, c.y1], note: 'Diffusion surrounds contact by 1λ' })
  }
  return out
}
