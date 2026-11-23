import { defineContent } from '../../content-schema'
import { T5 } from '../../../sources'

export default defineContent({
  id: "cvd-tube", title: "CVD reactor tube", short: "Quartz tube: APCVD on a tilted susceptor, LPCVD with standing wafers",
  layer: "deposition", parent: null, node: "cvd-tube", tabs: ["cvd"], sources: [T5(11), T5(12), T5(20)],
  what: "A horizontal quartz reaction tube. At atmospheric pressure the wafers lie on a tilted graphite susceptor; at low pressure they stand up in a boat, packed close together.",
  made: "Gas lines feed one end; the other is pumped (LPCVD) or vented (APCVD).",
  does: "The tilt narrows the channel so the gas speeds up and the boundary layer stays even. At low pressure hG is ~100× larger, so the gas reaches every wafer and dozens can be coated at once.",
})
