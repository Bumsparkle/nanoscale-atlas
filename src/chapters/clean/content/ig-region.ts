import { defineContent } from '../../content-schema'
import { T4 } from '../../../sources'

export default defineContent({
  id: "ig-region", title: "Intrinsic gettering region", short: "500+ µm of bulk with SiO₂ precipitates",
  layer: "wafer", parent: null, node: "ig-region", tabs: ["gettering"], sources: [T4(12), T4(13), T4(14)],
  what: "The wafer bulk, full of SiO₂ precipitates.",
  made: "CZ silicon, temperature-cycled at the start of the process: outdiffusion, nucleation, precipitation.",
  does: "Intrinsic gettering: metal atoms segregate to the dislocations around the precipitates.",
})
