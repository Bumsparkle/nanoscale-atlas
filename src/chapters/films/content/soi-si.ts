import { defineContent } from '../../content-schema'
import { T6 } from '../../../sources'

export default defineContent({
  id: "soi-si", title: "SOI device layer", short: "Thin silicon on top of the buried oxide",
  layer: "wafer", parent: null, node: "soi-si", tabs: ["soi"], sources: [T6(28), T6(30)],
  what: "The thin single-crystal Si layer (e.g. 205 nm) where the transistors are built.",
  made: "Transferred from a donor wafer by smart cut.",
  does: "Source and drain reach down to the oxide, so their junction capacitance is small: faster circuits.",
})
