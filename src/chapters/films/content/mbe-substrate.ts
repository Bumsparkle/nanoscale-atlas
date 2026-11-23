import { defineContent } from '../../content-schema'
import { T6 } from '../../../sources'

export default defineContent({
  id: "mbe-substrate", title: "Heated substrate", short: "The wafer on its rotating heater",
  layer: "mbe", parent: null, node: "mbe-substrate", sources: [T6(19), T6(21)],
  what: "The wafer on a heated, rotating sample block (CAR assembly).",
  made: "Heated so arriving atoms can move about and find their sites.",
  does: "Atoms diffuse on its surface until they bond at a step or kink: growth is kinetically controlled.",
})
