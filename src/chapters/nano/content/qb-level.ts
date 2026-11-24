import { defineContent } from '../../content-schema'
import { T8 } from '../../../sources'

export default defineContent({
  id: "qb-level", title: "Confined levels", short: "Subbands in the well",
  layer: "qbands", parent: null, node: "qb-level", sources: [T8(9), T8(10)],
  tabs: ["bands"],
  what: "The electron and hole levels bound in the wells, with |ψ|².",
  made: "Solved numerically on the actual band profile.",
  does: "Their spacing sets the emission energy: above the band gap of the well material.",
})
