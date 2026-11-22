import { defineContent } from '../../content-schema'
import { T4 } from '../../../sources'

export default defineContent({
  id: "tank-rinse", title: "DI water rinse", short: "Deionised water at room temperature",
  layer: "cleanroom", parent: null, node: "tank-rinse", tabs: ["wetbench"], sources: [T4(6), T4(11)],
  what: "Overflow rinse tanks of deionised water.",
  made: "Electronic-grade DI water.",
  does: "Rinses the chemicals off after the HF, SC-1 and SC-2 steps.",
})
