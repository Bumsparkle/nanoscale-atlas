import { defineContent } from '../../content-schema'
import { T2 } from '../../../sources'

export default defineContent({
  id: 'mask-nplus', title: 'n+ diffusion mask', short: 'nMOS source/drain and the well tap',
  layer: 'layout', parent: 'cell', node: 'mask-nplus', sources: [T2(28), T2(39), T2(40), T2(47)],
  what: 'Two rectangles: the nMOS active area and the n-well tap.',
  made: 'Opens the oxide where n+ dopants go; the poly gate splits the nMOS opening into source and drain.',
  does: 'Rules: diffusion width ≥ 4λ and spacing ≥ 4λ. Its extent along the gate is the transistor width W.',
  fabStep: 'n+-expose',
})
