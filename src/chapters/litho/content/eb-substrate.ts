import { defineContent } from '../../content-schema'
import { T7 } from '../../../sources'

export default defineContent({
  id: "eb-substrate", title: "Substrate", short: "Si with 58 nm SiO₂",
  layer: "ebeam", parent: null, node: "eb-substrate", sources: [T7(20)],
  tabs: ["liftoff"],
  what: "The lift-off sample: silicon with 58 nm of oxide.",
  made: "Cleaned before the PMMA goes on.",
  does: "Carries the Ti/Au pattern that remains after lift-off.",
})
