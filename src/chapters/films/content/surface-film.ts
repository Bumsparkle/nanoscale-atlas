import { defineContent } from '../../content-schema'
import { T6 } from '../../../sources'

export default defineContent({
  id: "surface-film", title: "Growing film", short: "Layer by layer, islands, or both",
  layer: "surface", parent: null, node: "surface-film", sources: [T6(9), T6(5)],
  what: "The atoms deposited on the substrate.",
  made: "Arriving from the beam or the gas.",
  does: "Frank–van der Merwe: layer by layer. Volmer–Weber: islands. Stranski–Krastanov: a wetting layer, then islands. A mismatched film is strained (pseudomorphic) until it relaxes.",
})
