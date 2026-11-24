import { defineContent } from '../../content-schema'
import { T8 } from '../../../sources'

export default defineContent({
  id: "nf-island", title: "InAs islands", short: "Self-assembled dots",
  layer: "nanofab", parent: null, node: "nf-island", sources: [T8(21), T8(22)],
  tabs: ["sk"],
  what: "3D InAs islands on the wetting layer.",
  made: "Stranski–Krastanov growth: the mismatch strain makes islands.",
  does: "Typically 2–10 nm high and 20–40 nm wide; sizes and shapes fluctuate and ordering is hard.",
  beyond: [{ text: "The switch to islands happens at about 1.7 monolayers of InAs on GaAs.", source: "Leonard, Pond & Petroff, Phys. Rev. B 50, 11687 (1994)" }],
})
