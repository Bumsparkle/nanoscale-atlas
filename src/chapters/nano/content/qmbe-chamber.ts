import { defineContent } from '../../content-schema'
import { T8 } from '../../../sources'

export default defineContent({
  id: "qmbe-chamber", title: "III–V MBE chamber", short: "Ultra-high vacuum, element by element",
  layer: "qmbe", parent: null, node: "qmbe-chamber", sources: [T8(9), T8(14), T8(22)],
  what: "An MBE growth chamber with Ga, Al, In, As, P and Sb cells.",
  made: "The same machine as Topic 6; here it grows III–V heterostructures.",
  does: "Opens the shutters of each layer’s elements in turn, building quantum wells and dots with atomically sharp interfaces.",
})
