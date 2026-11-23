import { defineContent } from '../../content-schema'
import { T5 } from '../../../sources'

export default defineContent({
  id: "rf-electrode", title: "Electrodes and sheath", short: "Parallel plates; the dark sheath accelerates ions",
  layer: "deposition", parent: null, node: "rf-electrode", tabs: ["plasma"], sources: [T5(29), T5(31), T5(46)],
  what: "The powered and grounded electrodes; the dark space next to each is the sheath.",
  made: "RF is coupled through a matching network; the wafer electrode is heated.",
  does: "Ions accelerated across the sheath bombard the surface. RF sputtering is little used commercially: big RF supplies cost a lot and the self-bias heats insulators.",
})
