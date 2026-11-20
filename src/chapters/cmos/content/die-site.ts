import { defineContent } from '../../content-schema'

export default defineContent({
  id: 'die-site', title: 'The inverter’s die', short: 'One die of many; zoom in to reach the inverter',
  layer: 'wafer', parent: 'wafer', node: 'die-site', slides: [2, 24],
  what: 'One rectangle of the die grid: a complete chip, with many transistors on one chip (slide 2).',
  made: 'Every die gets the same masks and process steps at the same time (slide 24).',
  does: 'Contains the inverter cell this chapter follows down to the atoms.',
  beyond: [{ text: 'Dies are separated by scribe lines and sawn apart after fabrication.', source: 'Plummer, Deal & Griffin, ch. 1' }, { text: 'Shown as 4 mm × 4 mm for illustration; real die sizes range from about 1 mm to over 25 mm.', source: 'Weste & Harris, CMOS VLSI Design, 4th ed., ch. 1' }],
  dive: { layer: 'die' },
})
