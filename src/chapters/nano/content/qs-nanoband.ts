import { defineContent } from '../../content-schema'
import { T8 } from '../../../sources'

export default defineContent({
  id: "qs-nanoband", title: "The nanoscale", short: "1 to 100 nm",
  layer: "qsample", parent: null, node: "qs-nanoband", sources: [T8(2), T8(3)],
  tabs: ["scale"],
  what: "The range of nanotechnology.",
  made: "Not made: a picture of scale.",
  does: "Where properties depend on size: around 10 nm, the electrons’ de Broglie wavelength at 300 K, a semiconductor becomes a quantum dot.",
})
