import { defineContent } from '../../content-schema'

export default defineContent({
  id: 'nmos-drain',
  title: 'nMOS drain (n+)',
  short: 'n+ silicon on the output side, wired to Y',
  layer: 'cell',
  parent: 'cell',
  anchors: [{ key: 'si:n+', x: 14, y: 2 }],
  slides: [11, 25, 41],
  fabStep: 'n-implant',
  what: 'The n+ diffusion on the output side of the nMOS gate (slide 25).',
  made: 'The same self-aligned n+ implant as the source: the poly gate splits one n+ opening into source and drain (slides 40–41).',
  does: 'Connected to the output Y by metal. With A = 1 the nMOS is ON and pulls Y to GND, so Y = 0 (slide 16).',
  dive: { layer: 'transistor', device: 'nmos' },
})
