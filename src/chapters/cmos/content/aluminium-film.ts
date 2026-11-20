import { defineContent } from '../../content-schema'

export default defineContent({
  id: 'aluminium-film',
  title: 'Sputtered aluminium',
  short: 'Blanket aluminium before the metal mask',
  layer: 'cell',
  parent: 'cell',
  anchors: [{ key: 'al' }],
  slides: [45],
  fabStep: 'al',
  what: 'Aluminium covering the whole wafer, before patterning (slide 45).',
  made: 'Sputtered over the whole wafer (slide 45).',
  does: 'Fills the contact cuts. Patterning with the metal mask leaves the GND, Y and VDD wires (slide 45).',
  beyond: [{ text: 'Drawn 700 nm thick, a typical value.', source: 'Plummer, Deal & Griffin, ch. 2' }],
})
