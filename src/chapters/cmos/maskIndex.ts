import type { Mask } from '../../sim/types'
import { MASKS } from './masks'

/** masks by id, for scene effects that draw the reticle */
export const CONTENT_MASKS: Record<string, Mask> = Object.fromEntries(MASKS.map((m) => [m.id, m]))
