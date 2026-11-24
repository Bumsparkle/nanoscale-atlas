import { defineContent } from '../../content-schema'
import { T7 } from '../../../sources'

export default defineContent({
  id: "eb-blanker", title: "Blanking plates", short: "The beam’s on–off switch",
  layer: "ebeam", parent: null, node: "eb-blanker", sources: [T7(19)],
  tabs: ["write"],
  what: "A pair of plates in the column.",
  made: "Driven by the computer and pattern generator.",
  does: "A voltage deflects the beam into the aperture, switching it off between shapes.",
})
