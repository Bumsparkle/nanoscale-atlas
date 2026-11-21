/**
 * Column-stack process model.
 *
 * The cell sits on a 2D grid in the layout plane (x, y in λ). Every grid
 * column holds an ordered list of material intervals from the bottom of the
 * simulated substrate to the top surface. Heights are physical nanometres;
 * vertical exaggeration is applied only when meshing.
 */
export type Material =
  | 'si' // crystalline silicon (substrate, wells, diffusions differ by doping)
  | 'ox' // masking SiO2 (thermal, slides 30, 39)
  | 'gox' // thin gate oxide (slide 37)
  | 'fox' // thick field oxide (slide 44)
  | 'poly' // polysilicon (slide 37)
  | 'resist' // photoresist (slide 31)
  | 'al' // aluminium (slide 45)

export type Doping = 'p' | 'nwell' | 'n+' | 'p+'

export interface Interval {
  mat: Material
  /** bottom / top in nm, z = 0 at the original silicon surface */
  z0: number
  z1: number
  /** silicon only */
  dop?: Doping
  /** resist: exposure dose 0..1; softened where exposed (slide 31) */
  dose?: number
  /** aluminium sitting in a contact cut */
  plug?: boolean
  /** silicon: implant damage (amorphised), cleared by an anneal (Topic 3 slide 31) */
  dmg?: boolean
  /** silicon: grown by epitaxy (Topic 3 slides 25–26) */
  epi?: boolean
}

export type Column = readonly Interval[]

export interface Grid {
  /** layout coordinate of the left/bottom edge of column 0 (λ) */
  x0: number
  y0: number
  nx: number
  ny: number
  /** column pitch (λ) */
  d: number
}

export interface Model {
  grid: Grid
  cols: Column[]
}

export interface Rect {
  x0: number
  y0: number
  x1: number
  y1: number
}

export interface Mask {
  id: string
  name: string
  slide: number
  rects: Rect[]
}

/** A pure process operation, evaluable at fractional progress for animation. */
export type Op = (m: Model, progress: number) => Model
