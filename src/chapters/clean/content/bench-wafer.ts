import { defineContent } from '../../content-schema'
import { T4 } from '../../../sources'

export default defineContent({
  id: "bench-wafer", title: "Wafer surface", short: "Particles, organic film, metals and alkali ions on the wafer",
  layer: "cleanroom", parent: null, node: "bench-wafer", tabs: ["wetbench"], sources: [T4(9), T4(18)],
  what: "A close-up of the wafer surface with its contaminants: particles, organic film (photoresist), heavy metals and alkali ions.",
  made: "Every step of processing and handling adds some.",
  does: "Each RCA step removes some of them; watch them disappear as you step the wafer through the bench.",
})
