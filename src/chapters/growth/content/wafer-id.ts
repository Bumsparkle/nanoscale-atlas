import { defineContent } from '../../content-schema'
import { T3 } from '../../../sources'

export default defineContent({
  id: "wafer-id", title: "Notch and scribed ID", short: "Orientation notch and laser-scribed identification number",
  layer: "wafers", parent: null, node: "wafer-id", sources: [T3(23)],
  what: "The notch at the wafer edge and the identification number scribed beside it.",
  made: "The notch is ground into the edge; the number is laser-scribed.",
  does: "The notch gives the crystal orientation for alignment; the number tracks the wafer through hundreds of process steps.",
})
