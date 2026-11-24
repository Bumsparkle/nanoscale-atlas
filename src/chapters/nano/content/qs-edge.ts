import { defineContent } from '../../content-schema'
import { T8 } from '../../../sources'

export default defineContent({
  id: "qs-edge", title: "Epitaxial layers", short: "At the cleaved edge",
  layer: "qsample", parent: null, node: "qs-edge", sources: [T8(9), T8(14)],
  tabs: ["sample"],
  what: "The heterostructure seen at the edge, drawn about ten thousand times taller.",
  made: "By MBE, layer by layer.",
  does: "Zoom in to see each layer to scale.",
  dive: { layer: "hetero" },
})
