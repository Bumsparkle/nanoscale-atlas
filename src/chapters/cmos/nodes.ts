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
  /** Layout view (SVG): one per mask, plus the slide 48 minimum transistor and the λ grid */
  layout: ['mask-nwell', 'mask-poly', 'mask-nplus', 'mask-pplus', 'mask-contact', 'mask-metal', 'min-transistor', 'lambda'],
} as const
