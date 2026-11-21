import { defineContent } from '../../content-schema'
import { T2 } from '../../../sources'

export default defineContent({
  id: 'oxide-substrate', title: 'Single-crystal silicon', short: 'The ordered lattice of the body',
  layer: 'oxide', parent: 'substrate', node: 'oxide-substrate', sources: [T2(3), T2(4), T2(11)],
  what: 'The body under the gate: a totally ordered array of atoms with very few defects.',
  made: 'This is the original wafer crystal.',
  does: 'The channel forms in its top atomic layers.',
  dive: { layer: 'lattice' },
})
