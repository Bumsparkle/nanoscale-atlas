import { keyOf } from './model'
import { displayStack, type MeshOptions } from './mesher'
import type { Model } from './types'

/**
 * Axis-aligned section. A cut is just the columns under the line, so the
 * result is a set of exact rectangles: no CSG, no stencil caps.
 * axis 'y' = plane of constant y (cuts along x, like the slide 27 line);
 * axis 'x' = plane of constant x (cuts along y, e.g. along a gate).
 * u is the in-plane horizontal coordinate (λ), z is display height.
 */
export interface SectionRect {
  key: string
  u0: number
  u1: number
  z0: number
  z1: number
  tnm: number
}

export interface SectionRegion {
  key: string
  rects: SectionRect[]
  /** a good label anchor: centre of the region's largest rectangle */
  anchor: [number, number]
  area: number
}

export function section(m: Model, axis: 'x' | 'y', offset: number, o: MeshOptions): SectionRect[] {
  const g = m.grid
  const rects: SectionRect[] = []
  const n = axis === 'y' ? g.nx : g.ny
  const fixed = axis === 'y' ? Math.floor((offset - g.y0) / g.d) : Math.floor((offset - g.x0) / g.d)
  const lim = axis === 'y' ? g.ny : g.nx
  const f = Math.max(0, Math.min(lim - 1, fixed))
  const open = new Map<string, SectionRect>()
  for (let t = 0; t < n; t++) {
    const k = axis === 'y' ? f * g.nx + t : t * g.nx + f
    const u0 = (axis === 'y' ? g.x0 : g.y0) + t * g.d
    const u1 = u0 + g.d
    const seen = new Set<string>()
    for (const s of displayStack(m.cols[k], o)) {
      if (s.z1 - s.z0 < 1e-9) continue
      const key = keyOf(s.iv)
      const sig = `${key}|${s.z0.toFixed(5)}|${s.z1.toFixed(5)}`
      seen.add(sig)
      const r = open.get(sig)
      if (r && Math.abs(r.u1 - u0) < 1e-9) r.u1 = u1
      else {
        const nr = { key, u0, u1, z0: s.z0, z1: s.z1, tnm: s.iv.z1 - s.iv.z0 }
        rects.push(nr)
        open.set(sig, nr)
      }
    }
    for (const sig of [...open.keys()]) if (!seen.has(sig)) open.delete(sig)
  }
  return rects
}

/** group touching rectangles of one key into labelled regions */
export function regions(rects: SectionRect[]): SectionRegion[] {
  const parent = rects.map((_, i) => i)
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])))
  const eps = 1e-6
  for (let a = 0; a < rects.length; a++)
    for (let b = a + 1; b < rects.length; b++) {
      const A = rects[a]
      const B = rects[b]
      if (A.key !== B.key) continue
      const ou = Math.min(A.u1, B.u1) - Math.max(A.u0, B.u0)
      const oz = Math.min(A.z1, B.z1) - Math.max(A.z0, B.z0)
      if (ou >= -eps && oz >= -eps && (ou > eps || oz > eps)) parent[find(a)] = find(b)
    }
  const groups = new Map<number, SectionRect[]>()
  rects.forEach((r, i) => {
    const k = find(i)
    groups.set(k, [...(groups.get(k) ?? []), r])
  })
  return [...groups.values()].map((rs) => {
    const big = rs.reduce((a, b) => ((b.u1 - b.u0) * (b.z1 - b.z0) > (a.u1 - a.u0) * (a.z1 - a.z0) ? b : a))
    const area = rs.reduce((s, r) => s + (r.u1 - r.u0) * (r.z1 - r.z0), 0)
    return { key: rs[0].key, rects: rs, anchor: [(big.u0 + big.u1) / 2, (big.z0 + big.z1) / 2] as [number, number], area }
  })
}

/**
 * The doping seen at the silicon surface along the cut, left to right,
 * with consecutive repeats merged: the "material sequence along the line".
 */
export function surfaceSequence(m: Model, axis: 'x' | 'y', offset: number, o: MeshOptions): string[] {
  const rects = section(m, axis, offset, o)
  const si = rects.filter((r) => r.key.startsWith('si:') && Math.abs(r.z1) < 1e-6).sort((a, b) => a.u0 - b.u0)
  const out: string[] = []
  for (const r of si) if (out[out.length - 1] !== r.key) out.push(r.key)
  return out
}
