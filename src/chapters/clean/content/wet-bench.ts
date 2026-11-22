import { defineContent } from '../../content-schema'
import { T4 } from '../../../sources'

export default defineContent({
  id: "wet-bench", title: "RCA wet bench", short: "Tanks for the RCA clean, in order",
  layer: "cleanroom", parent: null, node: "wet-bench", tabs: ["wetbench"], sources: [T4(10), T4(11)],
  what: "A wet bench with a tank for each step of the RCA clean.",
  made: "Piranha → HF dip → DI rinse → SC-1 → DI rinse → SC-2 → DI rinse.",
  does: "Level 2: wafer cleaning. The standard process for removing organics, heavy metals and alkali ions; ultrasonic agitation dislodges particles.",
})
