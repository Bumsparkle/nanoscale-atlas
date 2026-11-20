import * as THREE from 'three/webgpu'
import type { Box } from '../sim/mesher'

/**
 * Boxes (layout λ coordinates) → one BufferGeometry, optionally clipped by
 * an axis-aligned section plane. A clipped box is still a box, and its face
 * on the plane is the exact cut face: flagged `cap` = 1 for the legend
 * shader. Scene mapping: X = x − cx, Y = z, Z = −(y − cy).
 */
export interface Clip {
  axis: 'x' | 'y'
  offset: number
  /** keep the side below ('lo') or above ('hi') the offset */
  keep: 'lo' | 'hi'
}

export const CELL_CENTRE = { x: 25, y: 2 }

export function toScene(x: number, y: number, z: number): [number, number, number] {
  return [x - CELL_CENTRE.x, z, -(y - CELL_CENTRE.y)]
}

interface Face {
  /** 0 = X, 1 = Y, 2 = Z (scene axes) */
  axis: 0 | 1 | 2
  sign: 1 | -1
  plane: number
  /** extents on the two other axes, in axis order (X: [Y, Z], Y: [X, Z], Z: [X, Y]) */
  a0: number
  a1: number
  b0: number
  b1: number
  cap: number
  tnm: number
  dose: number
}

/**
 * Boxes from the greedy mesher touch each other. Faces where two boxes of
 * the same object meet are internal: invisible for opaque materials but
 * visible as banding through transparent oxide. Coplanar, opposite faces
 * cancel each other here (exact rectangle subtraction).
 */
function subtract(f: Face, holes: Face[]): Face[] {
  const hs = holes.filter((h) => h.a0 < f.a1 && h.a1 > f.a0 && h.b0 < f.b1 && h.b1 > f.b0)
  if (!hs.length) return [f]
  const as = [...new Set([f.a0, f.a1, ...hs.flatMap((h) => [h.a0, h.a1])])].filter((v) => v >= f.a0 && v <= f.a1).sort((x, y) => x - y)
  const bs = [...new Set([f.b0, f.b1, ...hs.flatMap((h) => [h.b0, h.b1])])].filter((v) => v >= f.b0 && v <= f.b1).sort((x, y) => x - y)
  const out: Face[] = []
  for (let i = 0; i + 1 < as.length; i++) {
    let run: Face | null = null
    for (let j = 0; j + 1 < bs.length; j++) {
      const ca = (as[i] + as[i + 1]) / 2
      const cb = (bs[j] + bs[j + 1]) / 2
      const covered = hs.some((h) => ca > h.a0 && ca < h.a1 && cb > h.b0 && cb < h.b1)
      if (covered) {
        run = null
        continue
      }
      if (run && Math.abs(run.b1 - bs[j]) < 1e-9) run.b1 = bs[j + 1]
      else {
        run = { ...f, a0: as[i], a1: as[i + 1], b0: bs[j], b1: bs[j + 1] }
        out.push(run)
      }
    }
  }
  return out
}

