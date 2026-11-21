import { defineContent } from '../../content-schema'
import { T3 } from '../../../sources'

export default defineContent({
  id: "cz-melt", title: "Silicon melt", short: "Molten polysilicon close to 1415 °C",
  layer: "puller", parent: null, node: "cz-melt", tabs: ["cz"], sources: [T3(16), T3(17), T3(18)],
  what: "Molten polysilicon with the dopant dissolved in it.",
  made: "The charge is melted by the heater and held close to 1415 °C, the melting point of silicon.",
  does: "Because most k0 < 1, dopant is rejected at the growing crystal and accumulates here: the melt concentration CL = S/(M0 − M) rises as the crystal grows.",
})
