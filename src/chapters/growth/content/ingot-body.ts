import { defineContent } from '../../content-schema'
import { T3 } from '../../../sources'

export default defineContent({
  id: "ingot-body", title: "As-grown ingot", short: "Crown, cylindrical body and tail of a CZ crystal",
  layer: "ingot", parent: null, node: "ingot-body", sources: [T3(19), T3(23)],
  what: "The Czochralski crystal as it leaves the puller: seed and crown at one end, the body, and a conical tail.",
  made: "Grown at a controlled diameter after the shoulder; the tail is narrowed off before the crystal leaves the melt.",
  does: "Its doping rises from seed to tail (k0 < 1). The ends are cut off and the body is prepared for grinding (slide 23).",
  dive: { layer: "wafers" },
})
