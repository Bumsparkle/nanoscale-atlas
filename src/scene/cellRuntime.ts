import type { MeshResult } from '../sim/mesher'
import type { CellModel } from './CellModel'
import { Spring, SPRINGS } from './spring'

/**
 * Per-frame cell state driven by springs (section plane, parting gap,
 * mask explode tiers, fab playback position). Lives outside React so
 * dragging and playback never cause re-renders; the store holds only the
 * settled values that belong in the URL.
 */
export const TIERS = 7

export const cellRuntime = {
  /** fab timeline position (fractional step index), critically damped so scrubbing has weight but never overshoots into the next step */
  fab: new Spring(44, { omega: 9, zeta: 1 }),
  get fabPos() {
    return this.fab.value
  },
  /** playback clock */
  play: { t: 0, from: 0 },
  /** section plane offset (λ), spring-driven */
  plane: new Spring(-4, SPRINGS.part),
  /** 0..1 near half parted */
  gapS: new Spring(0, SPRINGS.part),
  /** raw pointer offset while dragging, null otherwise */
  raw: null as number | null,
  dragging: false,
  /** per-tier explode amount, each its own spring so they settle one by one */
  tiers: Array.from({ length: TIERS }, () => new Spring(0, SPRINGS.layerClick)),
  res: null as MeshResult | null,
  model: null as CellModel | null,
  get sectionOffset() {
    return this.plane.value
  },
  get gap() {
    return Math.max(0, this.gapS.value)
  },
  get explode() {
    return this.tiers.map((t) => Math.max(0, t.value))
  },
}

/** screen-space label anchors published by the scene for the DOM overlay */
export interface ScreenLabel {
  id: string
  text: string
  sub?: string
  x: number
  y: number
  group: 'top' | 'bottom' | 'side'
  visible: boolean
}
export const overlay = {
  labels: [] as ScreenLabel[],
  /** bumps when the label set changes (not positions) */
  version: 0,
}

if (typeof window !== 'undefined') (window as unknown as { __cellRuntime: unknown }).__cellRuntime = cellRuntime
