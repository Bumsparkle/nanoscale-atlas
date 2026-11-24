import { defineContent } from '../../content-schema'
import { T7 } from '../../../sources'

export default defineContent({
  id: "sem-link", title: "SEM", short: "Link point to the Measure half",
  layer: "ebeam", parent: null, node: "sem-link", sources: [T7(19), T7(20)],
  tabs: ["write"],
  what: "A scanning electron microscope: the same column with a scan generator and a secondary-electron detector.",
  made: "Not made: a picture of scale.",
  does: "E-beam writers are built like SEMs. The SEM itself belongs to the characterisation (Measure) half of the course, not built yet; this is where it will link.",
})
