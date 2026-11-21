import { defineContent } from '../../content-schema'
import { T3 } from '../../../sources'

export default defineContent({
  id: "fcc-a", title: "FCC cell A", short: "Atoms at the corners and face centres of the cube",
  layer: "lattice", parent: null, node: "fcc-a", tabs: ["cells"], sources: [T3(4), T3(5)],
  what: "One face-centred cubic arrangement: an atom at each corner and at the centre of each face of the unit cell of side a.",
  made: "The unit cell repeats in x, y and z to fill space (slide 4).",
  does: "Silicon is two of these merged: this one and a copy offset by a/4 in x, y and z (slide 5).",
})
