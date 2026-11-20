import { defineContent } from '../../content-schema'

export default defineContent({
  id: 'well-tap',
  title: 'Well tap (n+)',
  short: 'n+ contact that ties the n-well to VDD',
  layer: 'cell',
  parent: 'cell',
  anchors: [{ key: 'si:n+', x: 42, y: 2 }],
  slides: [26, 27, 39, 41],
  fabStep: 'n-implant',
  what: 'A small n+ region inside the n-well under the VDD metal (slides 26–27).',
  made: 'Formed by the same n+ implant as the nMOS source and drain; slide 39 calls it the n-well contact.',
  does: 'Ties the n-well (pMOS body) to VDD (slide 26). Heavily doped so the metal makes a good contact, not a Schottky diode (slide 26).',
})
