import type { Grid, Mask, Rect } from '../../sim/types'

/**
 * The six masks of the inverter (slides 27–28), drawn on a λ grid.
 * x runs along the slide 27 dashed line (left → right: substrate tap,
 * nMOS, output, pMOS, well tap); y is perpendicular, in the layout plane.
 * The dashed line is y = 2. Every dimension meets the slide 47 rules
 * (checked in rules.test.ts).
 */
const r = (x0: number, y0: number, x1: number, y1: number): Rect => ({ x0, y0, x1, y1 })

export const NWELL: Mask = { id: 'nwell', name: 'n-well', slide: 28, rects: [r(22, -6, 50, 10)] }

export const POLY: Mask = {
  id: 'poly',
  name: 'Polysilicon',
  slide: 28,
  rects: [
    r(9, -2, 11, 12), // nMOS gate leg (L = 2λ)
    r(33, -2, 35, 12), // pMOS gate leg
    r(9, 10, 35, 12), // bridge: one poly node, input A
  ],
}

export const NPLUS: Mask = {
  id: 'nplus',
  name: 'n+ diffusion',
  slide: 28,
  rects: [
    r(4, 0, 16, 4), // nMOS source / drain (W = 4λ)
    r(40, 0, 44, 4), // n-well tap
  ],
}

export const PPLUS: Mask = {
  id: 'pplus',
  name: 'p+ diffusion',
  slide: 28,
  rects: [
    r(0, 0, 4, 4), // substrate tap
    r(28, 0, 40, 4), // pMOS source / drain
  ],
}

export const CONTACT: Mask = {
  id: 'contact',
  name: 'Contact',
  slide: 28,
  rects: [1, 5, 13, 29, 37, 41].map((x) => r(x, 1, x + 2, 3)),
}

export const METAL: Mask = {
  id: 'metal',
  name: 'Metal',
  slide: 28,
  rects: [
    r(0, -8, 4, 12), // GND rail
    r(0, 0, 8, 4), // GND arm: substrate tap + nMOS source
    r(12, 0, 32, 4), // Y: nMOS drain to pMOS drain
    r(36, 0, 44, 4), // VDD arm: pMOS source + well tap
    r(40, -8, 44, 12), // VDD rail
  ],
}

export const MASKS = [NWELL, POLY, NPLUS, PPLUS, CONTACT, METAL] as const

/** Simulation domain (λ). 1λ columns: every mask edge lies on the grid. */
export const GRID: Grid = { x0: -6, y0: -12, nx: 62, ny: 28, d: 1 }

/** Slide 27 dashed line */
export const SLIDE27_Y = 2

/** λ = f/2 = 0.3 µm in the 0.6 µm example process (slide 46) */
export const LAMBDA_NM = 300
