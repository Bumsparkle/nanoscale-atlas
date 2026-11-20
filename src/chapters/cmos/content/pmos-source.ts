import { defineContent } from '../../content-schema'

export default defineContent({
  id: 'pmos-source',
  title: 'pMOS source (p+)',
  short: 'Heavily doped p+ in the n-well, wired to VDD',
  layer: 'cell',
  parent: 'cell',
  anchors: [{ key: 'si:p+', x: 38, y: 2 }],
  slides: [13, 25, 43],
  fabStep: 'p-implant',
  what: 'A p+ diffusion inside the n-well, on the VDD side of the pMOS gate (slides 13, 25).',
  made: 'Same steps as n+, with the p+ mask and an acceptor implant; the poly gate again blocks the implant, so it is self-aligned (slide 43).',
  does: 'Connected to VDD. When the gate is low, holes flow from here through the p-type channel to the drain, so the pMOS is ON (slide 13).',
  dive: { layer: 'transistor', device: 'pmos' },
})
