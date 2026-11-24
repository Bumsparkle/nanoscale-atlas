import { defineContent } from '../../content-schema'
import { T7 } from '../../../sources'

export default defineContent({
  id: "eb-column", title: "Electron-beam column", short: "An SEM with on–off control",
  layer: "ebeam", parent: null, node: "eb-column", sources: [T7(19), T7(22)],
  tabs: ["write"],
  what: "Gun, alignment coil, condenser lenses, blanking plates, limiting aperture, final lens and deflection coils.",
  made: "Electromagnetic lenses in high vacuum.",
  does: "Writes the pattern directly, one pixel at a time: a 1 nm beam, ~10 nm resolution, flexible, but slow and costly.",
})
