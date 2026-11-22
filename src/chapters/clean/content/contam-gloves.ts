import { defineContent } from '../../content-schema'
import { T4 } from '../../../sources'

export default defineContent({
  id: "contam-gloves", title: "Gloves", short: "Latex under vinyl: gloves can contaminate too",
  layer: "cleanroom", parent: null, node: "contam-gloves", tabs: ["room"], sources: [T4(6), T4(8)],
  what: "Cleanroom gloves.",
  made: "Latex gloves go on before the suit; vinyl gloves over them.",
  does: "Gloves can be a contamination source themselves: never touch your face, and change torn gloves.",
})
