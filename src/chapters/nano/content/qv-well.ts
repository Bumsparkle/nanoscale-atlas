import { defineContent } from '../../content-schema'
import { T8 } from '../../../sources'

export default defineContent({
  id: "qv-well", title: "Potential well", short: "Infinite or finite walls",
  layer: "qwave", parent: null, node: "qv-well", sources: [T8(6), T8(10)],
  tabs: ["well"],
  what: "The square well: V = 0 inside, V = ∞ (or V₀) outside.",
  made: "The band offset of a heterostructure is a finite well.",
  does: "Confines the particle; its width sets the level spacing.",
})
