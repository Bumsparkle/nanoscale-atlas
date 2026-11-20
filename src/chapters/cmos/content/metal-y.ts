import { defineContent } from '../../content-schema'

export default defineContent({
  id: 'metal-y',
  title: 'Output Y (metal1)',
  short: 'Aluminium joining both drains: the output',
  layer: 'cell',
  parent: 'cell',
  anchors: [{ key: 'al', x: 22, y: 2 }],
  slides: [15, 25, 27, 45],
  fabStep: 'metal-etch',
  what: 'The middle aluminium wire, joining the nMOS drain and the pMOS drain (slides 25, 27).',
  made: 'Patterned from the same sputtered aluminium as the rails (slide 45).',
  does: 'The output Y of the inverter. Exactly one transistor is ON for each input, so Y is driven to either VDD or GND, never both (slides 16–17).',
})
