import { defineContent } from '../../content-schema'
import { T4 } from '../../../sources'

export default defineContent({
  id: "tank-piranha", title: "Piranha tank", short: "H₂SO₄/H₂O₂ at 120–150 °C",
  layer: "cleanroom", parent: null, node: "tank-piranha", tabs: ["wetbench"], sources: [T4(11)],
  what: "H₂SO₄/H₂O₂, 1:1 to 4:1, at 120–150 °C for 10 min.",
  made: "Mixed fresh; the reaction is strongly exothermic.",
  does: "Strips organics, especially photoresist.",
})
