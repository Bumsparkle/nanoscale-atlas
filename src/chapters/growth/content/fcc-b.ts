import { defineContent } from '../../content-schema'
import { T3 } from '../../../sources'

export default defineContent({
  id: "fcc-b", title: "FCC cell B (offset by a/4)", short: "The second FCC cell, shifted a/4 along x, y and z",
  layer: "lattice", parent: null, node: "fcc-b", tabs: ["cells"], sources: [T3(5)],
  what: "The second FCC arrangement, displaced by (a/4, a/4, a/4).",
  made: "Every atom of cell A has a partner a/4 along each axis.",
  does: "Each B atom sits at the centre of a tetrahedron of four A atoms: the four bonds of the diamond structure. The bond length is √3·a/4 ≈ 0.235 nm.",
  beyond: [
    { text: "a = 0.543 nm for silicon.", source: "Kittel, Introduction to Solid State Physics, ch. 1" },
  ],
})
