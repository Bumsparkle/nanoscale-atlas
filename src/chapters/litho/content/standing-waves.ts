import { defineContent } from '../../content-schema'
import { T7 } from '../../../sources'

export default defineContent({
  id: "standing-waves", title: "Standing waves", short: "Light bouncing in the resist",
  layer: "litho", parent: null, node: "standing-waves", sources: [T7(16)],
  tabs: ["resist"],
  what: "Stripes of high and low exposure through the resist thickness.",
  made: "Light reflected from the wafer interferes with the incoming light.",
  does: "They ripple the resist walls; a post-exposure bake (typically 10 min at 100 °C) smooths them out.",
  beyond: [{ text: "The stripe period is λ/2n, n the resist’s refractive index.", source: "Plummer, Deal & Griffin, Silicon VLSI Technology, ch. 5" }],
})
