import { defineContent } from '../../content-schema'
import { T2 } from '../../../sources'

export default defineContent({
  id: 'metal-gnd',
  title: 'GND rail (metal1)',
  short: 'Aluminium: substrate tap + nMOS source to GND',
  layer: 'cell',
  parent: 'cell',
  anchors: [{ key: 'al', x: 2, y: -6 }],
  sources: [T2(25), T2(26), T2(27), T2(28), T2(45)],
  fabStep: 'metal-etch',
  what: 'The left aluminium wire: a vertical rail with an arm along the slide 27 line.',
  made: 'Aluminium is sputtered over the whole wafer, then patterned with the metal mask to leave wires.',
  does: 'Connects GND (0 V) to the substrate tap and the nMOS source.',
})
