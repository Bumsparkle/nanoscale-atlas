import { colCentre, idx, inMask, mapCols, surface, top } from './model'
import type { Column, Doping, Interval, Mask, Material, Model, Op } from './types'

/**
 * Process operations. Each is pure (model in, new model out) and can be
 * evaluated at fractional progress p ∈ [0, 1] so the fab timeline can play
 * any step forward or backward without pops: films grow, etches thin,
 * implants deepen, developed resist dissolves.
 */

const clamp01 = (p: number) => Math.min(1, Math.max(0, p))

/** Conformal growth/deposition: every column gets a film of thickness t on its surface. */
export function oxidise(mat: Material, t: number): Op {
  return deposit(mat, t)
}

export function deposit(mat: Material, t: number, opts: { planar?: boolean; markPlugs?: boolean } = {}): Op {
  return (m, p) => {
    p = clamp01(p)
    if (p === 0) return m
    if (!opts.planar) {
      return mapCols(m, (c) => [...c, { mat, z0: surface(c), z1: surface(c) + t * p }])
    }
    // planarising fill (spin coating, slide 31; sputtered metal drawn flat, slide 45)
    let H = -Infinity
    for (const c of m.cols) H = Math.max(H, surface(c))
    H += t
    const g = m.grid
    return mapCols(m, (c, _x, _y, k) => {
      const s = surface(c)
      const z1 = s + (H - s) * p
      if (opts.markPlugs && (top(c).mat === 'si' || top(c).mat === 'poly')) {
        // bottom of a contact cut: the metal below the surrounding oxide is the contact plug
        const ref = neighbourFoxTop(m, k % g.nx, Math.floor(k / g.nx), 3)
        if (ref > s) {
          const zp = Math.min(z1, ref)
          const out: Interval[] = [...c, { mat, z0: s, z1: zp, plug: true }]
          if (z1 > zp) out.push({ mat, z0: zp, z1 })
          return out
        }
      }
      return [...c, { mat, z0: s, z1 }]
    })
  }
}

function neighbourFoxTop(m: Model, i: number, j: number, r: number) {
  const g = m.grid
  let best = -Infinity
  for (let dj = -r; dj <= r; dj++)
    for (let di = -r; di <= r; di++) {
      const ii = i + di
      const jj = j + dj
      if (ii < 0 || jj < 0 || ii >= g.nx || jj >= g.ny) continue
      const c = m.cols[idx(g, ii, jj)]
      if (top(c).mat === 'fox') best = Math.max(best, top(c).z1)
    }
  return best
}

/** Spin on photoresist: planarising, light-sensitive polymer (slide 31). */
export function spinResist(t: number): Op {
  return deposit('resist', t, { planar: true })
}

/**
 * Expose resist through a mask (slide 32). Light passes where the mask is
 * drawn (clear-field), or everywhere except the drawing when `keep` is set
 * (dark-field: used to keep poly and metal where they are drawn).
 */
export function expose(mask: Mask, opts: { keep?: boolean } = {}): Op {
  return (m, p) => {
    p = clamp01(p)
    if (p === 0) return m
    return mapCols(m, (c, x, y) => {
      const lit = inMask(mask, x, y) !== !!opts.keep
      const t = top(c)
      if (!lit || t.mat !== 'resist') return c
      return [...c.slice(0, -1), { ...t, dose: p }]
    })
  }
}

/** Develop: positive resist softened by light dissolves (slide 32). */
export function develop(): Op {
  return (m, p) => {
    p = clamp01(p)
    if (p === 0) return m
    return mapCols(m, (c) => {
      const t = top(c)
      if (t.mat !== 'resist' || (t.dose ?? 0) < 1) return c
      if (p >= 1) return c.slice(0, -1)
      return [...c.slice(0, -1), { ...t, z1: t.z0 + (t.z1 - t.z0) * (1 - p) }]
    })
  }
}

/**
 * Etch `mat` wherever it is the exposed top material (anisotropic: straight
 * down, stops on any other material). Resist protects what it covers
 * (slide 33: HF "only attacks oxide where resist has been exposed").
 */
export function etch(mat: Material): Op {
  return (m, p) => {
    p = clamp01(p)
    if (p === 0) return m
    return mapCols(m, (c) => etchColumn(c, mat, p))
  }
}

function etchColumn(c: Column, mat: Material, p: number): Column {
  let n = c.length
  while (n > 0 && c[n - 1].mat === mat) n--
  if (n === c.length) return c
  const run = c.slice(n)
  const T = run[run.length - 1].z1 - run[0].z0
  const cut = run[run.length - 1].z1 - T * p
  if (p >= 1) return c.slice(0, n)
  const kept: Interval[] = []
  for (const iv of run) {
    if (iv.z0 >= cut) break
    kept.push(iv.z1 > cut ? { ...iv, z1: cut } : iv)
  }
  return [...c.slice(0, n), ...kept]
}

/** Strip a layer everywhere it is on top (piranha for resist, slide 34; HF for oxide, slide 36). */
export function strip(mat: Material): Op {
  return etch(mat)
}

/**
 * Ion implantation / diffusion of dopants into exposed silicon (slide 35).
 * Ions are blocked by anything sitting on the silicon (oxide, resist, poly):
 * this is what makes the poly gate self-aligned (slides 39–40).
 */
export function implant(dop: Doping, depth: number): Op {
  return (m, p) => {
    p = clamp01(p)
    if (p === 0) return m
    const d = depth * p
    return mapCols(m, (c) => {
      const t = top(c)
      if (t.mat !== 'si') return c
      const s = t.z1
      return dopeColumn(c, s - d, s, dop)
    })
  }
}

function dopeColumn(c: Column, a: number, b: number, dop: Doping): Column {
  const out: Interval[] = []
  for (const iv of c) {
    if (iv.mat !== 'si' || iv.z1 <= a || iv.z0 >= b) {
      out.push(iv)
      continue
    }
    if (iv.z0 < a) out.push({ ...iv, z1: a })
    out.push({ ...iv, z0: Math.max(iv.z0, a), z1: Math.min(iv.z1, b), dop })
    if (iv.z1 > b) out.push({ ...iv, z0: b })
  }
  // merge neighbours with identical doping
  const merged: Interval[] = []
  for (const iv of out) {
    const last = merged[merged.length - 1]
    if (last && last.mat === 'si' && iv.mat === 'si' && last.dop === iv.dop && Math.abs(last.z1 - iv.z0) < 1e-9)
      merged[merged.length - 1] = { ...last, z1: iv.z1 }
    else merged.push(iv)
  }
  return merged
}

export const identity: Op = (m) => m

/** helper for tests: column at grid index */
export function columnAt(m: Model, i: number, j: number): Column {
  return m.cols[idx(m.grid, i, j)]
}
export { colCentre }
