import { defineContent } from '../../content-schema'
import { T7 } from '../../../sources'

export default defineContent({
  id: "litho-condenser", title: "Condenser lens", short: "Turns the source into even illumination",
  layer: "litho", parent: null, node: "litho-condenser", sources: [T7(10), T7(11)],
  tabs: ["tool"],
  what: "The lens between the source and the mask.",
  made: "Ground glass or fused silica, sized relative to the source.",
  does: "Illuminates the mask. The ratio of source to condenser size sets the spatial coherence S = s/d = NA_condenser/NA_projection, typically 0.5–0.7.",
})
