import { defineContent } from '../../content-schema'
import { T4 } from '../../../sources'

export default defineContent({
  id: "device-layer", title: "Devices near the surface", short: "The active region that must stay clean",
  layer: "wafer", parent: null, node: "device-layer", tabs: ["gettering"], sources: [T4(12), T4(13)],
  what: "The transistors, within the top few µm.",
  made: "Built by the Chapter 1 process.",
  does: "Gettering moves metal and alkali ions away from here.",
})
