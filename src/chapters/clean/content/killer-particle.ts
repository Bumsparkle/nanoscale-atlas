import { defineContent } from '../../content-schema'
import { T4 } from '../../../sources'

export default defineContent({
  id: "killer-particle", title: "Killer particle", short: "A particle of about the feature size",
  layer: "wafer", parent: null, node: "killer-particle", tabs: ["yield"], sources: [T4(15)],
  what: "A particle large enough to break a circuit.",
  made: "From people, tools and chemicals.",
  does: "Particles of feature size cause about 75 % of yield loss; 0.1–0.3 µm ones are the most troublesome.",
})
