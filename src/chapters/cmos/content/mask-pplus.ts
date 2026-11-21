import { defineContent } from '../../content-schema'

export default defineContent({
  id: 'mask-pplus', title: 'p+ diffusion mask', short: 'pMOS source/drain and the substrate tap',
  layer: 'layout', parent: 'cell', node: 'mask-pplus', slides: [28, 43, 47],
  what: 'Two rectangles: the pMOS active area inside the well and the substrate tap (slides 28, 43).',
  made: 'Same steps as n+, with an acceptor implant (slide 43).',
  does: 'Rules: diffusion width ≥ 4λ and spacing ≥ 4λ; inside the n-well, 6λ from its edge (slide 47).',
  fabStep: 'p+-expose',
})
