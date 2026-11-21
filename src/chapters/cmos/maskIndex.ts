import type { Mask } from '../../sim/types'
import { layoutState, masksOf } from './layout'

/** masks of the current layout by id, for scene effects that draw the reticle */
export function currentMasks(): Record<string, Mask> {
  return masksOf(layoutState.get())
}
