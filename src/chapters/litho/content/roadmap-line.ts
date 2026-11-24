import { defineContent } from '../../content-schema'
import { T7 } from '../../../sources'

export default defineContent({
  id: "roadmap-line", title: "Lines at the node", short: "The roadmap’s half pitch",
  layer: "litho", parent: null, node: "roadmap-line", sources: [T7(2)],
  tabs: ["roadmap"],
  what: "Gate lines drawn at the roadmap year’s half pitch, beside the exposure wavelength.",
  made: "By lithography: 248 nm until 2002, then 193 nm with resolution enhancement and water immersion.",
  does: "Since 1998 the features have been smaller than the light printing them: 0.7× in linear size every 3 years.",
})
