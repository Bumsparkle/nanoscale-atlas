import { create } from 'zustand'
import type { Device, LayerId } from '../chapters/cmos/layers'
import { MASK_IDS, type MaskId } from '../chapters/cmos/layout'
import type { SourceRef } from '../sources'

export type Page = 'home' | 'atlas' | 'style' | 'debug'
export type View = 'explore' | 'section' | 'masks' | 'fab' | 'logic' | 'layout'
export type CutTarget = 'slide27' | 'ngate' | 'pgate'
export type CutAxis = 'x' | 'y'
export type BenchTab = 'inverter' | 'switch' | 'nand' | 'nor' | 'junction'
export type Mode = 'explore' | 'lesson' | 'revise'

export interface SectionState {
  axis: CutAxis
  /** plane offset in λ along the axis normal */
  offset: number
  locked: CutTarget | null
  /** 0..1 how far the near half has slid away */
  gap: number
}

/** Chapter 2: the process-lab experiment (a step of the slide 24 flow) */
export type ProcOp = 'wafer' | 'epitaxy' | 'oxidation' | 'litho' | 'etch' | 'diffusion' | 'implant' | 'metal' | 'packaging'
export type CellKind = 'sc' | 'bcc' | 'fcc' | 'diamond'
export type Solution = 'water' | 'h2o2' | 'o3'

export interface ProcState {
  op: ProcOp
  /** oxidation */
  ambient: 'dry' | 'wet'
  oxT: number
  oxHours: number
  /** lithography */
  tone: 'positive' | 'negative'
  /** etch */
  iso: boolean
  lineUm: number
  /** diffusion: predeposition and drive-in */
  dopant: 'B' | 'P'
  preT: number
  preMin: number
  driveT: number
  driveMin: number
  /** implantation */
  species: 'B' | 'P' | 'As'
  keV: number
  annealed: boolean
  /** epitaxy */
  epi: 'cvd' | 'mbe'
  epiMin: number
  /** metallization: evaporated thickness, nm */
  metalNm: number
}

export interface AtlasState {
  page: Page
  layer: LayerId
  device: Device
  view: View
  /** sub-view (tab) of the current layer, '' when it has none (see LayerDef.tabs) */
  tab: string
  /** Chapter 2: crystal growth (slides 16–20); Czochralski or float zone is the puller's tab */
  growth: { k0: number; frac: number; dopant: string; passes: number }
  /** Chapter 2: lattice tabs (slides 4–11, 21–22); r is the spacing in units of the crystal spacing a */
  crystal: { cell: CellKind; offset: number; hkl: [number, number, number]; r: number; T: number }
  /** Chapter 2: process lab (slides 24–32) */
  proc: ProcState
  /** Chapter 3 (Topic 4) */
  clean: {
    /** cleanroom class shown (particles ≥ 0.5 µm per ft³) */
    cls: number
    /** contamination sources switched on */
    sources: { person: boolean; book: boolean; gloves: boolean }
    /** wet bench: number of RCA steps done (0 … RCA_STEPS.length) */
    rca: number
    /** redox: chosen metal couple and solution */
    metal: string
    solution: Solution
    /** gettering: temperature-cycle stage (0–3) and gettering step (0–3) */
    cycle: number
    getter: number
    /** yield model: defect density (cm⁻²), die area (cm²), clustering factor, particle seed */
    D0: number
    A: number
    C: number
    seed: number
  }
  focus: string | null
  hover: string | null
  section: SectionState
  /** fab step (integer index into the recipe; fractional while playing) */
  step: number
  playing: boolean
  inputs: { a: 0 | 1; b: 0 | 1 }
  /** gate voltage for the transistor layer, as a fraction of VDD */
  vg: number
  /** Layout view: visible mask layers, edit mode, and the edited-layout version (mirrors layoutState) */
  layoutLayers: MaskId[]
  layoutEdit: boolean
  layoutVersion: number
  lattice: { structure: 'crystal' | 'poly' | 'amorphous'; dopant: 'none' | 'P' | 'B' }
  /** logic bench (Logic view): tab, switch-model gate, junction bias (V) and Na/Nd */
  bench: { tab: BenchTab; g: 0 | 1; v: number; ratio: number }
  /** learning modes (Explore is the sandbox) */
  mode: Mode
  /** current lesson position: a step id or review:<section> */
  lessonAt: string | null
  /** Revise sub-view */
  revise: { tab: 'drill' | 'coverage' | 'exam'; from: number; to: number; area: string | null }
  /** camera target set by the lesson (does not open a panel) */
  look: string | null
  /** object outlined by a hint after a wrong answer */
  hint: string | null
  /** an unanswered question is open: hide labels and readouts that would give the answer away */
  quiz: boolean
  /** the Source modal: lecture slides being shown */
  source: { refs: SourceRef[]; index: number } | null
  /** Explore: tint objects by mastery */
  mastery: boolean
  /** bumps when learning progress changes (localStorage is not reactive) */
  progressVersion: number
  reducedMotion: boolean
  /** fab animation speed, 0.25–2× (see state/timescale.ts) */
  speed: number
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

function initialSpeed() {
  try {
    const v = Number(localStorage.getItem('atlas.speed.v1'))
    return v >= 0.25 && v <= 2 ? v : 1
  } catch {
    return 1
  }
}

const prefersReduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export const PROC_DEFAULT: ProcState = {
  op: 'oxidation', ambient: 'dry', oxT: 1000, oxHours: 1, tone: 'positive', iso: true, lineUm: 2,
  dopant: 'B', preT: 950, preMin: 30, driveT: 1100, driveMin: 60, species: 'B', keV: 50, annealed: false,
  epi: 'cvd', epiMin: 30, metalNm: 500,
}
export const CLEAN_DEFAULT: AtlasState['clean'] = {
  cls: 100, sources: { person: false, book: false, gloves: false }, rca: 0, metal: 'Fe', solution: 'water',
  cycle: 0, getter: 0, D0: 0.5, A: 1, C: 2, seed: 1,
}

export const useAtlas = create<AtlasState>((set) => ({
  page: 'home',
  layer: 'cell',
  device: 'nmos',
  view: 'explore',
  tab: '',
  growth: { k0: 0.35, frac: 0.5, dopant: 'P', passes: 1 },
  crystal: { cell: 'diamond', offset: 1, hkl: [1, 0, 0], r: 1, T: 1000 },
  proc: PROC_DEFAULT,
  clean: CLEAN_DEFAULT,
  focus: null,
  hover: null,
  section: { axis: 'y', offset: -4, locked: null, gap: 0 },
  step: 0,
  playing: false,
  inputs: { a: 0, b: 0 },
  vg: 0,
  layoutLayers: [...MASK_IDS],
  layoutEdit: false,
  layoutVersion: 0,
  lattice: { structure: 'crystal', dopant: 'none' },
  bench: { tab: 'inverter', g: 1, v: 0, ratio: 1 },
  mode: 'explore',
  lessonAt: null,
  revise: { tab: 'drill', from: 1, to: 49, area: null },
  look: null,
  hint: null,
  quiz: false,
  source: null,
  mastery: false,
  progressVersion: 0,
  reducedMotion: !!prefersReduced,
  speed: initialSpeed(),
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
