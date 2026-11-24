import type { Scene } from '../../src/learn/schema'

/** Topic 8 scene presets shared by the questions and the lesson (defaults match NANO_DEFAULT) */
export const ND = {
  sample: 'qw', grown: 5, well: 'GaAs', barrier: 'AlGaAs', L: 10, V0: 0.3, m: 0.067, finite: false, level: 1, prob: false, k: 0.5,
  dims: 1, a: 10, b: 10, c: 10, dof: 3, E: 60, fstep: 0, seed: 'au', dotNm: 4, T: 25, logSize: -8,
}
type N = Partial<typeof ND>
export const QMBE = (n: N = {}): Scene => ({ layer: 'qmbe', nano: { ...ND, ...n } })
export const SCALE = (n: N = {}): Scene => ({ layer: 'qsample', tab: 'scale', nano: { ...ND, ...n } })
export const SAMPLE = (n: N = {}): Scene => ({ layer: 'qsample', tab: 'sample', nano: { ...ND, ...n } })
export const LAYERS = (n: N = {}): Scene => ({ layer: 'hetero', tab: 'stack', nano: { ...ND, ...n } })
export const TEM = (n: N = {}): Scene => ({ layer: 'hetero', tab: 'tem', nano: { ...ND, ...n } })
export const BANDS = (n: N = {}): Scene => ({ layer: 'qbands', tab: 'bands', nano: { ...ND, ...n } })
export const ALIGN = (n: N = {}): Scene => ({ layer: 'qbands', tab: 'align', nano: { ...ND, ...n } })
export const FREE = (n: N = {}): Scene => ({ layer: 'qwave', tab: 'free', nano: { ...ND, ...n } })
export const WELL = (n: N = {}): Scene => ({ layer: 'qwave', tab: 'well', nano: { ...ND, ...n } })
export const CONFINE = (n: N = {}): Scene => ({ layer: 'qwave', tab: 'confine', nano: { ...ND, ...n } })
export const DOS = (n: N = {}): Scene => ({ layer: 'qwave', tab: 'dos', nano: { ...ND, ...n } })
export const FAB = (tab: string, n: N = {}): Scene => ({ layer: 'nanofab', tab, nano: { ...ND, ...n } })
