import { defineContent } from '../../content-schema'
import { T6 } from '../../../sources'

export default defineContent({
  id: "mbe-chamber", title: "MBE growth chamber", short: "Ultra-high vacuum, below 10⁻¹³ bar",
  layer: "mbe", parent: null, node: "mbe-chamber", sources: [T6(17), T6(19)],
  what: "The stainless growth chamber of an MBE system, lined with liquid-nitrogen cryopanels.",
  made: "Pumped by cryopumps to ultra-high vacuum; a buffer chamber and load lock keep it clean.",
  does: "Below 10⁻⁴ Torr the beams are collision-free; below 10⁻⁹ Torr the surface stays clean long enough to grow on.",
})
