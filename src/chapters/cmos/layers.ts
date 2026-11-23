/**
 * The zoom ladder. Each layer is its own scene with its own unit, so no
 * scene ever spans more than ~3 orders of magnitude (float precision stays
 * comfortable and near/far planes stay tight).
 *
 * Chapter 2 (Topic 3) extends the ladder upwards, from sand to the sliced
 * wafer; Chapter 3 (Topic 4) is the cleanroom the wafer is processed in;
 * Chapter 1 (Topic 2) runs from the wafer on the chuck down to the atoms.
 */
export type LayerId =
  | 'sand' | 'polysilicon' | 'puller' | 'ingot' | 'wafers'
  | 'cleanroom' | 'deposition' | 'mbe' | 'surface'
  | 'wafer' | 'die' | 'cell' | 'transistor' | 'oxide' | 'lattice'

export type ChapterId = 'ch1' | 'ch2' | 'ch3' | 'ch4' | 'ch5'

export interface LayerDef {
  id: LayerId
  chapter: ChapterId
  /** full URL path segments, e.g. ['growth', 'czochralski'] or ['cmos', 'inverter', 'nmos'] */
  path: string[]
  crumb: string
  title: string
  /** metres represented by one scene unit */
  metresPerUnit: number
  /** camera distance limits in scene units: zooming past min dives, past max surfaces */
  minDist: number
  maxDist: number
  restDist: number
  /** spherical rest angles (radians): polar from +Y, azimuth around Y */
  restPolar: number
  restAzimuth: number
  near: number
  far: number
  /** short scale note shown with the scale bar */
  scaleNote: string
  /** the layer above it for breadcrumbs and Esc (default: the previous layer in the list) */
  up?: LayerId
  /** sub-views (tabs) of this layer, first is the default */
  tabs?: { id: string; label: string; chapter: ChapterId; hint: string }[]
}

