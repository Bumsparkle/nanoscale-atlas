import { defineContent } from '../../content-schema'

export default defineContent({
  id: 'substrate-tap',
  title: 'Substrate tap (p+)',
  short: 'p+ contact that ties the p substrate to GND',
  layer: 'cell',
  parent: 'cell',
  anchors: [{ key: 'si:p+', x: 2, y: 2 }],
  slides: [26, 27, 43],
  fabStep: 'p-implant',
  what: 'A small p+ region in the p substrate under the GND metal (slides 26–27).',
  made: 'Formed by the same p+ implant as the pMOS source and drain (slide 43).',
  does: 'The substrate must be tied to GND (slide 26). Metal on lightly doped silicon forms a poor connection, a Schottky diode, so the contact lands on heavily doped p+ instead (slide 26).',
})
