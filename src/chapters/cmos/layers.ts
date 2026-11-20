/**
 * The six zoom layers of chapter 1. Each layer is its own scene with its own
 * unit, so no scene ever spans more than ~3 orders of magnitude (float
 * precision stays comfortable and near/far planes stay tight).
 */
export type LayerId = 'wafer' | 'die' | 'cell' | 'transistor' | 'oxide' | 'lattice'

export interface LayerDef {
  id: LayerId
  /** URL segments after /cmos */
  path: string[]
  crumb: string
  title: string
  /** metres represented by one scene unit */
  metresPerUnit: number
  /** camera distance limits in scene units: zooming past min dives, past max surfaces */
  minDist: number
  maxDist: number
  restDist: number
  /** spherical rest angles (radians): polar from +Y, azimuth around Y */
  restPolar: number
  restAzimuth: number
  near: number
  far: number
  /** short scale note shown with the scale bar */
  scaleNote: string
}

export const LAYERS: LayerDef[] = [
  {
    id: 'wafer', path: ['wafer'], crumb: 'wafer', title: '300 mm wafer',
    metresPerUnit: 1e-3, minDist: 60, maxDist: 900, restDist: 430, restPolar: 0.95, restAzimuth: 0.35,
    near: 1, far: 5000, scaleNote: '300 mm wafer · beyond the lecture',
  },
  {
    id: 'die', path: ['die'], crumb: 'die', title: 'Die',
    metresPerUnit: 1e-5, minDist: 6, maxDist: 900, restDist: 520, restPolar: 0.7, restAzimuth: 0.25,
    near: 0.05, far: 5000, scaleNote: '4 mm die, illustrative',
  },
  {
    id: 'cell', path: ['inverter'], crumb: 'inverter cell', title: 'CMOS inverter cell',
    metresPerUnit: 0.3e-6, minDist: 8, maxDist: 160, restDist: 78, restPolar: 0.92, restAzimuth: -0.42,
    near: 0.1, far: 1000, scaleNote: 'λ = 0.3 µm (slide 46)',
  },
  {
    id: 'transistor', path: ['inverter', 'nmos'], crumb: 'nMOS', title: 'nMOS transistor',
    metresPerUnit: 0.3e-6, minDist: 3, maxDist: 60, restDist: 26, restPolar: 1.05, restAzimuth: -0.55,
    near: 0.05, far: 500, scaleNote: 'L = 2λ = 0.6 µm (slides 46, 48)',
  },
  {
    id: 'oxide', path: ['inverter', 'nmos', 'gate-oxide'], crumb: 'gate oxide', title: 'Gate oxide',
    metresPerUnit: 1e-10, minDist: 8, maxDist: 160, restDist: 62, restPolar: 1.32, restAzimuth: -0.3,
    near: 0.1, far: 1000, scaleNote: '< 20 Å, 6–7 atomic layers (slide 37)',
  },
  {
    id: 'lattice', path: ['inverter', 'nmos', 'gate-oxide', 'lattice'], crumb: 'Si lattice', title: 'Silicon lattice',
    metresPerUnit: 1e-10, minDist: 6, maxDist: 60, restDist: 22, restPolar: 1.1, restAzimuth: 0.6,
    near: 0.05, far: 500, scaleNote: 'a = 5.43 Å · beyond the lecture',
  },
]

export const LAYER_BY_ID = Object.fromEntries(LAYERS.map((l) => [l.id, l])) as Record<LayerId, LayerDef>

export function layerIndex(id: LayerId) {
  return LAYERS.findIndex((l) => l.id === id)
}

/** The transistor layer has two variants sharing one scene. */
export type Device = 'nmos' | 'pmos'
