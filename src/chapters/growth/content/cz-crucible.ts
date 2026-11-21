import { defineContent } from '../../content-schema'
import { T3 } from '../../../sources'

export default defineContent({
  id: "cz-crucible", title: "Quartz crucible", short: "Fused-silica crucible holding the melt",
  layer: "puller", parent: null, node: "cz-crucible", tabs: ["cz"], sources: [T3(16), T3(17)],
  what: "A fused-silica (quartz) crucible inside a graphite susceptor.",
  made: "Turned in the opposite direction to the seed (clockwise in the slide 17 schematic).",
  does: "Holds the molten silicon. Molten silicon slowly dissolves the quartz, which is where the ~10¹⁸ cm⁻³ of oxygen in CZ silicon comes from.",
  beyond: [
    { text: "Crucible dissolution is the oxygen source; float-zone silicon, with no crucible, has far less.", source: "Plummer, Deal & Griffin, Silicon VLSI Technology, ch. 3" },
  ],
})
