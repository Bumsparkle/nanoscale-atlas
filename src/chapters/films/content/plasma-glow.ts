import { defineContent } from '../../content-schema'
import { T5 } from '../../../sources'

export default defineContent({
  id: "plasma-glow", title: "Plasma glow", short: "Electrons, ions, neutrals and radicals: a glow discharge",
  layer: "deposition", parent: null, node: "plasma-glow", tabs: ["plasma"], sources: [T5(29), T5(30), T5(31)],
  what: "The glowing gas between the electrodes.",
  made: "RF power at 13.56 MHz accelerates electrons to 1–10 eV; they ionise (≈10⁻⁴ of the gas), dissociate and excite the molecules.",
  does: "Radicals and ion bombardment let films deposit at 200–400 °C instead of 700–900 °C; in sputtering the Ar⁺ ions knock atoms off the target.",
})
