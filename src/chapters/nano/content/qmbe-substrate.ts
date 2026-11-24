import { defineContent } from '../../content-schema'
import { T8 } from '../../../sources'

export default defineContent({
  id: "qmbe-substrate", title: "GaAs substrate", short: "Heated and rotating",
  layer: "qmbe", parent: null, node: "qmbe-substrate", sources: [T8(14)],
  what: "A GaAs (or InP) wafer on the heated, rotating holder.",
  made: "Cut from a single-crystal ingot.",
  does: "The template the layers grow on epitaxially.",
})