export function boxesGeometry(boxes: Box[], clip?: Clip): THREE.BufferGeometry | null {
  const faces: Face[] = []
  for (const b of boxes) {
    let { x0, x1, y0, y1 } = b
    const caps = { x0: 0, x1: 0, y0: 0, y1: 0 }
    if (clip) {
      if (clip.axis === 'x') {
        if (clip.keep === 'lo') {
          if (x0 >= clip.offset) continue
          if (x1 > clip.offset) (x1 = clip.offset), (caps.x1 = 1)
        } else {
          if (x1 <= clip.offset) continue
          if (x0 < clip.offset) (x0 = clip.offset), (caps.x0 = 1)
        }
      } else {
        if (clip.keep === 'lo') {
          if (y0 >= clip.offset) continue
          if (y1 > clip.offset) (y1 = clip.offset), (caps.y1 = 1)
        } else {
          if (y1 <= clip.offset) continue
          if (y0 < clip.offset) (y0 = clip.offset), (caps.y0 = 1)
        }
      }
    }
    const X0 = x0 - CELL_CENTRE.x
    const X1 = x1 - CELL_CENTRE.x
    const Y0 = b.z0
    const Y1 = b.z1
    const Zb = -(y1 - CELL_CENTRE.y)
    const Zf = -(y0 - CELL_CENTRE.y)
    const t = b.tnm
    const d = b.dose
    faces.push(
      { axis: 1, sign: 1, plane: Y1, a0: X0, a1: X1, b0: Zb, b1: Zf, cap: 0, tnm: t, dose: d },
      { axis: 1, sign: -1, plane: Y0, a0: X0, a1: X1, b0: Zb, b1: Zf, cap: 0, tnm: t, dose: d },
      { axis: 0, sign: 1, plane: X1, a0: Y0, a1: Y1, b0: Zb, b1: Zf, cap: caps.x1, tnm: t, dose: d },
      { axis: 0, sign: -1, plane: X0, a0: Y0, a1: Y1, b0: Zb, b1: Zf, cap: caps.x0, tnm: t, dose: d },
      { axis: 2, sign: 1, plane: Zf, a0: X0, a1: X1, b0: Y0, b1: Y1, cap: caps.y0, tnm: t, dose: d },
      { axis: 2, sign: -1, plane: Zb, a0: X0, a1: X1, b0: Y0, b1: Y1, cap: caps.y1, tnm: t, dose: d },
    )
  }
  if (!faces.length) return null

  // cancel coplanar opposite faces
  const groups = new Map<string, Face[]>()
  for (const f of faces) {
    const k = f.axis + ':' + Math.round(f.plane * 1e4)
    const g = groups.get(k)
    if (g) g.push(f)
    else groups.set(k, [f])
  }
  const kept: Face[] = []
  for (const g of groups.values()) {
    const pos = g.filter((f) => f.sign === 1)
    const neg = g.filter((f) => f.sign === -1)
    if (!pos.length || !neg.length) {
      kept.push(...g)
      continue
    }
    for (const f of pos) kept.push(...subtract(f, neg))
    for (const f of neg) kept.push(...subtract(f, pos))
  }

  const n = kept.length * 4
  const pos = new Float32Array(n * 3)
  const nor = new Float32Array(n * 3)
  const capA = new Float32Array(n)
  const tnmA = new Float32Array(n)
  const doseA = new Float32Array(n)
  const index = new Uint32Array(kept.length * 6)
  let v = 0
  let ii = 0
  for (const f of kept) {
    // corners in (a, b) order, wound counter-clockwise seen from outside
    const corners: [number, number][] =
      (f.axis === 1) === (f.sign === 1)
        ? [[f.a0, f.b1], [f.a1, f.b1], [f.a1, f.b0], [f.a0, f.b0]]
        : [[f.a0, f.b0], [f.a1, f.b0], [f.a1, f.b1], [f.a0, f.b1]]
    for (const [a, b] of corners) {
      const p = f.axis === 0 ? [f.plane, a, b] : f.axis === 1 ? [a, f.plane, b] : [a, b, f.plane]
      pos.set(p, v * 3)
      const nn = [0, 0, 0]
      nn[f.axis] = f.sign
      nor.set(nn, v * 3)
      capA[v] = f.cap
      tnmA[v] = f.tnm
      doseA[v] = f.dose
      v++
    }
    index.set([v - 4, v - 3, v - 2, v - 4, v - 2, v - 1], ii)
    ii += 6
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3))
  g.setAttribute('cap', new THREE.BufferAttribute(capA, 1))
  g.setAttribute('tnm', new THREE.BufferAttribute(tnmA, 1))
  g.setAttribute('dose', new THREE.BufferAttribute(doseA, 1))
  g.setIndex(new THREE.BufferAttribute(index, 1))
  g.computeBoundingBox()
  g.computeBoundingSphere()
  return g
}
