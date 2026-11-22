import { defineContent } from '../../content-schema'
import { T4 } from '../../../sources'

export default defineContent({
  id: "backside-region", title: "Backside gettering region", short: "Damaged back surface: extrinsic gettering",
  layer: "wafer", parent: null, node: "backside-region", tabs: ["gettering"], sources: [T4(12), T4(14), T4(20)],
  what: "A deliberately damaged layer at the back of the wafer.",
  made: "Mechanical damage or a heavily doped (N⁺) layer.",
  does: "Extrinsic gettering: heavy metals segregate to damaged or N⁺ regions or pair with P.",
})
