import { defineContent } from '../../content-schema'
import { T8 } from '../../../sources'

export default defineContent({
  id: "nf-pillar", title: "Etched pillars", short: "Dots by lithography",
  layer: "nanofab", parent: null, node: "nf-pillar", sources: [T8(17), T8(18)],
  tabs: ["pillars"],
  what: "Pillars cut through a GaAs/AlGaAs/InGaAs/AlGaAs/GaAs well.",
  made: "Electron-beam lithography and etching.",
  does: "Confine in all three directions, but slowly made, sparse, contaminated and damaged at the walls.",
})
