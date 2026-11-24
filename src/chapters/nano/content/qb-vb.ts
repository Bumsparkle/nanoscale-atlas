import { defineContent } from '../../content-schema'
import { T8 } from '../../../sources'

export default defineContent({
  id: "qb-vb", title: "Valence band edge", short: "Ev across the layers",
  layer: "qbands", parent: null, node: "qb-vb", sources: [T8(9), T8(11)],
  what: "The valence-band edge of each layer.",
  made: "From the band offsets.",
  does: "Holes settle where it is highest.",
})
