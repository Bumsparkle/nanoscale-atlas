import { defineContent } from '../../content-schema'
import { T3 } from '../../../sources'

export default defineContent({
  id: "poly-charge", title: "Polysilicon charge", short: "Broken chunks loaded into the quartz crucible",
  layer: "polysilicon", parent: null, node: "poly-charge", sources: [T3(16)],
  what: "Chunks of the Siemens polysilicon in a quartz crucible, ready to be melted (slide 16 photo).",
  made: "The rods are crushed; a known amount of dopant is added to the charge to set the doping of the crystal (slide 17).",
  does: "Melted and held close to 1415 °C, it becomes the melt the single crystal is pulled from.",
  dive: { layer: "puller" },
})
