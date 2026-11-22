import { defineContent } from '../../content-schema'
import { T4 } from '../../../sources'

export default defineContent({
  id: "process-bay", title: "Process bay", short: "Yellow-lit lithography bay with the wafer on the chuck",
  layer: "cleanroom", parent: null, node: "process-bay", tabs: ["room"], sources: [T4(2), T4(4), T4(7)],
  what: "The clean work area, lit yellow in the lithography areas.",
  made: "Class X: fewer than X particles larger than 0.5 µm in each cubic foot of air.",
  does: "Level 1 of contamination control: the clean factory. Click to zoom into the wafer on the chuck.",
  dive: { layer: "wafer" },
})
