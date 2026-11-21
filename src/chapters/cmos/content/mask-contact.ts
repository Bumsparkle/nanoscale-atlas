import { defineContent } from '../../content-schema'
import { T2 } from '../../../sources'

export default defineContent({
  id: 'mask-contact', title: 'Contact mask', short: 'Six 2λ × 2λ cuts on the slide 27 line',
  layer: 'layout', parent: 'cell', node: 'mask-contact', sources: [T2(27), T2(28), T2(44), T2(47)],
  what: 'Six squares, all on the slide 27 dashed line: substrate tap, nMOS source and drain, pMOS drain and source, well tap.',
  made: 'Etched through the thick field oxide.',
  does: 'Rules: each contact is 2λ × 2λ, and both the metal above and the diffusion below surround it by 1λ.',
  fabStep: 'contacts-expose',
})
