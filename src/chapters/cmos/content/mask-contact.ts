import { defineContent } from '../../content-schema'

export default defineContent({
  id: 'mask-contact', title: 'Contact mask', short: 'Six 2λ × 2λ cuts on the slide 27 line',
  layer: 'layout', parent: 'cell', node: 'mask-contact', slides: [27, 28, 44, 47],
  what: 'Six squares, all on the slide 27 dashed line: substrate tap, nMOS source and drain, pMOS drain and source, well tap (slides 27–28).',
  made: 'Etched through the thick field oxide (slide 44).',
  does: 'Rules: each contact is 2λ × 2λ, and both the metal above and the diffusion below surround it by 1λ (slide 47).',
  fabStep: 'contacts-expose',
})
