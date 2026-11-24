import { defineContent } from '../../content-schema'
import { T8 } from '../../../sources'

export default defineContent({
  id: "nf-pyramid", title: "Patterned recesses", short: "Dots where the mask says",
  layer: "nanofab", parent: null, node: "nf-pyramid", sources: [T8(20)],
  tabs: ["patterned"],
  what: "An SiO₂ mask with triangular openings on (111)B GaAs, pyramids grown in them.",
  made: "Selective etching, then selective-area MOCVD.",
  does: "A dot forms at each pyramid tip; the density is limited by the mask.",
})
