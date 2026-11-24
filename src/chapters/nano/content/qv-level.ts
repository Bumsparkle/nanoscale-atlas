import { defineContent } from '../../content-schema'
import { T8 } from '../../../sources'

export default defineContent({
  id: "qv-level", title: "Energy levels", short: "Only these energies",
  layer: "qwave", parent: null, node: "qv-level", sources: [T8(7), T8(8), T8(10), T8(12), T8(13)],
  tabs: ["well", "confine"],
  what: "The allowed energies Eₙ.",
  made: "Boundary conditions pick out discrete k.",
  does: "Eₙ = n²π²ħ²/(2mL²) for an infinite well; finite wells sit lower; wires and dots add terms for each confined direction.",
})
