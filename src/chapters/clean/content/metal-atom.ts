import { defineContent } from '../../content-schema'
import { T4 } from '../../../sources'

export default defineContent({
  id: "metal-atom", title: "Metal atom (Au)", short: "A deep-level impurity on its way to a trap",
  layer: "wafer", parent: null, node: "metal-atom", tabs: ["gettering"], sources: [T4(12), T4(13), T4(20)],
  what: "A gold atom, a deep-level impurity.",
  made: "Arrives from contamination during processing.",
  does: "Kicked out to an interstitial site (Au_s + I ⇌ Au_i), it diffuses rapidly and is trapped far from the devices.",
})
