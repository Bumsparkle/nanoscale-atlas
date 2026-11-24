import { defineContent } from '../../content-schema'
import { T8 } from '../../../sources'

export default defineContent({
  id: "qmbe-cells", title: "Effusion cells", short: "Ga, Al, In, As, P, Sb",
  layer: "qmbe", parent: null, node: "qmbe-cells", sources: [T8(22)],
  what: "Heated crucibles of the elements.",
  made: "Their temperatures set the fluxes; shutters start and stop each beam.",
  does: "Open together to grow alloys like AlGaAs or InGaAs.",
})
