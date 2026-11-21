import { defineContent } from '../../content-schema'
import { T2 } from '../../../sources'

export default defineContent({
  id: 'metal-y',
  title: 'Output Y (metal1)',
  short: 'Aluminium joining both drains: the output',
  layer: 'cell',
  parent: 'cell',
  anchors: [{ key: 'al', x: 22, y: 2 }],
  sources: [T2(15), T2(25), T2(27), T2(45)],
  fabStep: 'metal-etch',
  what: 'The middle aluminium wire, joining the nMOS drain and the pMOS drain.',
  made: 'Patterned from the same sputtered aluminium as the rails.',
  does: 'The output Y of the inverter. Exactly one transistor is ON for each input, so Y is driven to either VDD or GND, never both.',
})
