import { defineContent } from '../../content-schema'
import { T7 } from '../../../sources'

export default defineContent({
  id: "litho-lens", title: "Projection lens", short: "Images the mask onto the wafer",
  layer: "litho", parent: null, node: "litho-lens", sources: [T7(8), T7(9)],
  tabs: ["tool"],
  what: "The reduction lens of a projection stepper, numerical aperture NA = n sin α.",
  made: "A stack of precision lens elements; at deep UV they must stay transparent.",
  does: "Its NA sets the resolution R = k₁λ/NA and the depth of focus ±k₂λ/NA²: a bigger NA resolves finer lines but leaves less depth of focus.",
})
