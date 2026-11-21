import { defineContent } from '../../content-schema'
import { T3 } from '../../../sources'

export default defineContent({
  id: "interstitial", title: "Interstitial (I)", short: "An extra atom squeezed between lattice sites",
  layer: "lattice", parent: null, node: "interstitial", tabs: ["defects"], sources: [T3(21), T3(22)],
  what: "A silicon atom (or an impurity) sitting between the regular lattice sites.",
  made: "Forms thermally, or is created by processing such as implantation and oxidation.",
  does: "Equilibrium concentration CI0* ≈ 1 × 10²⁷ exp(−3.8 eV/kT) cm⁻³: about zero at room temperature, ~10¹² cm⁻³ at 1000 °C.",
})
