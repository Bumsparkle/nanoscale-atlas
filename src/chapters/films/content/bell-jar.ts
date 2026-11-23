import { defineContent } from '../../content-schema'
import { T5 } from '../../../sources'

export default defineContent({
  id: "bell-jar", title: "Evaporator bell jar", short: "The vacuum chamber of an evaporator",
  layer: "deposition", parent: null, node: "bell-jar", tabs: ["pvd"], sources: [T5(38), T5(40)],
  what: "A vacuum chamber (bell jar) with the wafers held on a dome above the source.",
  made: "Pumped below 10⁻⁵ Torr.",
  does: "At that pressure the mean free path is metres, longer than the chamber, so evaporated atoms fly in straight lines from the source.",
  beyond: [
    { text: "Planetary holders rotate the wafers to even out the thickness.", source: "Plummer, Deal & Griffin, Silicon VLSI Technology, ch. 9" },
  ],
})
