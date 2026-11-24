import { defineContent } from '../../content-schema'
import { T7 } from '../../../sources'

export default defineContent({
  id: "mtf-image", title: "Aerial image", short: "The light reaching the resist",
  layer: "litho", parent: null, node: "mtf-image", sources: [T7(10), T7(11), T7(12)],
  tabs: ["mtf"],
  what: "The intensity across equal lines and spaces after the projection lens.",
  made: "Computed by Abbe’s method: each source point passes the diffraction orders inside the pupil.",
  does: "Its contrast is the MTF = (Imax − Imin)/(Imax + Imin); smaller features and the overlap of neighbouring Airy discs lower it.",
  beyond: [{ text: "Abbe’s method for partially coherent imaging.", source: "Mack, Fundamental Principles of Optical Lithography, ch. 2" }],
})
