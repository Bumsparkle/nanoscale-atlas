import { defineContent } from '../../content-schema'
import { T5 } from '../../../sources'

export default defineContent({
  id: "sputter-target", title: "Sputter target", short: "The cathode the ions knock atoms out of",
  layer: "deposition", parent: null, node: "sputter-target", tabs: ["plasma"], sources: [T5(44), T5(45), T5(47)],
  what: "A plate of the material to be deposited, held at −(100–300) V for DC sputtering.",
  made: "The material must first be made into a target.",
  does: "Ar⁺ ions sputter atoms off it, which coat the wafers. DC works for metals (Al, W, Ti, silicides) but not insulators, which charge up. With N₂ added a Ti target gives TiN (reactive sputtering).",
})
