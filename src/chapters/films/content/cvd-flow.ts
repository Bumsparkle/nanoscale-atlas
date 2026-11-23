import { defineContent } from '../../content-schema'
import { T5 } from '../../../sources'

export default defineContent({
  id: "cvd-flow", title: "Gas flow and boundary layer", short: "Reactants convect in, diffuse across a boundary layer, react",
  layer: "deposition", parent: null, node: "cvd-flow", tabs: ["cvd"], sources: [T5(14), T5(16), T5(17)],
  what: "The carrier gas with its reactants, flowing over the wafers; next to the surface a slow boundary layer of thickness δS.",
  made: "Mass-flow controllers meter the gases.",
  does: "Reactants must diffuse across δS (flux hG(CG − CS)) before the surface reaction (kS·CS) can use them: the slower step controls the rate.",
})
