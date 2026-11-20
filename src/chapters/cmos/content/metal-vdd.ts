import { defineContent } from '../../content-schema'

export default defineContent({
  id: 'metal-vdd',
  title: 'VDD rail (metal1)',
  short: 'Aluminium: pMOS source + well tap to VDD',
  layer: 'cell',
  parent: 'cell',
  anchors: [{ key: 'al', x: 42, y: -6 }],
  slides: [13, 25, 26, 27, 28, 45],
  fabStep: 'metal-etch',
  what: 'The right aluminium wire: a vertical rail with an arm along the slide 27 line (slide 28).',
  made: 'Patterned from the sputtered aluminium with the metal mask (slide 45).',
  does: 'Carries the supply VDD to the pMOS source and the well tap. VDD was 5 V in the 1980s and has fallen to 1.0 V and below in modern processes, which saves power and protects tiny transistors (slide 13).',
})
