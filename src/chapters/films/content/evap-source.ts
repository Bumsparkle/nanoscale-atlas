import { defineContent } from '../../content-schema'
import { T5 } from '../../../sources'

export default defineContent({
  id: "evap-source", title: "Evaporation source", short: "A hot W boat or an electron-beam hearth",
  layer: "deposition", parent: null, node: "evap-source", tabs: ["pvd"], sources: [T5(38), T5(39), T5(41)],
  what: "The metal charge in a tungsten boat, crucible or spiral, or in the water-cooled hearth of an electron-beam gun.",
  made: "A current heats the boat; for high-melting metals a magnet bends an electron beam onto the charge.",
  does: "Essentially a point source. Vapour pressure rises steeply with temperature: Al evaporates near 1000 °C, W needs nearly 3000 °C.",
})
