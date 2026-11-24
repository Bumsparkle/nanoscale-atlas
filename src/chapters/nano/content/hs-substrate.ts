import { defineContent } from '../../content-schema'
import { T8 } from '../../../sources'

export default defineContent({
  id: "hs-substrate", title: "Substrate", short: "The template crystal",
  layer: "hetero", parent: null, node: "hs-substrate", sources: [T8(9)],
  what: "GaAs (or InP) substrate.",
  made: "Single crystal.",
  does: "Sets the lattice constant the layers must fit.",
})
