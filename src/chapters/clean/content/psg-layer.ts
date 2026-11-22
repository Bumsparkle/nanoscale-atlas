import { defineContent } from '../../content-schema'
import { T4 } from '../../../sources'

export default defineContent({
  id: "psg-layer", title: "PSG layer", short: "Phosphosilicate glass getters alkali ions",
  layer: "wafer", parent: null, node: "psg-layer", tabs: ["gettering"], sources: [T4(12), T4(13)],
  what: "Phosphosilicate glass on top of the wafer.",
  made: "Deposited as a top-side dielectric (or Si₃N₄ as a barrier).",
  does: "Getters the alkali ions Na⁺ and K⁺, and metals. Downsides: its dipoles affect fields, and it absorbs water, which corrodes Al.",
})
