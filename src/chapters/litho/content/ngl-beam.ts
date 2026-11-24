import { defineContent } from '../../content-schema'
import { T7 } from '../../../sources'

export default defineContent({
  id: "ngl-beam", title: "Exposure beams", short: "Photons, electrons, X-rays, ions",
  layer: "litho", parent: null, node: "ngl-beam", sources: [T7(17), T7(18)],
  tabs: ["ngl"],
  what: "Four ways to expose resist, side by side.",
  made: "Light from lamps and lasers; electron and ion beams from guns; X-rays through a 1:1 mask.",
  does: "Photons spread about ½ µm, electrons scatter and backscatter, X-rays and ions go nearly straight. EUV has source and mask problems; e-beam and ions are too slow; X-ray is off the roadmap.",
})
