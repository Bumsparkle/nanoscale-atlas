import { defineContent } from '../../content-schema'
import { T7 } from '../../../sources'

export default defineContent({
  id: "liftoff-metal", title: "Ti/Au film", short: "3 nm Ti, 17 nm Au",
  layer: "ebeam", parent: null, node: "liftoff-metal", sources: [T7(20)],
  tabs: ["liftoff"],
  what: "A thin titanium adhesion layer under gold.",
  made: "Evaporated over the developed PMMA.",
  does: "Lands in the openings and on the resist; dissolving the PMMA lifts off the metal on top, leaving the pattern.",
})
