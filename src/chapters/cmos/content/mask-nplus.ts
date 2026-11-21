import { defineContent } from '../../content-schema'

export default defineContent({
  id: 'mask-nplus', title: 'n+ diffusion mask', short: 'nMOS source/drain and the well tap',
  layer: 'layout', parent: 'cell', node: 'mask-nplus', slides: [28, 39, 40, 47],
  what: 'Two rectangles: the nMOS active area and the n-well tap (slides 28, 39).',
  made: 'Opens the oxide where n+ dopants go; the poly gate splits the nMOS opening into source and drain (slide 40).',
  does: 'Rules: diffusion width ≥ 4λ and spacing ≥ 4λ (slide 47). Its extent along the gate is the transistor width W (slide 48).',
  fabStep: 'n+-expose',
})
