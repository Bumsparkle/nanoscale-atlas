import { defineContent } from '../../content-schema'
import { T8 } from '../../../sources'

export default defineContent({
  id: "nf-droplet", title: "Catalyst droplet", short: "Au or Ga",
  layer: "nanofab", parent: null, node: "nf-droplet", sources: [T8(16)],
  tabs: ["vls"],
  what: "A liquid droplet on top of the wire: Au–Ga eutectic, or pure Ga when self-catalysed.",
  made: "Deposited first, then alloyed with Ga.",
  does: "Supersaturates with Ga and As and makes GaAs crystallise beneath it.",
})
