import { defineContent } from '../../content-schema'
import { T2 } from '../../../sources'

export default defineContent({
  id: 'mask-metal', title: 'Metal mask', short: 'GND, Y and VDD wires',
  layer: 'layout', parent: 'cell', node: 'mask-metal', sources: [T2(27), T2(28), T2(45), T2(47)],
  what: 'Three wires: the GND rail with its arm, the output Y, and the VDD rail with its arm.',
  made: 'Patterns the sputtered aluminium, removing the excess and leaving wires.',
  does: 'Rules: metal1 width ≥ 4λ and spacing ≥ 4λ. In this cell both gaps between the three wires sit exactly at 4λ.',
  fabStep: 'metal-expose',
})
