import { defineContent } from '../../content-schema'

export default defineContent({
  id: 'nwell',
  title: 'n-well',
  short: 'n-type pocket in the p substrate: the body of the pMOS',
  layer: 'cell',
  parent: 'cell',
  anchors: [{ key: 'si:nwell' }],
  slides: [25, 26, 32, 35, 36],
  fabStep: 'nwell-implant',
  what: 'A region of the p substrate converted to n-type. The pMOS needs an n-type body, so it sits in a well (slide 25).',
  made: 'Oxide is grown, patterned with the n-well mask and HF, then arsenic is diffused or implanted. The oxide blocks the ions, so they only enter the exposed silicon (slides 30–35). The oxide is then stripped (slide 36).',
  does: 'The pMOS body. It must be tied to VDD (slides 13, 26), which the n+ well tap does.',
  beyond: [
    { text: 'With the well at VDD and the substrate at GND, the well–substrate p-n junction is always reverse-biased (slide 9), so it isolates the pMOS body from the substrate.', source: 'Weste & Harris, CMOS VLSI Design, 4th ed., ch. 1' },
    { text: 'Drawn 1.5 µm deep, a typical value; the slides give no depth.', source: 'Plummer, Deal & Griffin, Silicon VLSI Technology, ch. 2' },
    { text: 'Production n-wells are usually phosphorus; slide 35 uses arsenic.', source: 'Plummer, Deal & Griffin, ch. 8' },
  ],
})
