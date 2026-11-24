import { defineContent } from '../../content-schema'
import { T7 } from '../../../sources'

export default defineContent({
  id: "airy-image", title: "Airy pattern", short: "The image of a point",
  layer: "litho", parent: null, node: "airy-image", sources: [T7(6), T7(7), T7(8)],
  tabs: ["optics"],
  what: "The image plane under two point sources: each images to an Airy disk with rings.",
  made: "Diffraction at the lens aperture: the lens collects only part of the diffracted light.",
  does: "The first dark ring sits at Φ = 1.22λf/d. Rayleigh: two points are resolved when one’s peak sits on the other’s first minimum.",
  beyond: [{ text: "The pattern is [2J₁(v)/v]², with J₁ a Bessel function.", source: "Born & Wolf, Principles of Optics, §8.5" }],
})
