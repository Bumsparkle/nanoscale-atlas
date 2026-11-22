import { defineContent } from '../../content-schema'
import { T4 } from '../../../sources'

export default defineContent({
  id: "raised-floor", title: "Perforated raised floor", short: "The air leaves the bay through the floor",
  layer: "cleanroom", parent: null, node: "raised-floor", tabs: ["room"], sources: [T4(2)],
  what: "A perforated floor over a return plenum.",
  made: "Grated panels on pedestals.",
  does: "Lets the downward air flow leave the bay, carrying particles away from the wafers.",
})
