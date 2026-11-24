import { defineContent } from '../../content-schema'
import { T8 } from '../../../sources'

export default defineContent({
  id: "hs-well", title: "Quantum well", short: "Narrow band gap, a few nm",
  layer: "hetero", parent: null, node: "hs-well", sources: [T8(9), T8(11), T8(14)],
  what: "A narrow-gap layer a few nm thick (or the dot layer of the laser).",
  made: "Grown by MBE, a few monolayers at a time.",
  does: "Confines electrons and holes to a plane once its thickness is near their de Broglie wavelength: discrete subbands.",
})
