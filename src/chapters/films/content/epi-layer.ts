import { defineContent } from '../../content-schema'
import { T6 } from '../../../sources'

export default defineContent({
  id: "epi-layer", title: "Epi layer on substrate", short: "A lightly doped layer that continues the crystal",
  layer: "deposition", parent: null, node: "epi-layer", tabs: ["siepi"], sources: [T6(3), T6(12), T6(13)],
  what: "A cross-section: a p⁻ or n⁻ epitaxial layer on a heavily doped substrate.",
  made: "Grown by CVD; its doping is set by PH₃, AsH₃ or B₂H₆ in the gas.",
  does: "Gives a resistive surface layer over a conductive bulk, which diffusion cannot make. Autodoping smears the step: out-diffusion from the substrate and dopant returning from the gas.",
})
