import { defineContent } from '../../content-schema'
import { T2 } from '../../../sources'

export default defineContent({
  id: 'nwell',
  title: 'n-well',
  short: 'n-type pocket in the p substrate: the body of the pMOS',
  layer: 'cell',
  parent: 'cell',
  anchors: [{ key: 'si:nwell' }],
  sources: [T2(25), T2(26), T2(32), T2(35), T2(36)],
  fabStep: 'nwell-implant',
  what: 'A region of the p substrate converted to n-type. The pMOS needs an n-type body, so it sits in a well.',
  made: 'Oxide is grown, patterned with the n-well mask and HF, then arsenic is diffused or implanted. The oxide blocks the ions, so they only enter the exposed silicon. The oxide is then stripped.',
  does: 'The pMOS body. It must be tied to VDD, which the n+ well tap does.',
  beyond: [
    { text: 'With the well at VDD and the substrate at GND, the well–substrate p-n junction is always reverse-biased, so it isolates the pMOS body from the substrate.', source: 'Weste & Harris, CMOS VLSI Design, 4th ed., ch. 1' },
    { text: 'Drawn 1.5 µm deep, a typical value; the slides give no depth.', source: 'Plummer, Deal & Griffin, Silicon VLSI Technology, ch. 2' },
    { text: 'Production n-wells are usually phosphorus; the lecture uses arsenic.', source: 'Plummer, Deal & Griffin, ch. 8' },
  ],
})
