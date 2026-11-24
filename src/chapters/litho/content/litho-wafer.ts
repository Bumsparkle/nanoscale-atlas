import { defineContent } from '../../content-schema'
import { T7 } from '../../../sources'

export default defineContent({
  id: "litho-wafer", title: "Wafer", short: "On the stage, in the focal plane",
  layer: "litho", parent: null, node: "litho-wafer", sources: [T7(9), T7(16)],
  tabs: ["tool", "resist"],
  what: "The silicon wafer, coated with resist, on the stepper’s stage.",
  made: "Cleaned and dehydration-baked, primed with HMDS, then coated.",
  does: "Must sit within the depth of focus: high-NA lenses need a flat topology.",
})
