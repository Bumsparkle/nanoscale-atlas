/**
 * Named, inspectable objects in the hand-built layers (everything except the
 * generated cell). Scenes tag their objects with these ids; content files
 * reference them with `node`. content.test.ts checks both directions.
 */
export const LAYER_NODES = {
  sand: ['quartz-sand', 'mg-silicon'],
  polysilicon: ['siemens-rod', 'poly-charge'],
  puller: ['cz-crucible', 'cz-melt', 'cz-seed', 'cz-ingot', 'cz-heater', 'cz-jacket', 'fz-rod', 'fz-coil', 'fz-zone', 'fz-crystal'],
  ingot: ['ingot-body', 'ingot-ground'],
  wafers: ['id-saw', 'wafer-slice', 'wafer-id', 'wafer-cassette'],
  cleanroom: ['hepa-filter', 'rah', 'raised-floor', 'service-chase', 'process-bay', 'operator', 'contam-book', 'contam-gloves',
    'wet-bench', 'tank-piranha', 'tank-hf', 'tank-sc1', 'tank-sc2', 'tank-rinse', 'bench-wafer'],
  deposition: ['cvd-tube', 'cvd-heater', 'cvd-wafers', 'cvd-flow', 'plasma-glow', 'rf-electrode', 'sputter-target', 'magnetron', 'bell-jar', 'evap-source', 'trench-film', 'barrel', 'epi-layer'],
  mbe: ['mbe-chamber', 'mbe-cell', 'mbe-shutter', 'rheed-gun', 'rheed-screen', 'mbe-substrate'],
  surface: ['surface-film', 'adatom', 'misfit'],
  wafer: ['wafer', 'die-site', 'wafer-notch', 'soi-si', 'soi-box', 'soi-split', 'soi-handle', 'psg-layer', 'device-layer', 'denuded-zone', 'ig-region', 'oxide-precipitate', 'backside-region', 'metal-atom', 'die-grid', 'killer-particle'],
  die: ['die', 'bond-pads', 'cell-rows', 'inverter-instance'],
  transistor: ['channel'],
  oxide: ['oxide-film', 'oxide-substrate', 'oxide-poly'],
  lattice: ['lattice-cell', 'lattice-dopant', 'fcc-a', 'fcc-b', 'miller-plane', 'vacancy', 'interstitial'],
  /** Layout view (SVG): one per mask, plus the slide 48 minimum transistor and the λ grid */
  layout: ['mask-nwell', 'mask-poly', 'mask-nplus', 'mask-pplus', 'mask-contact', 'mask-metal', 'min-transistor', 'lambda'],
} as const
