import { defineContent } from '../../content-schema'
import { T6 } from '../../../sources'

export default defineContent({
  id: "rheed-gun", title: "RHEED gun", short: "High-energy electrons at a grazing angle",
  layer: "mbe", parent: null, node: "rheed-gun", sources: [T6(24)],
  what: "An electron gun aimed at the substrate at a grazing angle.",
  made: "Fires a beam of high-energy electrons.",
  does: "Grazing incidence makes the diffraction surface-specific, so it reports on the growing surface in real time.",
})