export const LAYERS: LayerDef[] = [
  {
    id: 'sand', chapter: 'ch2', path: ['growth', 'sand'], crumb: 'sand', title: 'Quartz sand (SiO₂)',
    metresPerUnit: 1e-4, minDist: 14, maxDist: 500, restDist: 230, restPolar: 0.95, restAzimuth: 0.5,
    near: 0.1, far: 4000, scaleNote: 'grains 0.1–2 mm · 1 unit = 0.1 mm',
  },
  {
    id: 'polysilicon', chapter: 'ch2', path: ['growth', 'polysilicon'], crumb: 'polysilicon', title: 'Refined polysilicon',
    metresPerUnit: 1e-3, minDist: 300, maxDist: 9000, restDist: 4200, restPolar: 1.2, restAzimuth: 0.35,
    near: 1, far: 60000, scaleNote: 'Siemens rods ~2 m · chunks 2–10 cm',
  },
  {
    id: 'puller', chapter: 'ch2', path: ['growth', 'czochralski'], crumb: 'CZ puller', title: 'Czochralski puller',
    metresPerUnit: 1e-2, minDist: 40, maxDist: 1300, restDist: 520, restPolar: 1.2, restAzimuth: 0.6,
    near: 0.5, far: 20000, scaleNote: 'puller ~4 m tall · melt ≈ 1415 °C',
    tabs: [
      { id: 'cz', label: 'Czochralski', chapter: 'ch2', hint: 'Drag k0 and the pulled fraction: the ingot shows its doping' },
      { id: 'fz', label: 'Float zone', chapter: 'ch2', hint: 'Move the molten zone along the rod; more passes refine it further' },
    ],
  },
  {
    id: 'ingot', chapter: 'ch2', path: ['growth', 'ingot'], crumb: 'ingot', title: 'Single-crystal ingot',
    metresPerUnit: 1e-2, minDist: 20, maxDist: 900, restDist: 330, restPolar: 1.15, restAzimuth: 0.45,
    near: 0.2, far: 10000, scaleNote: '300 mm diameter · ~1.5 m body',
  },
  {
    id: 'wafers', chapter: 'ch2', path: ['growth', 'wafers'], crumb: 'wafers', title: 'Slicing into wafers',
    metresPerUnit: 1e-3, minDist: 300, maxDist: 8000, restDist: 3000, restPolar: 1.1, restAzimuth: 0.55,
    near: 1, far: 60000, scaleNote: 'wafer 300 mm × 775 µm · beyond the lecture',
  },
  {
    id: 'cleanroom', chapter: 'ch3', path: ['clean', 'cleanroom'], crumb: 'cleanroom', title: 'The cleanroom',
    metresPerUnit: 1e-1, minDist: 12, maxDist: 320, restDist: 150, restPolar: 1.18, restAzimuth: 0.62,
    near: 0.05, far: 4000, scaleNote: 'bay ~12 m · 1 unit = 10 cm',
    tabs: [
      { id: 'room', label: 'Room', chapter: 'ch3', hint: 'Air falls from the ceiling HEPA filters · click anything to inspect' },
      { id: 'wetbench', label: 'Wet bench', chapter: 'ch3', hint: 'Step the wafer through the RCA clean' },
      { id: 'redox', label: 'Redox', chapter: 'ch3', hint: 'Pick a metal and a solution: does it dissolve or plate out?' },
    ],
  },
  {
    id: 'deposition', chapter: 'ch4', path: ['films', 'deposition'], crumb: 'deposition bay', title: 'Deposition bay', up: 'cleanroom',
    metresPerUnit: 1e-2, minDist: 30, maxDist: 900, restDist: 300, restPolar: 1.15, restAzimuth: 0.55,
    near: 0.2, far: 10000, scaleNote: 'reactors ~1–2 m · 1 unit = 1 cm',
    tabs: [
      { id: 'cvd', label: 'CVD', chapter: 'ch4', hint: 'Change temperature and pressure: who limits the growth, the gas or the surface?' },
      { id: 'plasma', label: 'Plasma', chapter: 'ch4', hint: 'PECVD, DC, RF and magnetron sputtering in one chamber' },
      { id: 'pvd', label: 'Evaporation', chapter: 'ch4', hint: 'Pump down: the mean free path outgrows the chamber' },
      { id: 'coverage', label: 'Step coverage', chapter: 'ch4', hint: 'Coat a trench by CVD, sputtering or evaporation' },
      { id: 'siepi', label: 'Si epitaxy', chapter: 'ch5', hint: 'Grow an epi layer and fight autodoping' },
    ],
  },
  {
    id: 'mbe', chapter: 'ch5', path: ['epi', 'mbe'], crumb: 'MBE', title: 'Molecular beam epitaxy', up: 'cleanroom',
    metresPerUnit: 1e-2, minDist: 25, maxDist: 700, restDist: 230, restPolar: 1.12, restAzimuth: 0.7,
    near: 0.2, far: 8000, scaleNote: 'growth chamber ~1 m · 1 unit = 1 cm',
  },
  {
    id: 'surface', chapter: 'ch5', path: ['epi', 'surface'], crumb: 'growth surface', title: 'The growing surface', up: 'mbe',
    metresPerUnit: 1e-10, minDist: 12, maxDist: 200, restDist: 80, restPolar: 0.95, restAzimuth: 0.6,
    near: 0.05, far: 1000, scaleNote: '1 unit = 1 Å · atoms drawn on a simple cubic grid',
    tabs: [
      { id: 'modes', label: 'Growth modes', chapter: 'ch5', hint: 'Islands, layers, or layers then islands' },
      { id: 'strain', label: 'Lattice mismatch', chapter: 'ch5', hint: 'Pick a film and a substrate; grow it thicker until it relaxes' },
    ],
  },
  {
    id: 'wafer', chapter: 'ch1', path: ['cmos', 'wafer'], up: 'cleanroom', crumb: 'wafer', title: '300 mm wafer',
    metresPerUnit: 1e-3, minDist: 60, maxDist: 900, restDist: 430, restPolar: 0.95, restAzimuth: 0.35,
    near: 1, far: 5000, scaleNote: '300 mm wafer · beyond the lecture',
    tabs: [
      { id: 'explore', label: 'Wafer', chapter: 'ch1', hint: 'Scroll to zoom into the marked die · click anything to inspect' },
      { id: 'process', label: 'Process flow', chapter: 'ch2', hint: 'Click a step of the wafer-fab flow to run it on a cross-section' },
      { id: 'gettering', label: 'Gettering', chapter: 'ch3', hint: 'Grow the precipitates, then getter the metal atoms' },
      { id: 'yield', label: 'Yield', chapter: 'ch3', hint: 'Scatter particles: every die a particle lands on fails' },
      { id: 'soi', label: 'SOI', chapter: 'ch5', hint: 'Step through smart cut: oxidise, implant H, bond, split, polish' },
    ],
  },
  {
    id: 'die', chapter: 'ch1', path: ['cmos', 'die'], crumb: 'die', title: 'Die',
    metresPerUnit: 1e-5, minDist: 6, maxDist: 1100, restDist: 760, restPolar: 0.78, restAzimuth: 0.25,
    near: 0.05, far: 5000, scaleNote: '4 mm die, illustrative',
  },
  {
    id: 'cell', chapter: 'ch1', path: ['cmos', 'inverter'], crumb: 'inverter cell', title: 'CMOS inverter cell',
    metresPerUnit: 0.3e-6, minDist: 24, maxDist: 190, restDist: 112, restPolar: 0.9, restAzimuth: -0.5,
    near: 0.1, far: 1000, scaleNote: 'λ = 0.3 µm',
  },
  {
    id: 'transistor', chapter: 'ch1', path: ['cmos', 'inverter', 'nmos'], crumb: 'nMOS', title: 'nMOS transistor',
    metresPerUnit: 0.3e-6, minDist: 6, maxDist: 70, restDist: 30, restPolar: 1.22, restAzimuth: -0.32,
    near: 0.05, far: 500, scaleNote: 'L = 2λ = 0.6 µm',
  },
  {
    id: 'oxide', chapter: 'ch1', path: ['cmos', 'inverter', 'nmos', 'gate-oxide'], crumb: 'gate oxide', title: 'Gate oxide',
    metresPerUnit: 1e-10, minDist: 14, maxDist: 220, restDist: 118, restPolar: 1.3, restAzimuth: -0.35,
    near: 0.1, far: 1000, scaleNote: '< 20 Å, 6–7 atomic layers',
  },
  {
    id: 'lattice', chapter: 'ch1', path: ['cmos', 'inverter', 'nmos', 'gate-oxide', 'lattice'], crumb: 'Si lattice', title: 'Silicon lattice',
    metresPerUnit: 1e-10, minDist: 10, maxDist: 90, restDist: 44, restPolar: 1.1, restAzimuth: 0.6,
    near: 0.05, far: 500, scaleNote: 'a = 5.43 Å · beyond the lecture',
    tabs: [
      { id: 'structure', label: 'Structure', chapter: 'ch1', hint: 'Switch structure and dopant · Esc goes up' },
      { id: 'cells', label: 'Unit cells', chapter: 'ch2', hint: 'Cubic, BCC, FCC, then slide the second FCC in to make diamond' },
      { id: 'miller', label: 'Miller planes', chapter: 'ch2', hint: 'Type h k l: the plane cuts the cell and its atoms light up' },
      { id: 'bands', label: 'Bands', chapter: 'ch2', hint: 'Drag the spacing: atomic levels become bands' },
      { id: 'defects', label: 'Defects', chapter: 'ch2', hint: 'Heat the crystal: vacancies and interstitials appear' },
    ],
  },
]

