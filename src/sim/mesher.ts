import { colCentre, keyOf } from './model'
import type { Interval, Model } from './types'

/**
 * Greedy mesher: equal intervals in neighbouring columns merge into boxes,
 * then boxes of the same kind that touch are labelled as one connected
 * component (one clickable object).
 *
 * Output coordinates: x, y in λ (layout plane); z in display units
 * (λ, after per-material vertical exaggeration).
 */
export interface Box {
  key: string
  x0: number
  x1: number
  y0: number
  y1: number
  z0: number
  z1: number
  /** physical thickness of the source interval (nm), for thin-film colour */
  tnm: number
  /** resist exposure dose */
  dose: number
  comp: number
}

export interface Component {
  id: number
  key: string
  boxes: Box[]
  min: [number, number, number]
  max: [number, number, number]
}

export interface MeshResult {
  boxes: Box[]
  components: Component[]
}

export type ZScale = (iv: Interval) => number

export interface MeshOptions {
  /** nanometres per display unit (λ = 300 nm) */
  nmPerUnit: number
  zScale: ZScale
  /** crop to a layout window (λ) */
  window?: { x0: number; y0: number; x1: number; y1: number }
}

/** display-space z extents of each interval in a column */
export function displayStack(col: readonly Interval[], o: MeshOptions): { iv: Interval; z0: number; z1: number }[] {
  const out: { iv: Interval; z0: number; z1: number }[] = []
  if (!col.length) return out
  let z = col[0].z0 / o.nmPerUnit
  for (const iv of col) {
    const dz = ((iv.z1 - iv.z0) * o.zScale(iv)) / o.nmPerUnit
    out.push({ iv, z0: z, z1: z + dz })
    z += dz
  }
  return out
}

export function mesh(m: Model, o: MeshOptions): MeshResult {
  const g = m.grid
  // 1. bucket interval signatures per column
  const sigs = new Map<string, { key: string; z0: number; z1: number; tnm: number; dose: number; cells: Uint8Array }>()
  const q = (v: number) => Math.round(v * 1e4)
  for (let j = 0; j < g.ny; j++)
    for (let i = 0; i < g.nx; i++) {
      const [cx, cy] = colCentre(g, i, j)
      const w = o.window
      if (w && (cx < w.x0 || cx > w.x1 || cy < w.y0 || cy > w.y1)) continue
      const col = m.cols[j * g.nx + i]
      for (const s of displayStack(col, o)) {
        if (s.z1 - s.z0 < 1e-6) continue
        const key = keyOf(s.iv)
        const dose = s.iv.dose ?? 0
        const sig = `${key}|${q(s.z0)}|${q(s.z1)}|${Math.round(dose * 20)}`
        let b = sigs.get(sig)
        if (!b) {
          b = { key, z0: s.z0, z1: s.z1, tnm: s.iv.z1 - s.iv.z0, dose, cells: new Uint8Array(g.nx * g.ny) }
          sigs.set(sig, b)
        }
        b.cells[j * g.nx + i] = 1
      }
    }

  // 2. greedy rectangles per signature
  const boxes: Box[] = []
  for (const b of sigs.values()) {
    const c = b.cells
    for (let j = 0; j < g.ny; j++)
      for (let i = 0; i < g.nx; i++) {
        if (c[j * g.nx + i] !== 1) continue
        let i1 = i
        while (i1 + 1 < g.nx && c[j * g.nx + i1 + 1] === 1) i1++
        let j1 = j
        grow: while (j1 + 1 < g.ny) {
          for (let ii = i; ii <= i1; ii++) if (c[(j1 + 1) * g.nx + ii] !== 1) break grow
          j1++
        }
        for (let jj = j; jj <= j1; jj++) for (let ii = i; ii <= i1; ii++) c[jj * g.nx + ii] = 2
        boxes.push({
          key: b.key,
          x0: g.x0 + i * g.d,
          x1: g.x0 + (i1 + 1) * g.d,
          y0: g.y0 + j * g.d,
          y1: g.y0 + (j1 + 1) * g.d,
          z0: b.z0,
          z1: b.z1,
          tnm: b.tnm,
          dose: b.dose,
          comp: -1,
        })
      }
  }

  return { boxes, components: label(boxes) }
}

/** boxes of the same key that share a face of positive area are connected */
export function touches(a: Box, b: Box, eps = 1e-6) {
  const ov = (a0: number, a1: number, b0: number, b1: number) => Math.min(a1, b1) - Math.max(a0, b0)
  const ox = ov(a.x0, a.x1, b.x0, b.x1)
  const oy = ov(a.y0, a.y1, b.y0, b.y1)
  const oz = ov(a.z0, a.z1, b.z0, b.z1)
  if (ox < -eps || oy < -eps || oz < -eps) return false
  const pos = [ox > eps, oy > eps, oz > eps].filter(Boolean).length
  return pos >= 2
}

function label(boxes: Box[]): Component[] {
  const parent = boxes.map((_, i) => i)
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])))
  const byKey = new Map<string, number[]>()
  boxes.forEach((b, i) => {
    const arr = byKey.get(b.key) ?? []
    arr.push(i)
    byKey.set(b.key, arr)
  })
  for (const ids of byKey.values())
    for (let a = 0; a < ids.length; a++)
      for (let b = a + 1; b < ids.length; b++)
        if (touches(boxes[ids[a]], boxes[ids[b]])) parent[find(ids[a])] = find(ids[b])

  const comps = new Map<number, Component>()
  // stable ordering: by key then by min corner
  const order = boxes.map((_, i) => i).sort((a, b) => {
    const A = boxes[a]
    const B = boxes[b]
    return A.key < B.key ? -1 : A.key > B.key ? 1 : A.x0 - B.x0 || A.y0 - B.y0 || A.z0 - B.z0
  })
  for (const i of order) {
    const r = find(i)
    let c = comps.get(r)
    if (!c) {
      c = { id: comps.size, key: boxes[i].key, boxes: [], min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] }
      comps.set(r, c)
    }
    const b = boxes[i]
    b.comp = c.id
    c.boxes.push(b)
    c.min = [Math.min(c.min[0], b.x0), Math.min(c.min[1], b.y0), Math.min(c.min[2], b.z0)]
    c.max = [Math.max(c.max[0], b.x1), Math.max(c.max[1], b.y1), Math.max(c.max[2], b.z1)]
  }
  return [...comps.values()]
}

/** find the component of `key` whose footprint contains layout point (x, y) */
export function componentAt(res: MeshResult, key: string, x: number, y: number, z?: number): Component | undefined {
  for (const c of res.components) {
    if (c.key !== key) continue
    for (const b of c.boxes)
      if (x >= b.x0 && x < b.x1 && y >= b.y0 && y < b.y1 && (z == null || (z >= b.z0 && z <= b.z1))) return c
  }
  return undefined
}
