import { defineContent } from '../../content-schema'
import { T3 } from '../../../sources'

export default defineContent({
  id: "fz-rod", title: "Polycrystalline rod", short: "The feed rod of the float-zone process",
  layer: "puller", parent: null, node: "fz-rod", tabs: ["fz"], sources: [T3(20)],
  what: "A rod of polycrystalline silicon held in chucks at the top.",
  made: "A Siemens polysilicon rod, machined round.",
  does: "Is melted section by section by the travelling coil and refrozen as a single crystal below.",
})