export const LAYER_BY_ID = Object.fromEntries(LAYERS.map((l) => [l.id, l])) as Record<LayerId, LayerDef>

/** the layer above (breadcrumbs, Esc, surfacing) */
export function parentOf(id: LayerId): LayerId | null {
  const def = LAYER_BY_ID[id]
  if (def.up) return def.up
  const i = LAYERS.findIndex((l) => l.id === id)
  return i > 0 ? LAYERS[i - 1].id : null
}
/** the chain from the top of this layer's ancestry down to it */
export function ancestry(id: LayerId): LayerId[] {
  const out: LayerId[] = [id]
  for (let p = parentOf(id); p && out.length < 20; p = parentOf(p)) out.unshift(p)
  return out
}

export function layerIndex(id: LayerId) {
  return LAYERS.findIndex((l) => l.id === id)
}

/** default tab of a layer ('' when it has none) */
export const defaultTab = (id: LayerId) => LAYER_BY_ID[id].tabs?.[0].id ?? ''

/** The transistor layer has two variants sharing one scene. */
export type Device = 'nmos' | 'pmos'

export interface ChapterDef {
  id: ChapterId
  n: number
  title: string
  topic: 'topic2' | 'topic3' | 'topic4' | 'topic5' | 'topic6'
  /** where the chapter starts */
  entry: { layer: LayerId; tab?: string }
  blurb: string
}
export const CHAPTERS: ChapterDef[] = [
  { id: 'ch1', n: 1, title: 'CMOS inverter', topic: 'topic2', entry: { layer: 'cell' }, blurb: 'From the wafer to the 5.43 Å lattice, built from six masks and 45 steps.' },
  { id: 'ch2', n: 2, title: 'From sand to wafer', topic: 'topic3', entry: { layer: 'sand' }, blurb: 'Refining, Czochralski growth, crystal structure, bands, defects and the process flow.' },
  { id: 'ch3', n: 3, title: 'Keeping it clean', topic: 'topic4', entry: { layer: 'cleanroom' }, blurb: 'Clean factories, wafer cleaning, gettering and yield.' },
  { id: 'ch4', n: 4, title: 'Laying down films', topic: 'topic5', entry: { layer: 'deposition' }, blurb: 'CVD kinetics, plasma, evaporation and sputtering, and how films fill a trench.' },
  { id: 'ch5', n: 5, title: 'Atom by atom', topic: 'topic6', entry: { layer: 'mbe' }, blurb: 'Epitaxy: lattice matching, growth modes, Si epi, MBE with RHEED, and SOI.' },
]
export const CHAPTER_BY_ID = Object.fromEntries(CHAPTERS.map((c) => [c.id, c])) as Record<ChapterId, ChapterDef>

/** which chapter the current view belongs to (a tab can belong to another chapter than its layer) */
export function chapterOf(layer: LayerId, tab: string): ChapterId {
  const def = LAYER_BY_ID[layer]
  return def.tabs?.find((t) => t.id === tab)?.chapter ?? def.chapter
}
