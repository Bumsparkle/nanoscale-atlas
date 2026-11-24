import type { Scene } from '../../src/learn/schema'

/** Topic 7 scene presets shared by the questions and the lesson (defaults match LITHO_DEFAULT) */
export const LD = {
  system: 'projection', source: 'krf', NA: 0.6, k1: 0.75, k2: 0.5, S: 0.6, sep: 1.6, feature: 300, gap: 10, W: 4,
  rstep: 0, rpm: 4000, dose: 150, year: 2004, keV: 20, eb: 0, print: false, fit: false, fNm: 600,
}
type L = Partial<typeof LD>
export const TOOL = (l: L = {}): Scene => ({ layer: 'litho', tab: 'tool', litho: { ...LD, ...l } })
export const OPTICS = (l: L = {}): Scene => ({ layer: 'litho', tab: 'optics', litho: { ...LD, ...l } })
export const MTF = (l: L = {}): Scene => ({ layer: 'litho', tab: 'mtf', litho: { ...LD, ...l } })
export const FRESNEL = (l: L = {}): Scene => ({ layer: 'litho', tab: 'fresnel', litho: { ...LD, ...l } })
export const RESIST = (l: L = {}): Scene => ({ layer: 'litho', tab: 'resist', litho: { ...LD, ...l } })
export const ROADMAP = (l: L = {}): Scene => ({ layer: 'litho', tab: 'roadmap', litho: { ...LD, ...l } })
export const NGL = (l: L = {}): Scene => ({ layer: 'litho', tab: 'ngl', litho: { ...LD, ...l } })
export const WRITE = (l: L = {}): Scene => ({ layer: 'ebeam', tab: 'write', litho: { ...LD, ...l } })
export const LIFTOFF = (l: L = {}): Scene => ({ layer: 'ebeam', tab: 'liftoff', litho: { ...LD, ...l } })
export const PROX = (l: L = {}): Scene => ({ layer: 'ebeam', tab: 'proximity', litho: { ...LD, ...l } })
