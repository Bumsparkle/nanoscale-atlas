import { defineContent } from '../../content-schema'
import { T3 } from '../../../sources'

export default defineContent({
  id: "fz-coil", title: "Travelling RF coil", short: "Induction coil that melts a narrow zone",
  layer: "puller", parent: null, node: "fz-coil", tabs: ["fz"], sources: [T3(20)],
  what: "An RF induction coil around the rod.",
  made: "Moves along the rod (or the rod moves through it).",
  does: "Melts a short molten zone held in place by surface tension: no crucible touches the melt.",
})
