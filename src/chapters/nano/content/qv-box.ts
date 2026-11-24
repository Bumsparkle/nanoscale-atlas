import { defineContent } from '../../content-schema'
import { T8 } from '../../../sources'

export default defineContent({
  id: "qv-box", title: "Confining box", short: "Well, wire or dot",
  layer: "qwave", parent: null, node: "qv-box", sources: [T8(12), T8(13)],
  tabs: ["confine"],
  what: "The same semiconductor confined in one, two or three directions.",
  made: "By epitaxy, etching, gates or self-assembly.",
  does: "Each confined direction adds ħ²π²n²/(2ma²) to the energy; a dot has only discrete levels.",
})
