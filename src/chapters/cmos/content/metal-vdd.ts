import { defineContent } from '../../content-schema'
import { T2 } from '../../../sources'

export default defineContent({
  id: 'metal-vdd',
  title: 'VDD rail (metal1)',
  short: 'Aluminium: pMOS source + well tap to VDD',
  layer: 'cell',
  parent: 'cell',
  anchors: [{ key: 'al', x: 42, y: -6 }],
  sources: [T2(13), T2(25), T2(26), T2(27), T2(28), T2(45)],
  fabStep: 'metal-etch',
  what: 'The right aluminium wire: a vertical rail with an arm along the slide 27 line.',
  made: 'Patterned from the sputtered aluminium with the metal mask.',
  does: 'Carries the supply VDD to the pMOS source and the well tap. VDD was 5 V in the 1980s and has fallen to 1.0 V and below in modern processes, which saves power and protects tiny transistors.',
})
