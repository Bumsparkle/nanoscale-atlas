import { defineContent } from '../../content-schema'
import { T3 } from '../../../sources'

export default defineContent({
  id: "fz-crystal", title: "Float-zone crystal", short: "Single crystal grown up from a seed below",
  layer: "puller", parent: null, node: "fz-crystal", tabs: ["fz"], sources: [T3(20)],
  what: "The single-crystal silicon growing above the seed at the bottom of the rod.",
  made: "Freezes from the bottom of the molten zone as the coil travels upwards.",
  does: "Very pure, because no crucible contaminates it; used where low oxygen matters.",
  beyond: [
    { text: "FZ silicon has around 10¹⁶ cm⁻³ oxygen or less, against ~10¹⁸ in CZ.", source: "Plummer, Deal & Griffin, Silicon VLSI Technology, ch. 3" },
  ],
})
