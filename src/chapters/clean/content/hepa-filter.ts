import { defineContent } from '../../content-schema'
import { T4 } from '../../../sources'

export default defineContent({
  id: "hepa-filter", title: "Ceiling HEPA filters", short: "High-efficiency particulate air filters over the bay",
  layer: "cleanroom", parent: null, node: "hepa-filter", tabs: ["room"], sources: [T4(2), T4(6)],
  what: "HEPA (high-efficiency particulate air) filters covering the ceiling of the process bay.",
  made: "Pleated glass-fibre media in sealed frames; the recirculating fans sit above them.",
  does: "Room air is continuously recirculated through them to keep the class. Air falls from the ceiling through the bay to the floor.",
  beyond: [
    { text: "A HEPA filter stops at least 99.97 % of 0.3 µm particles.", source: "IEST-RP-CC001" },
  ],
})
