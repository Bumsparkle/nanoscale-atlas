import { defineContent } from '../../content-schema'
import { T3 } from '../../../sources'

export default defineContent({
  id: "id-saw", title: "Internal-diameter saw", short: "Thin blade with a diamond-coated inner edge",
  layer: "wafers", parent: null, node: "id-saw", sources: [T3(23)],
  what: "A thin annular blade that cuts with its diamond-coated inner rim.",
  made: "The blade is tensioned like a drum skin, so it stays flat while the ingot is pushed through the hole.",
  does: "Slices the ground ingot into wafers.",
  beyond: [
    { text: "Modern fabs mostly use multi-wire saws for 300 mm ingots.", source: "Plummer, Deal & Griffin, Silicon VLSI Technology, ch. 3" },
  ],
})
