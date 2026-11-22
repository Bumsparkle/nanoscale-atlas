import { defineContent } from '../../content-schema'
import { T4 } from '../../../sources'

export default defineContent({
  id: "die-grid", title: "Die on the wafer", short: "Good die and failed die",
  layer: "wafer", parent: null, node: "die-grid", tabs: ["yield"], sources: [T4(15), T4(16), T4(21)],
  what: "The die of one wafer, each of area Ac.",
  made: "Bad die are made alongside good die.",
  does: "A die fails when a killer particle lands on it. Yield: Poisson exp(−Ac·D0), or negative binomial 1/(1 + Ac·D0/C)^C when defects cluster.",
})
