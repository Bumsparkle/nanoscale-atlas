import { defineContent } from '../../content-schema'

export default defineContent({
  id: 'pmos-drain',
  title: 'pMOS drain (p+)',
  short: 'p+ in the n-well on the output side, wired to Y',
  layer: 'cell',
  parent: 'cell',
  anchors: [{ key: 'si:p+', x: 30, y: 2 }],
  slides: [13, 25, 43],
  fabStep: 'p-implant',
  what: 'The p+ diffusion on the output side of the pMOS gate (slide 25).',
  made: 'The self-aligned p+ implant through the oxide window opened with the p+ mask (slide 43).',
  does: 'Connected to Y. With A = 0 the pMOS is ON and pulls Y up to VDD, so Y = 1 (slide 17).',
  dive: { layer: 'transistor', device: 'pmos' },
})
