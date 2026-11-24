import { defineContent } from '../../content-schema'
import { T8 } from '../../../sources'

export default defineContent({
  id: "qs-sample", title: "Sample", short: "A piece of the grown wafer",
  layer: "qsample", parent: null, node: "qs-sample", sources: [T8(2), T8(9)],
  tabs: ["sample"],
  what: "A 10 mm piece of the GaAs wafer after growth.",
  made: "Grown in the III–V MBE chamber.",
  does: "Looks like plain GaAs: its layers are nanometres thick on half a millimetre of substrate.",
  dive: { layer: "hetero" },
})
