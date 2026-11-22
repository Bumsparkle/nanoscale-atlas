import { defineContent } from '../../content-schema'
import { T4 } from '../../../sources'

export default defineContent({
  id: "tank-sc2", title: "SC-2 tank", short: "HCl/H₂O₂/H₂O at 80–90 °C",
  layer: "cleanroom", parent: null, node: "tank-sc2", tabs: ["wetbench"], sources: [T4(10), T4(11)],
  what: "Standard clean 2: HCl/H₂O₂/H₂O, 1:1:6, 80–90 °C, 10 min.",
  made: "Hydrochloric acid with hydrogen peroxide.",
  does: "Removes alkali ions and the cations insoluble in SC-1, such as Al³⁺, Fe³⁺ and Mg²⁺.",
})
