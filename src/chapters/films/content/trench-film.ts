import { defineContent } from '../../content-schema'
import { T5 } from '../../../sources'

export default defineContent({
  id: "trench-film", title: "Film in a trench", short: "How well a film covers a step depends on the method",
  layer: "deposition", parent: null, node: "trench-film", tabs: ["coverage"], sources: [T5(2), T5(42), T5(49)],
  what: "A cross-section of a deposited film over a trench of adjustable aspect ratio.",
  made: "Coated by CVD, sputtering or evaporation.",
  does: "CVD (low sticking coefficient) coats every surface; sputtering overhangs the top corners and can seal a void; evaporation from a point source leaves the sidewalls bare.",
})
