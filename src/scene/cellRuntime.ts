import type { MeshResult } from '../sim/mesher'
import type { CellModel } from './CellModel'

/**
 * Per-frame cell state driven by springs (section offset, gap, explode,
 * fab playback position). Lives outside React so dragging and playback
 * never cause re-renders; the store holds only the settled values.
 */
export const cellRuntime = {
  fabPos: 0,
  sectionOffset: -4,
  gap: 0,
  explode: 0,
  res: null as MeshResult | null,
  model: null as CellModel | null,
}
