import { colCentre, idx, inMask, mapCols, surface, top } from './model'
import type { Column, Doping, Interval, Mask, Material, Model, Op } from './types'
import { aerialImage } from './aerial'

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
export function expose(mask: Mask, opts: { keep?: boolean; optics?: ExposeOptics } = {}): Op {
  if (opts.optics) return exposeOptical(mask, !!opts.keep, opts.optics)
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

/**
 * Optical exposure settings for `expose` (Topic 7). The blur σ and the grid
 * are in layout units (λ of the layout); `threshold` is the fraction of the
 * open-field intensity at which the resist clears (0.5 by default).
 */
export interface ExposeOptics {
  sigma: number
  /** partial coherence S: 0 coherent … 1 incoherent */
  S: number
  threshold?: number
}

/**
 * Expose through a real lens instead of copying the mask: the aerial image
 * (sim/aerial.ts) sets each column's dose, and develop clears the resist
 * where the dose reaches 1, i.e. where the intensity reaches the threshold.
 * Narrow lines wash out and narrow gaps close when σ is too large.
 */
function exposeOptical(mask: Mask, keep: boolean, o: ExposeOptics): Op {
  const imgs = new WeakMap<Model['grid'], { at: (x: number, y: number) => number }>()
  const thr = o.threshold ?? 0.5
  return (m, p) => {
    p = clamp01(p)
    if (p === 0) return m
    const g = m.grid
    let img = imgs.get(g)
    if (!img) {
      const bounds = { x0: g.x0, y0: g.y0, x1: g.x0 + g.nx * g.d, y1: g.y0 + g.ny * g.d }
      img = aerialImage(mask.rects, bounds, o.sigma, o.S, Math.max(2, Math.round(4 / g.d)), keep)
      imgs.set(g, img)
    }
    const im = img
    return mapCols(m, (c, x, y) => {
      const t = top(c)
      if (t.mat !== 'resist') return c
      const I = im.at(x, y)
      // positive resist: soluble where the dose reaches the threshold
      const dose = Math.min(1, (p * I) / thr)
      if (dose <= 0) return c
      return [...c.slice(0, -1), { ...t, dose }]
    })
  }
}

/**
 * Develop: dissolve the soluble resist. Positive resist (Topic 2 slide 31,
 * the default) is softened by light, so the exposed resist dissolves;
 * negative resist is hardened by light, so the unexposed resist dissolves
 * (Topic 3 slide 28).
 */
export function develop(opts: { tone?: 'positive' | 'negative' } = {}): Op {
  const negative = opts.tone === 'negative'
  return (m, p) => {
    p = clamp01(p)
    if (p === 0) return m
    return mapCols(m, (c) => {
      const t = top(c)
      if (t.mat !== 'resist') return c
      const exposed = (t.dose ?? 0) >= 1
      if (exposed === negative) return c
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
export function etch(mat: Material, opts: { isotropic?: boolean; pitchNm?: number; over?: number } = {}): Op {
  if (opts.isotropic) return isotropicEtch(mat, opts.pitchNm ?? 100, opts.over ?? 0)
  return (m, p) => {
    p = clamp01(p)
    if (p === 0) return m
    return mapCols(m, (c) => etchColumn(c, mat, p))
  }
}

/**
 * Isotropic (wet) etch, Topic 3 slide 29: the etch front advances the same
 * distance R sideways as downwards from the opening, so the film under the
 * edge of the mask is undercut along a quarter circle. Under the mask the
 * removed film leaves a gap (the column keeps the mask above it).
 * `pitchNm` is the column pitch in nm; `over` is the over-etch fraction.
 */
function isotropicEtch(mat: Material, pitchNm: number, over: number): Op {
  return (m, p) => {
    p = clamp01(p)
    if (p === 0) return m
    const exposed = m.cols.map((c) => top(c).mat === mat)
    let T = 0
    m.cols.forEach((c, k) => {
      if (!exposed[k]) return
      let n = c.length
      while (n > 0 && c[n - 1].mat === mat) n--
      T = Math.max(T, c[c.length - 1].z1 - c[n].z0)
    })
    if (T === 0) return m
    const R = T * (1 + over) * p
    const dist = edgeDistance(m, exposed, pitchNm)
    return mapCols(m, (c, _x, _y, k) => {
      if (exposed[k]) return etchColumn(c, mat, Math.min(1, R / Math.max(1e-9, T)))
      const x = dist[k]
      if (!(x < R)) return c
      const dz = Math.sqrt(R * R - x * x)
      // the highest run of `mat` in this column (under the mask)
      let hi = -1
      for (let i = c.length - 1; i >= 0; i--)
        if (c[i].mat === mat) {
          hi = i
          break
        }
      if (hi < 0) return c
      let lo = hi
      while (lo > 0 && c[lo - 1].mat === mat) lo--
      const runTop = c[hi].z1
      const cut = runTop - dz
      const out: Interval[] = []
      c.forEach((iv, i) => {
        if (i < lo || i > hi) return out.push(iv)
        if (iv.z0 >= cut) return
        out.push(iv.z1 > cut ? { ...iv, z1: cut } : iv)
      })
      return out
    })
  }
}

/** distance (nm) from each column centre to the nearest edge of a column flagged `open` (0 inside) */
function edgeDistance(m: Model, open: boolean[], pitchNm: number): Float64Array {
  const g = m.grid
  const out = new Float64Array(m.cols.length).fill(Infinity)
  const opens: [number, number][] = []
  open.forEach((o, k) => o && opens.push([k % g.nx, Math.floor(k / g.nx)]))
  for (let k = 0; k < m.cols.length; k++) {
    if (open[k]) {
      out[k] = 0
      continue
    }
    const i = k % g.nx
    const j = Math.floor(k / g.nx)
    let best = Infinity
    for (const [oi, oj] of opens) {
      const dx = Math.max(0, Math.abs(oi - i) - 0.5)
      const dy = Math.max(0, Math.abs(oj - j) - 0.5)
      best = Math.min(best, Math.hypot(dx, dy))
    }
    out[k] = best * pitchNm
  }
  return out
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
export function implant(dop: Doping, depth: number, opts: { damage?: boolean } = {}): Op {
  return (m, p) => {
    p = clamp01(p)
    if (p === 0) return m
    const d = depth * p
    return mapCols(m, (c) => {
      const t = top(c)
      if (t.mat !== 'si') return c
      const s = t.z1
      return dopeColumn(c, s - d, s, dop, opts.damage)
    })
  }
}

/**
 * Anneal after implantation (Topic 3 slide 31, 900–1000 °C): activates the
 * dopants and restores the crystal, clearing the implant damage.
 */
export function anneal(): Op {
  return (m, p) => {
    if (clamp01(p) < 1) return m
    return mapCols(m, (c) => (c.some((iv) => iv.dmg) ? merge(c.map((iv) => (iv.dmg ? { ...iv, dmg: undefined } : iv))) : c))
  }
}

/**
 * Thermal oxidation that consumes silicon (Topic 3 slide 27): O₂ or H₂O
 * diffuses through the oxide and reacts at the Si interface, so every
 * 1 µm of SiO₂ uses 0.44 µm of Si. The interface moves down by 0.44 of the
 * new growth and the top surface rises by 0.56. Oxide grows only where
 * silicon (bare or under thermal oxide) is reachable. `final` gives the
 * target thickness from the existing oxide thickness (Deal–Grove, or a
 * fixed increment).
 */
export function thermalOxide(final: number | ((existingNm: number) => number), opts: { mat?: Material; consumed?: number } = {}): Op {
  const mat = opts.mat ?? 'ox'
  const ratio = opts.consumed ?? 0.44
  const target = typeof final === 'number' ? (xi: number) => xi + final : final
  return (m, p) => {
    p = clamp01(p)
    if (p === 0) return m
    return mapCols(m, (c) => {
      let j = c.length
      while (j > 0 && (c[j - 1].mat === 'ox' || c[j - 1].mat === 'gox' || c[j - 1].mat === 'fox')) j--
      if (j === 0 || c[j - 1].mat !== 'si') return c
      const xi = j < c.length ? c[c.length - 1].z1 - c[j].z0 : 0
      const grow = Math.max(0, target(xi) - xi) * p
      if (grow === 0) return c
      const down = grow * ratio
      const iface = c[j - 1].z1 - down
      // consume silicon from the top of the silicon stack
      const si: Interval[] = []
      for (let i = 0; i < j; i++) {
        const iv = c[i]
        if (iv.z0 >= iface) continue
        si.push(iv.z1 > iface ? { ...iv, z1: iface } : iv)
      }
      if (j === c.length) return [...si, { mat, z0: iface, z1: c[j - 1].z1 + grow - down }]
      const ox = c.slice(j).map((iv) => ({ ...iv }))
      ox[0].z0 = iface
      ox[ox.length - 1].z1 += grow - down
      return [...si, ...ox]
    })
  }
}

/**
 * Diffusion from an oxide window (Topic 3 slide 30): exposed silicon is
 * doped to the junction depth xj, and the dopant also spreads sideways
 * under the edge of the oxide (lateral reach ≈ 0.8·xj, beyond the lecture:
 * Plummer ch. 7), so the doped region ends in a rounded edge.
 */
export function diffuse(dop: Doping, xj: number, opts: { pitchNm?: number; lateral?: number } = {}): Op {
  const pitch = opts.pitchNm ?? 100
  const lat = opts.lateral ?? 0.8
  return (m, p) => {
    p = clamp01(p)
    if (p === 0) return m
    const open = m.cols.map((c) => top(c).mat === 'si')
    const dist = edgeDistance(m, open, pitch)
    const d = xj * p
    const L = lat * d
    return mapCols(m, (c, _x, _y, k) => {
      let hi = -1
      for (let i = c.length - 1; i >= 0; i--)
        if (c[i].mat === 'si') {
          hi = i
          break
        }
      if (hi < 0) return c
      const s = c[hi].z1
      if (open[k]) return dopeColumn(c, s - d, s, dop)
      const x = dist[k]
      if (!(x < L)) return c
      const depth = d * Math.sqrt(1 - (x / L) * (x / L))
      return dopeColumn(c, s - depth, s, dop)
    })
  }
}

/**
 * Epitaxy (Topic 3 slides 25–26): new single-crystal silicon continues the
 * crystal of the exposed silicon below it (CVD from SiH₄ at 950–1150 °C, or
 * MBE in ultra-high vacuum), typically lightly doped on a heavily doped
 * substrate. Grows only on exposed silicon.
 */
export function epitaxy(t: number, dop: Doping): Op {
  return (m, p) => {
    p = clamp01(p)
    if (p === 0) return m
    return mapCols(m, (c) => (top(c).mat === 'si' ? [...c, { mat: 'si', z0: surface(c), z1: surface(c) + t * p, dop, epi: true }] : c))
  }
}

/**
 * Thermal evaporation (Topic 3 slide 32): metal vapour from a heated
 * filament condenses on the cooler wafer. Line-of-sight from above, so in
 * this column model every column receives the same film on its top.
 */
export function evaporate(mat: Material, t: number): Op {
  return deposit(mat, t)
}

function merge(c: Interval[]): Interval[] {
  const merged: Interval[] = []
  for (const iv of c) {
    const last = merged[merged.length - 1]
    if (last && last.mat === 'si' && iv.mat === 'si' && last.dop === iv.dop && !!last.dmg === !!iv.dmg && !!last.epi === !!iv.epi && Math.abs(last.z1 - iv.z0) < 1e-9)
      merged[merged.length - 1] = { ...last, z1: iv.z1 }
    else merged.push(iv)
  }
  return merged
}

function dopeColumn(c: Column, a: number, b: number, dop: Doping, dmg?: boolean): Column {
  const out: Interval[] = []
  for (const iv of c) {
    if (iv.mat !== 'si' || iv.z1 <= a || iv.z0 >= b) {
      out.push(iv)
      continue
    }
    if (iv.z0 < a) out.push({ ...iv, z1: a })
    out.push({ ...iv, z0: Math.max(iv.z0, a), z1: Math.min(iv.z1, b), dop, ...(dmg ? { dmg: true } : {}) })
    if (iv.z1 > b) out.push({ ...iv, z0: b })
  }
  // merge neighbours with identical doping
  return merge(out)
}

export const identity: Op = (m) => m

/** helper for tests: column at grid index */
export function columnAt(m: Model, i: number, j: number): Column {
  return m.cols[idx(m.grid, i, j)]
}
export { colCentre }
