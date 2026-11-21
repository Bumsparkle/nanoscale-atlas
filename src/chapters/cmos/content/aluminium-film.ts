import { defineContent } from '../../content-schema'
import { T2 } from '../../../sources'

export default defineContent({
  id: 'aluminium-film',
  title: 'Sputtered aluminium',
  short: 'Blanket aluminium before the metal mask',
  layer: 'cell',
  parent: 'cell',
  anchors: [{ key: 'al' }],
  sources: [T2(45)],
  fabStep: 'al',
  what: 'Aluminium covering the whole wafer, before patterning.',
  made: 'Sputtered over the whole wafer.',
  does: 'Fills the contact cuts. Patterning with the metal mask leaves the GND, Y and VDD wires.',
  beyond: [{ text: 'Drawn 700 nm thick, a typical value.', source: 'Plummer, Deal & Griffin, ch. 2' }],
})
