import { defineContent } from '../../content-schema'

export default defineContent({
  id: 'oxide-substrate', title: 'Single-crystal silicon', short: 'The ordered lattice of the body',
  layer: 'oxide', parent: 'substrate', node: 'oxide-substrate', slides: [3, 4, 11],
  what: 'The body under the gate: a totally ordered array of atoms with very few defects (slide 3).',
  made: 'This is the original wafer crystal (slide 29).',
  does: 'The channel forms in its top atomic layers (slide 12).',
  dive: { layer: 'lattice' },
})
