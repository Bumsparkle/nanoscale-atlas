import { defineContent } from '../../content-schema'

export default defineContent({
  id: 'mask-metal', title: 'Metal mask', short: 'GND, Y and VDD wires',
  layer: 'layout', parent: 'cell', node: 'mask-metal', slides: [27, 28, 45, 47],
  what: 'Three wires: the GND rail with its arm, the output Y, and the VDD rail with its arm (slides 27–28).',
  made: 'Patterns the sputtered aluminium, removing the excess and leaving wires (slide 45).',
  does: 'Rules: metal1 width ≥ 4λ and spacing ≥ 4λ (slide 47). In this cell both gaps between the three wires sit exactly at 4λ.',
  fabStep: 'metal-expose',
})
