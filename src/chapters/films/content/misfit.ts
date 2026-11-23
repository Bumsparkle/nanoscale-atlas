import { defineContent } from '../../content-schema'
import { T6 } from '../../../sources'

export default defineContent({
  id: "misfit", title: "Misfit dislocation", short: "Where a relaxed film breaks a row of bonds",
  layer: "surface", parent: null, node: "misfit", tabs: ["strain"], sources: [T6(4), T6(5)],
  what: "An extra half-plane at the interface of a relaxed (metamorphic) film.",
  made: "Forms once a mismatched film is too thick to stay strained.",
  does: "Relieves the strain but leaves defects that kill device performance.",
})
