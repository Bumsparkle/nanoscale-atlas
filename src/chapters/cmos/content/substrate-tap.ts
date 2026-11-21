import { defineContent } from '../../content-schema'
import { T2 } from '../../../sources'

export default defineContent({
  id: 'substrate-tap',
  title: 'Substrate tap (p+)',
  short: 'p+ contact that ties the p substrate to GND',
  layer: 'cell',
  parent: 'cell',
  anchors: [{ key: 'si:p+', x: 2, y: 2 }],
  sources: [T2(26), T2(27), T2(43)],
  fabStep: 'p-implant',
  what: 'A small p+ region in the p substrate under the GND metal.',
  made: 'Formed by the same p+ implant as the pMOS source and drain.',
  does: 'The substrate must be tied to GND. Metal on lightly doped silicon forms a poor connection, a Schottky diode, so the contact lands on heavily doped p+ instead.',
})
