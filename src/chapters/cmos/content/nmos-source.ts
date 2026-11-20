import { defineContent } from '../../content-schema'

export default defineContent({
  id: 'nmos-source',
  title: 'nMOS source (n+)',
  short: 'Heavily doped n+ silicon, wired to GND',
  layer: 'cell',
  parent: 'cell',
  anchors: [{ key: 'si:n+', x: 6, y: 2 }],
  slides: [11, 25, 39, 40, 41],
  fabStep: 'n-implant',
  what: 'An n+ diffusion on the GND side of the nMOS gate (slides 11, 25).',
  made: 'Oxide over the wafer is opened with the n+ mask (slides 39–40). The donor implant then enters the silicon on both sides of the poly gate, which blocks it: a self-aligned process (slides 40–41). The region is still called "diffusion" even though it is implanted today (slide 41).',
  does: 'Connected to GND through a contact and the GND metal (slide 25). When the gate is high, electrons flow from here through the inverted channel to the drain (slide 12).',
  dive: { layer: 'transistor', device: 'nmos' },
})
