import { defineContent } from '../../content-schema'
import { T8 } from '../../../sources'

export default defineContent({
  id: "qb-electron", title: "Electron", short: "Falls to the lowest Ec",
  layer: "qbands", parent: null, node: "qb-electron", sources: [T8(11)],
  tabs: ["align"],
  what: "A conduction electron.",
  made: "Not made: a picture of scale.",
  does: "Ends up in whichever layer has the lowest conduction band.",
})
