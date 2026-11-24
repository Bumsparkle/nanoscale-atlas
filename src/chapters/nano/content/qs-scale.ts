import { defineContent } from '../../content-schema'
import { T8 } from '../../../sources'

export default defineContent({
  id: "qs-scale", title: "Size scale", short: "From a tennis ball to a water molecule",
  layer: "qsample", parent: null, node: "qs-scale", sources: [T8(2), T8(3)],
  tabs: ["scale"],
  what: "Objects on one log axis: water 0.1 nm, glucose 1 nm, antibody 10 nm, virus 100 nm, bacteria 1 µm, a cell 10 µm, a full stop 1 mm, a tennis ball 10⁸ nm.",
  made: "Not made: a picture of scale.",
  does: "Places the nanoscale among everyday and molecular sizes.",
})
