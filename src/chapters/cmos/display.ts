import type { MeshOptions } from '../../sim/mesher'
import { LAMBDA_NM } from './masks'

/**
 * Display scaling. One scene unit = λ = 300 nm in every direction, except
 * the gate oxide, which is 2 nm and would be invisible: it is drawn ×50.
 * The UI always shows these factors.
 */
export const Z_EXAGGERATION: Partial<Record<string, number>> = { gox: 50 }

export const MESH_OPTS: MeshOptions = {
  nmPerUnit: LAMBDA_NM,
  zScale: (iv) => Z_EXAGGERATION[iv.mat] ?? 1,
}

export const EXAGGERATION_NOTE = 'vertical ×1 · gate oxide ×50'
