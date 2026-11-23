import { defineContent } from '../../content-schema'
import { T5 } from '../../../sources'

export default defineContent({
  id: "cvd-heater", title: "Furnace heater", short: "Resistance or RF heating sets the temperature",
  layer: "deposition", parent: null, node: "cvd-heater", tabs: ["cvd"], sources: [T5(12), T5(24)],
  what: "The heating around the tube: resistance heaters (LPCVD furnace, often three zones) or RF induction coils heating the susceptor (APCVD).",
  made: "A three-zone furnace keeps the whole load at one temperature.",
  does: "Temperature sets kS = k0·exp(−Ea/kT): in the reaction-limited regime it sets the deposition rate.",
})
