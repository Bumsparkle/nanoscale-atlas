import { defineContent } from '../../content-schema'
import { T8 } from '../../../sources'

export default defineContent({
  id: "qb-cb", title: "Conduction band edge", short: "Ec across the layers",
  layer: "qbands", parent: null, node: "qb-cb", sources: [T8(9), T8(11)],
  what: "The conduction-band edge of each layer on one energy scale.",
  made: "From the band gaps and band offsets of the materials.",
  does: "Electrons settle where it is lowest: the wells.",
})
