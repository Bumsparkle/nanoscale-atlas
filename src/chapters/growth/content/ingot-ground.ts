import { defineContent } from '../../content-schema'
import { T3 } from '../../../sources'

export default defineContent({
  id: "ingot-ground", title: "Ground ingot with flat", short: "Ground to diameter, with an orientation flat",
  layer: "ingot", parent: null, node: "ingot-ground", sources: [T3(23)],
  what: "The body ground to a precise diameter, with a flat ground along it.",
  made: "Diameter grind, then flat grind (slide 23).",
  does: "The flat (or, on large wafers, a notch) marks the crystal orientation on every wafer cut from it.",
  dive: { layer: "wafers" },
})
