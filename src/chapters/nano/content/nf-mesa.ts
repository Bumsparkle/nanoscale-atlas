import { defineContent } from '../../content-schema'
import { T8 } from '../../../sources'

export default defineContent({
  id: "nf-mesa", title: "Etched ridge", short: "A wire by etching",
  layer: "nanofab", parent: null, node: "nf-mesa", sources: [T8(15)],
  tabs: ["wires"],
  what: "A narrow ridge etched through an A/B/A quantum well.",
  made: "Lithography, then etching.",
  does: "The well confines vertically; the ridge walls confine sideways: a quantum wire.",
})
