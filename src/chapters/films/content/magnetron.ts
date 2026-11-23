import { defineContent } from '../../content-schema'
import { T5 } from '../../../sources'

export default defineContent({
  id: "magnetron", title: "Magnetron magnets", short: "A magnetic trap for electrons near the target",
  layer: "deposition", parent: null, node: "magnetron", tabs: ["plasma"], sources: [T5(48)],
  what: "Magnets behind the target.",
  made: "Their field loops over the target face.",
  does: "Electrons spiral along the field and ionise more Ar near the target: a higher sputter rate and a plasma that survives at ~10⁻³ Torr. The sputtered atoms are neutral, so the magnet does not deflect them.",
})
