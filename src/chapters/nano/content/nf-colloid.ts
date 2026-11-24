import { defineContent } from '../../content-schema'
import { T8 } from '../../../sources'

export default defineContent({
  id: "nf-colloid", title: "Colloidal dots", short: "Core–shell nanocrystals",
  layer: "nanofab", parent: null, node: "nf-colloid", sources: [T8(19)],
  tabs: ["colloid"],
  what: "CdSe cores with ZnS shells in solution.",
  made: "Precipitated by chemistry; capped to stay stable.",
  does: "Their size sets the colour: bigger red, smaller blue; sizes vary (dispersion).",
  beyond: [{ text: "Colour from the Brus model of the confined exciton.", source: "Brus, J. Chem. Phys. 80, 4403 (1984)" }],
})
