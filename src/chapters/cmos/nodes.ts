/**
 * Named, inspectable objects in the hand-built layers (everything except the
 * generated cell). Scenes tag their objects with these ids; content files
 * reference them with `node`. content.test.ts checks both directions.
 */
export const LAYER_NODES = {
  wafer: ['wafer', 'die-site', 'wafer-notch'],
  die: ['die', 'bond-pads', 'cell-rows', 'inverter-instance'],
  transistor: ['channel'],
  oxide: ['oxide-film', 'oxide-substrate', 'oxide-poly'],
  lattice: ['lattice-cell', 'lattice-dopant'],
} as const
