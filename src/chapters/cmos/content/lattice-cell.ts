import { defineContent } from '../../content-schema'
import { T2 } from '../../../sources'

export default defineContent({
  id: 'lattice-cell', title: 'Silicon lattice', short: 'Group IV: four bonds to nearest neighbours',
  layer: 'lattice', parent: 'substrate', node: 'lattice-cell', sources: [T2(3), T2(4), T2(5)],
  what: 'Silicon is a group IV element with 4 electrons to share. It forms a crystal lattice with bonds to its four nearest neighbours.',
  made: 'Single crystal: totally ordered, good long-range order. Poly: grains randomly oriented, traps at grain boundaries. Amorphous: no long-range order, many dangling bonds. Switch between them with the structure control.',
  does: 'Pure silicon has no free carriers and conducts poorly; dopants change that.',
  beyond: [{ text: 'The diamond-cubic cell has a = 5.43 Å, and the bond length is a√3/4 ≈ 2.35 Å.', source: 'Kittel, Introduction to Solid State Physics, 8th ed., ch. 1' }],
})
