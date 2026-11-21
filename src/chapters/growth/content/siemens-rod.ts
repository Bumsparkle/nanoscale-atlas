import { defineContent } from '../../content-schema'
import { T3 } from '../../../sources'

export default defineContent({
  id: "siemens-rod", title: "Siemens polysilicon rod", short: "Ultra-pure polysilicon grown from trichlorosilane",
  layer: "polysilicon", parent: null, node: "siemens-rod", sources: [T3(15), T3(16)],
  what: "A U-shaped rod of polycrystalline silicon, the product of the Siemens process.",
  made: "Step 3: SiHCl₃ and hydrogen react on heated silicon filaments: 2SiHCl₃ + 2H₂ → 2Si + 6HCl. Silicon builds up on the rods, grain by grain.",
  does: "The rods are broken into chunks to charge the crystal puller. They contain < 1 ppb impurities, except oxygen (~10¹⁸ cm⁻³) and carbon (~10¹⁶ cm⁻³).",
  beyond: [
    { text: "The filaments are held at about 1100 °C; rods grow to 15–20 cm diameter.", source: "Plummer, Deal & Griffin, Silicon VLSI Technology, ch. 3" },
  ],
  dive: { layer: "puller" },
})
