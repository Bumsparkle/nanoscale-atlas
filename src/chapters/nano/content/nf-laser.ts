import { defineContent } from '../../content-schema'
import { T8 } from '../../../sources'

export default defineContent({
  id: "nf-laser", title: "QD laser", short: "Dots in the active region",
  layer: "nanofab", parent: null, node: "nf-laser", sources: [T8(32), T8(33)],
  tabs: ["laser"],
  what: "A ridge laser with InAs/InGaAs dots between GaAs and AlGaAs cladding on n⁺ GaAs.",
  made: "MBE growth, then ridge etching and contacts.",
  does: "Low threshold current density and stable operation: its threshold barely moves from −40 to +100 °C.",
})
