import { defineContent } from '../../content-schema'
import { T3 } from '../../../sources'

export default defineContent({
  id: "mg-silicon", title: "Metallurgical-grade silicon", short: "~98 % pure Si from the arc furnace",
  layer: "sand", parent: null, node: "mg-silicon", sources: [T3(15)],
  what: "Lumps of metallurgical-grade silicon (MGS): silicon still carrying iron, aluminium and other impurities.",
  made: "Silica is heated with carbon in an arc furnace: overall SiO₂ + 2C → Si + 2CO. The slide writes the product as CO₂; at these temperatures the carbon leaves as CO.",
  does: "Step 2 purifies it: Si + 3HCl → SiHCl₃ + H₂ + heat turns it into trichlorosilane, a liquid that can be distilled.",
  beyond: [
    { text: "About 98 % pure, made at around 2000 °C.", source: "Plummer, Deal & Griffin, Silicon VLSI Technology, ch. 3" },
  ],
  dive: { layer: "polysilicon" },
})
