import { defineContent } from '../../content-schema'
import { T6 } from '../../../sources'

export default defineContent({
  id: "adatom", title: "Adatom", short: "An atom diffusing on the terrace",
  layer: "surface", parent: null, node: "adatom", tabs: ["modes"], sources: [T6(7), T6(8)],
  what: "A single atom that has landed on the surface but not yet joined the crystal.",
  made: "Deposited on a terrace.",
  does: "It diffuses until it attaches at a step, a kink or an island, or desorbs.",
})
