import type { Column, Doping, Grid, Interval, Mask, Material, Model, Rect } from './types'

export function createWafer(grid: Grid, depthNm: number, dop: Doping = 'p'): Model {
  const col: Column = [{ mat: 'si', z0: -depthNm, z1: 0, dop }]
  return { grid, cols: Array.from({ length: grid.nx * grid.ny }, () => col) }
}

export const idx = (g: Grid, i: number, j: number) => j * g.nx + i

/** layout coordinates of a column centre */
export function colCentre(g: Grid, i: number, j: number): [number, number] {
  return [g.x0 + (i + 0.5) * g.d, g.y0 + (j + 0.5) * g.d]
}

/** column index containing layout point (x, y), or -1 */
export function colAt(g: Grid, x: number, y: number): number {
  const i = Math.floor((x - g.x0) / g.d)
  const j = Math.floor((y - g.y0) / g.d)
  if (i < 0 || j < 0 || i >= g.nx || j >= g.ny) return -1
  return idx(g, i, j)
}

export function inRect(r: Rect, x: number, y: number) {
  return x >= r.x0 && x < r.x1 && y >= r.y0 && y < r.y1
}

export function inMask(mask: Mask, x: number, y: number) {
  return mask.rects.some((r) => inRect(r, x, y))
}

export const top = (c: Column): Interval => c[c.length - 1]
export const surface = (c: Column) => (c.length ? top(c).z1 : 0)

/** map over columns with their layout centre; returns a new model */
export function mapCols(m: Model, f: (c: Column, x: number, y: number, k: number) => Column): Model {
  const g = m.grid
  const cols = new Array<Column>(m.cols.length)
  for (let j = 0; j < g.ny; j++)
    for (let i = 0; i < g.nx; i++) {
      const k = idx(g, i, j)
      const [x, y] = colCentre(g, i, j)
      cols[k] = f(m.cols[k], x, y, k)
    }
  return { grid: g, cols }
}

/** materials from bottom to top in the column at (x, y) */
export function stackAt(m: Model, x: number, y: number): Interval[] {
  const k = colAt(m.grid, x, y)
  return k < 0 ? [] : [...m.cols[k]]
}

/** compact signature like "si:p/si:n+/fox/al" (adjacent duplicates merged) */
export function signature(c: Column | Interval[]): string {
  const parts: string[] = []
  for (const iv of c) {
    const s = keyOf(iv)
    if (parts[parts.length - 1] !== s) parts.push(s)
  }
  return parts.join('/')
}

export function keyOf(iv: Interval): string {
  if (iv.mat === 'si') return 'si:' + iv.dop
  if (iv.mat === 'al' && iv.plug) return 'al:plug'
  if (iv.mat === 'resist' && (iv.dose ?? 0) > 0) return 'resist:exposed'
  return iv.mat
}

export function topMaterial(c: Column): Material {
  return top(c).mat
}
