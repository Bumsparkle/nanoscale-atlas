import { defineContent } from '../../content-schema'
import { T6 } from '../../../sources'

export default defineContent({
  id: "mbe-cell", title: "Effusion cells", short: "Heated crucibles that make atomic beams",
  layer: "mbe", parent: null, node: "mbe-cell", sources: [T6(17), T6(21), T6(23)],
  what: "Crucibles of ultra-pure Ga, As, Al and dopants, each aimed at the substrate.",
  made: "Their temperature sets the beam flux φ = 2.64 × 10²⁰ P/√(MT).",
  does: "The elements sublimate and condense on the hot substrate, where Ga and As react to grow single-crystal GaAs.",
})
