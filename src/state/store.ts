import { create } from 'zustand'
import type { Device, LayerId } from '../chapters/cmos/layers'
import { MASK_IDS, type MaskId } from '../chapters/cmos/layout'
import type { SourceRef, TopicId } from '../sources'

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
  /** lithography; fullResist runs Topic 7's eight-step resist process */
  tone: 'positive' | 'negative'
  fullResist: boolean
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
  /** Chapter 4 (Topic 5): deposition bay controls */
  films: {
    /** CVD: temperature (°C), pressure (torr), mole fraction */
    T: number
    P: number
    Y: number
    /** plasma chamber mode */
    plasma: 'pecvd' | 'dc' | 'rf' | 'magnetron'
    /** evaporator: log10 of pressure (torr), e-beam source */
    logP: number
    ebeam: boolean
    /** step coverage */
    method: 'cvd' | 'sputter' | 'evaporation'
    aspect: number
    Sc: number
  }
  /** Chapter 5 (Topic 6): epitaxy controls */
  epi: {
    /** Si epi: temperature, growth rate (µm/min), substrate dopant, backside seal, reduced pressure */
    T: number
    rate: number
    sub: 'As' | 'Sb' | 'B'
    seal: boolean
    rp: boolean
    /** MBE: Ga beam pressure at the substrate (log10 Pa), Ga shutter, monolayers grown */
    logGa: number
    shutter: boolean
    ml: number
    /** surface: growth mode and coverage (monolayers) */
    mode: 'fvdm' | 'sk' | 'vw'
    coverage: number
    /** strain: film, substrate and thickness (nm) */
    film: string
    substrate: string
    thick: number
    /** SOI smart-cut step (0–5) */
    soi: number
  }
  /** Chapter 6 (Topic 7): lithography */
  litho: {
    /** exposure system and source */
    system: 'contact' | 'proximity' | 'projection'
    source: 'g' | 'i' | 'krf' | 'arf' | 'f2'
    NA: number
    k1: number
    k2: number
    /** spatial coherence S */
    S: number
    /** diffraction tab: separation of two point images in Airy radii (0: one point) */
    sep: number
    /** MTF tab: line width (nm), equal lines and spaces */
    feature: number
    /** proximity tab: gap and opening width (µm) */
    gap: number
    W: number
    /** resist tab: steps done (0–8), spin speed (rpm), dose (mJ/cm²) */
    rstep: number
    rpm: number
    dose: number
    /** roadmap year */
    year: number
    /** e-beam: beam energy (keV) and lift-off step (0–6) */
    keV: number
    eb: number
    /** the inverter printed by this tool (Layout view): on, design follows the tool, design f (nm) */
    print: boolean
    fit: boolean
    fNm: number
  }
  /** Chapter 7 (Topic 8): III–V nanostructures */
  nano: {
    /** sample being grown and how many of its layers are down */
    sample: string
    grown: number
    /** alignment tab: well and barrier materials */
    well: string
    barrier: string
    /** quantum-well tab: width (nm), depth (eV), mass (m₀), finite or infinite, selected level, ψ or |ψ|² */
    L: number
    V0: number
    m: number
    finite: boolean
    level: number
    prob: boolean
    /** free electron: wavevector probe (nm⁻¹) */
    k: number
    /** confinement: directions confined (1 well, 2 wire, 3 dot) and box sides (nm) */
    dims: 1 | 2 | 3
    a: number
    b: number
    c: number
    /** density of states: degrees of freedom shown and the energy probe (meV) */
    dof: 0 | 1 | 2 | 3
    E: number
    /** fabrication route step, VLS seed, colloidal dot diameter (nm), laser temperature (°C) */
    fstep: number
    seed: 'au' | 'self'
    dotNm: number
    T: number
    /** scale tab: log10 of the size in metres */
    logSize: number
  }
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
  revise: { tab: 'drill' | 'coverage' | 'exam'; topic: TopicId | null; from: number; to: number; area: string | null }
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


export const PROC_DEFAULT: ProcState = {
  op: 'oxidation', ambient: 'dry', oxT: 1000, oxHours: 1, tone: 'positive', fullResist: false, iso: true, lineUm: 2,
  dopant: 'B', preT: 950, preMin: 30, driveT: 1100, driveMin: 60, species: 'B', keV: 50, annealed: false,
  epi: 'cvd', epiMin: 30, metalNm: 500,
}
export const FILMS_DEFAULT: AtlasState['films'] = { T: 900, P: 760, Y: 0.01, plasma: 'pecvd', logP: -6, ebeam: false, method: 'cvd', aspect: 2, Sc: 0.1 }
export const EPI_DEFAULT: AtlasState['epi'] = {
  T: 1100, rate: 1, sub: 'As', seal: false, rp: false, logGa: -3.5, shutter: true, ml: 0, mode: 'fvdm', coverage: 1.5,
  film: 'InAs', substrate: 'GaAs', thick: 1, soi: 0,
}
export const LITHO_DEFAULT: AtlasState['litho'] = {
  system: 'projection', source: 'krf', NA: 0.6, k1: 0.75, k2: 0.5, S: 0.6, sep: 1.6, feature: 300, gap: 10, W: 4,
  rstep: 0, rpm: 4000, dose: 150, year: 2004, keV: 20, eb: 0, print: false, fit: false, fNm: 600,
}
export const NANO_DEFAULT: AtlasState['nano'] = {
  sample: 'qw', grown: 5, well: 'GaAs', barrier: 'AlGaAs', L: 10, V0: 0.3, m: 0.067, finite: false, level: 1, prob: false, k: 0.5,
  dims: 1, a: 10, b: 10, c: 10, dof: 3, E: 60, fstep: 0, seed: 'au', dotNm: 4, T: 25, logSize: -8,
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
  films: FILMS_DEFAULT,
  epi: EPI_DEFAULT,
  litho: LITHO_DEFAULT,
  nano: NANO_DEFAULT,
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
  revise: { tab: 'drill', topic: null, from: 1, to: 49, area: null },
  look: null,
  hint: null,
  quiz: false,
  source: null,
  mastery: false,
  progressVersion: 0,
  // motion is always full: no toggle, and the OS reduced-motion setting is not applied
  reducedMotion: false,
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
