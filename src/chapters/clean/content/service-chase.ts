import { defineContent } from '../../content-schema'
import { T4 } from '../../../sources'

export default defineContent({
  id: "service-chase", title: "Service chase", short: "Return air path and the plant outside the clean area",
  layer: "cleanroom", parent: null, node: "service-chase", tabs: ["room"], sources: [T4(2), T4(6)],
  what: "The chase between bays where the air returns upwards and the services run.",
  made: "Outside the clean area.",
  does: "All mechanical support belongs in the plant room, not in the bay.",
})
