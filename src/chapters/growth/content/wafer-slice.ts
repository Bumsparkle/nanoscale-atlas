import { defineContent } from '../../content-schema'
import { T3 } from '../../../sources'

export default defineContent({
  id: "wafer-slice", title: "Sliced wafer", short: "A raw wafer, ready to be lapped and polished",
  layer: "wafers", parent: null, node: "wafer-slice", sources: [T3(23), T3(24)],
  what: "One slice of the ingot.",
  made: "Cut by the saw, then lapped, etched and polished.",
  does: "Arrives at the fab \"epi-ready\": the first box of the slide 24 flow, silicon wafer manufacture.",
  beyond: [
    { text: "A 300 mm wafer is 775 µm thick.", source: "SEMI M1" },
  ],
  dive: { layer: "cleanroom" },
})
