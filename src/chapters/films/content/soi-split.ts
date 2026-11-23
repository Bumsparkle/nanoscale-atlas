import { defineContent } from '../../content-schema'
import { T6 } from '../../../sources'

export default defineContent({
  id: "soi-split", title: "Hydrogen cleave plane", short: "Implanted H that splits the wafer",
  layer: "wafer", parent: null, node: "soi-split", tabs: ["soi"], sources: [T6(29)],
  what: "A layer of implanted hydrogen a set depth below the surface.",
  made: "Implanted through the oxide.",
  does: "On heating its strain splits the bonded pair along this plane: the \"smart cut\".",
})
