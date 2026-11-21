import { defineContent } from '../../content-schema'
import { T2 } from '../../../sources'

export default defineContent({
  id: 'mask-pplus', title: 'p+ diffusion mask', short: 'pMOS source/drain and the substrate tap',
  layer: 'layout', parent: 'cell', node: 'mask-pplus', sources: [T2(28), T2(43), T2(47)],
  what: 'Two rectangles: the pMOS active area inside the well and the substrate tap.',
  made: 'Same steps as n+, with an acceptor implant.',
  does: 'Rules: diffusion width ≥ 4λ and spacing ≥ 4λ; inside the n-well, 6λ from its edge.',
  fabStep: 'p+-expose',
})
