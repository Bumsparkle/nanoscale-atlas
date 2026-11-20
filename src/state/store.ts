import { create } from 'zustand'
import type { Device, LayerId } from '../chapters/cmos/layers'

export type Page = 'home' | 'atlas' | 'style' | 'debug'
export type View = 'explore' | 'section' | 'masks' | 'fab' | 'logic'
export type CutTarget = 'slide27' | 'ngate' | 'pgate'
export type CutAxis = 'x' | 'y'

export interface SectionState {
  axis: CutAxis
  /** plane offset in λ along the axis normal */
  offset: number
  locked: CutTarget | null
  /** 0..1 how far the near half has slid away */
  gap: number
}

export interface AtlasState {
  page: Page
  layer: LayerId
  device: Device
  view: View
  focus: string | null
  hover: string | null
  section: SectionState
  /** fab step (integer index into the recipe; fractional while playing) */
  step: number
  playing: boolean
  inputs: { a: 0 | 1; b: 0 | 1 }
  /** gate voltage for the transistor layer, as a fraction of VDD */
  vg: number
  lattice: { structure: 'crystal' | 'poly' | 'amorphous'; dopant: 'none' | 'P' | 'B' }
  sound: boolean
  reducedMotion: boolean
  explode: number
  renderer: { backend: 'webgpu' | 'webgl2' | 'pending' | 'failed'; detail?: string }
  /** real loading milestones, used by the gowning sequence */
  boot: { shell: boolean; gpu: boolean; frame: boolean; layers: number }
  set: (p: Partial<AtlasState>) => void
  setSection: (p: Partial<SectionState>) => void
}

export const SNAP_TARGETS: Record<CutTarget, { axis: CutAxis; offset: number; label: string; slide: number }> = {
  // offsets in λ, in layout coordinates (see chapters/cmos/masks.ts)
  slide27: { axis: 'y', offset: 2, label: 'Slide 27 line: both transistors and both taps', slide: 27 },
  ngate: { axis: 'x', offset: 10, label: 'Along the nMOS gate', slide: 25 },
  pgate: { axis: 'x', offset: 34, label: 'Along the pMOS gate', slide: 25 },
}

const prefersReduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export const useAtlas = create<AtlasState>((set) => ({
  page: 'home',
  layer: 'cell',
  device: 'nmos',
  view: 'explore',
  focus: null,
  hover: null,
  section: { axis: 'y', offset: -4, locked: null, gap: 0 },
  step: 0,
  playing: false,
  inputs: { a: 0, b: 0 },
  vg: 0,
  lattice: { structure: 'crystal', dopant: 'none' },
  sound: false,
  reducedMotion: !!prefersReduced,
  explode: 0,
  renderer: { backend: 'pending' },
  boot: { shell: false, gpu: false, frame: false, layers: 0 },
  set: (p) => set(p),
  setSection: (p) => set((s) => ({ section: { ...s.section, ...p } })),
}))

/**
 * Per-frame values that must not trigger React renders (camera scale, fps).
 * The scene writes, DOM widgets read in their own rAF loop.
 */
export const live = {
  /** metres per CSS pixel at the focus distance */
  metresPerPixel: 1e-6,
  fps: 60,
  dpr: 1,
  /** projected screen points for label overlays, keyed by label id */
  labels: new Map<string, { x: number; y: number; visible: boolean }>(),
}
