import { defineContent } from '../../content-schema'
import { T7 } from '../../../sources'

export default defineContent({
  id: "eb-resist", title: "PMMA resist", short: "Electron-sensitive polymer",
  layer: "ebeam", parent: null, node: "eb-resist", sources: [T7(20), T7(21), T7(22)],
  what: "Polymethyl methacrylate (495 or 950 molecular weight at the LCN).",
  made: "Spun onto the wafer.",
  does: "Exposed mostly by secondary electrons of 2–50 eV, whose range is only nanometres.",
})
