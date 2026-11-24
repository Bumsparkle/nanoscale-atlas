import { defineContent } from '../../content-schema'
import { T7 } from '../../../sources'

export default defineContent({
  id: "litho-source", title: "Light source", short: "Hg lamp or excimer laser",
  layer: "litho", parent: null, node: "litho-source", sources: [T7(4), T7(3)],
  tabs: ["tool"],
  what: "The light source: a mercury lamp (g-line 436 nm, i-line 365 nm) or an excimer laser (KrF 248 nm, ArF 193 nm, F₂ 157 nm).",
  made: "In a lamp, electrons in a high-intensity plasma are excited by collisions and emit photons as they relax; in an excimer laser, energy drives Kr + NF₃ to excited KrF, which emits.",
  does: "Sets λ. Smaller features need shorter wavelengths, which need new resists and optics transparent in the deep UV.",
})
