import { defineContent } from '../../content-schema'
import { T8 } from '../../../sources'

export default defineContent({
  id: "nf-wetting", title: "Wetting layer", short: "The first InAs monolayers",
  layer: "nanofab", parent: null, node: "nf-wetting", sources: [T8(21), T8(22)],
  tabs: ["sk"],
  what: "A strained 2D InAs layer on GaAs.",
  made: "MBE (or MOCVD).",
  does: "Stores strain until the islands form.",
})
