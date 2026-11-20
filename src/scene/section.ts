import { SNAP_TARGETS, type CutAxis, type CutTarget } from '../state/store'
import { regions, section } from '../sim/slicer'
import type { Model } from '../sim/types'
import { MESH_OPTS } from '../chapters/cmos/display'
import { CONTENT } from '../chapters/cmos/content'
import { CELL_CENTRE } from './cellGeometry'

/**
 * Magnetic snapping for the section plane. Inside CAPTURE the plane is
 * pulled onto the target; it lets go only beyond RELEASE (hysteresis), so
 * the lock feels mechanical rather than twitchy.
 */
export const CAPTURE = 1.6
export const RELEASE = 3.0

export function snapFor(axis: CutAxis, raw: number, locked: CutTarget | null): CutTarget | null {
  if (locked) {
    const t = SNAP_TARGETS[locked]
    if (t.axis === axis && Math.abs(raw - t.offset) <= RELEASE) return locked
  }
  let best: CutTarget | null = null
  let bestD = CAPTURE
  for (const [id, t] of Object.entries(SNAP_TARGETS) as [CutTarget, (typeof SNAP_TARGETS)[CutTarget]][]) {
    if (t.axis !== axis) continue
    const d = Math.abs(raw - t.offset)
    if (d <= bestD) {
      best = id
      bestD = d
    }
  }
  return best
}

/** layout extent of the plane offset for each axis (λ) */
export const PLANE_RANGE: Record<CutAxis, [number, number]> = { x: [-5.5, 55.5], y: [-11.5, 15.5] }

const LEGEND_NAME: Record<string, string> = {
  'si:p': 'p substrate',
  'si:nwell': 'n well',
  'si:n+': 'n+',
  'si:p+': 'p+',
  poly: 'polysilicon',
  gox: 'gate oxide',
  fox: 'SiO₂',
  al: 'metal1',
  'al:plug': 'contact',
}

const ROLE: Record<string, string> = {
  'nmos-source': 'nMOS source',
  'nmos-drain': 'nMOS drain',
  'pmos-source': 'pMOS source',
  'pmos-drain': 'pMOS drain',
  'substrate-tap': 'substrate tap',
  'well-tap': 'well tap',
  'metal-gnd': 'GND',
  'metal-y': 'Y',
  'metal-vdd': 'VDD',
  'poly-gate': 'A',
}

export interface CutLabel {
  id: string
  text: string
  sub?: string
  /** scene-space point on the cut face */
  p: [number, number, number]
  group: 'top' | 'bottom'
}

/**
 * Labels for a locked cut, engineering-drawing style: one per meaningful
 * region of the section, named with the slide 25 legend and, where the
 * region is a named object, its role (source, drain, GND, A, …).
 */
export function cutLabels(m: Model, axis: CutAxis, offset: number): CutLabel[] {
  // the far half's cap shows the row/column at or above the offset
  const probe = offset + 0.5
  const regs = regions(section(m, axis, probe, MESH_OPTS))
  const out: CutLabel[] = []
  const used = new Map<string, number>()
  const roleAt = (key: string, u0: number, u1: number) => {
    for (const c of CONTENT) {
      if (c.layer !== 'cell') continue
      for (const a of c.anchors) {
        if (a.key !== key || a.x == null || a.y == null) continue
        const au = axis === 'y' ? a.x : a.y
        const av = axis === 'y' ? a.y : a.x
        if (au + 0.5 > u0 && au + 0.5 < u1 && Math.floor(av) === Math.floor(probe)) return ROLE[c.id]
        if (au + 0.5 > u0 && au + 0.5 < u1 && key !== 'al:plug' && key !== 'si:n+' && key !== 'si:p+') return ROLE[c.id]
      }
    }
    return undefined
  }
  const sorted = [...regs].sort((a, b) => b.area - a.area)
  for (const r of sorted) {
    const name = LEGEND_NAME[r.key]
    if (!name) continue
    const n = used.get(r.key) ?? 0
    // one label per kind for repetitive films; every diffusion, gate and wire gets its own
    const limit = r.key === 'fox' || r.key === 'gox' || r.key === 'al:plug' || r.key === 'si:p' || r.key === 'si:nwell' ? 1 : 6
    if (n >= limit) continue
    used.set(r.key, n + 1)
    const u0 = Math.min(...r.rects.map((q) => q.u0))
    const u1 = Math.max(...r.rects.map((q) => q.u1))
    const role = roleAt(r.key, u0, u1)
    let [u, z] = r.anchor
    if (r.key === 'si:p') {
      // the substrate label sits at the left field, clear of the well and diffusions
      const left = r.rects.filter((q) => q.u0 <= (axis === 'y' ? -3 : -9)).sort((a, b) => b.z1 - b.z0 - (a.z1 - a.z0))[0]
      if (left) [u, z] = [Math.max(left.u0 + 2, Math.min(left.u1 - 1, axis === 'y' ? -3 : -9)), left.z0 + (left.z1 - left.z0) * 0.55]
    } else if (r.key === 'si:nwell') {
      const big = r.rects.reduce((a, b) => ((b.u1 - b.u0) * (b.z1 - b.z0) > (a.u1 - a.u0) * (a.z1 - a.z0) ? b : a))
      z = big.z0 + (big.z1 - big.z0) * 0.35
    }
    const p: [number, number, number] =
      axis === 'y'
        ? [u - CELL_CENTRE.x, z, -(offset - CELL_CENTRE.y)]
        : [offset - CELL_CENTRE.x, z, -(u - CELL_CENTRE.y)]
    out.push({
      id: `${r.key}@${u.toFixed(1)}`,
      text: r.key === 'gox' ? 'gate oxide ×50' : name,
      sub: role,
      p,
      group: r.key.startsWith('si:') ? 'bottom' : 'top',
    })
  }
  return out
}
