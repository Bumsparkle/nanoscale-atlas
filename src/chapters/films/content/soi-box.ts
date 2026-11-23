import { defineContent } from '../../content-schema'
import { T6 } from '../../../sources'

export default defineContent({
  id: "soi-box", title: "Buried oxide", short: "The insulator under the device layer",
  layer: "wafer", parent: null, node: "soi-box", tabs: ["soi"], sources: [T6(28), T6(29), T6(30)],
  what: "A layer of SiO₂ (e.g. 400 nm) between the device layer and the handle wafer.",
  made: "Grown thermally before bonding, so the Si/SiO₂ interface is of high quality.",
  does: "Isolates every transistor from the substrate.",
})
