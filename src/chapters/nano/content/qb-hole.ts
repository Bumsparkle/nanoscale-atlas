import { defineContent } from '../../content-schema'
import { T8 } from '../../../sources'

export default defineContent({
  id: "qb-hole", title: "Hole", short: "Floats to the highest Ev",
  layer: "qbands", parent: null, node: "qb-hole", sources: [T8(11)],
  tabs: ["align"],
  what: "A hole in the valence band.",
  made: "Not made: a picture of scale.",
  does: "Ends up where the valence band is highest: the same layer (type I) or the other one (type II).",
})
