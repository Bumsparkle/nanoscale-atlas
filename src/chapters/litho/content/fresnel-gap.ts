import { defineContent } from '../../content-schema'
import { T7 } from '../../../sources'

export default defineContent({
  id: "fresnel-gap", title: "Mask–resist gap", short: "Proximity printing’s near field",
  layer: "litho", parent: null, node: "fresnel-gap", sources: [T7(13), T7(14)],
  tabs: ["fresnel"],
  what: "The gap g between a proximity mask and the resist.",
  made: "Set by the aligner, about 5–25 µm.",
  does: "Fresnel diffraction applies for λ < g < W²/λ; the edges ring and the image spreads, so the smallest printable opening is W_min ≈ √(λg).",
  beyond: [{ text: "The image is computed with the Fresnel integrals.", source: "Born & Wolf, Principles of Optics, §8.7" }],
})
