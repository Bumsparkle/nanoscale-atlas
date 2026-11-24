import { defineContent } from '../../content-schema'
import { T8 } from '../../../sources'

export default defineContent({
  id: "hs-cap", title: "Cap layer", short: "Protects the top",
  layer: "hetero", parent: null, node: "hs-cap", sources: [T8(9)],
  what: "A thin top layer, usually GaAs.",
  made: "The last layer grown.",
  does: "Keeps the barrier from oxidising and gives a surface for contacts.",
})
