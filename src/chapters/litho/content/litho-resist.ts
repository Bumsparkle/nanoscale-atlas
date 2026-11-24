import { defineContent } from '../../content-schema'
import { T7 } from '../../../sources'

export default defineContent({
  id: "litho-resist", title: "Photoresist", short: "The light-sensitive film",
  layer: "litho", parent: null, node: "litho-resist", sources: [T7(15), T7(16), T7(10)],
  what: "A hydrocarbon-based organic polymer whose solubility changes under light, about 0.5–1 µm thick.",
  made: "Spun on at 3000–6000 rpm and pre-baked at 90–100 °C.",
  does: "Responds to the light intensity: it clears where the aerial image passes its threshold, so it needs MTF > ≈ 0.5 to recognise a feature.",
})
