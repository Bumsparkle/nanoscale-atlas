import { defineContent } from '../../content-schema'

export default defineContent({
  id: 'metal-gnd',
  title: 'GND rail (metal1)',
  short: 'Aluminium: substrate tap + nMOS source to GND',
  layer: 'cell',
  parent: 'cell',
  anchors: [{ key: 'al', x: 2, y: -6 }],
  slides: [25, 26, 27, 28, 45],
  fabStep: 'metal-etch',
  what: 'The left aluminium wire: a vertical rail with an arm along the slide 27 line (slide 28).',
  made: 'Aluminium is sputtered over the whole wafer, then patterned with the metal mask to leave wires (slide 45).',
  does: 'Connects GND (0 V, slide 13) to the substrate tap and the nMOS source (slides 25–26).',
})
