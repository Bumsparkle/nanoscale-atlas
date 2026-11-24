import { defineContent } from '../../content-schema'
import { T7 } from '../../../sources'

export default defineContent({
  id: "litho-mask", title: "Mask (reticle)", short: "Chrome pattern on glass",
  layer: "litho", parent: null, node: "litho-mask", sources: [T7(3), T7(5), T7(10)],
  tabs: ["tool", "mtf", "resist"],
  what: "A quartz plate with the pattern in opaque chrome. In a 4× or 5× reduction stepper it is drawn larger than the wafer image.",
  made: "Written by an electron beam from the CAD layout (mask fabrication).",
  does: "Contact printing presses it on the resist; proximity printing holds it 5–25 µm above; projection printing images it through a lens.",
})
