import { defineContent } from '../../content-schema'

export default defineContent({
  id: 'bond-pads', title: 'Bond pads', short: 'Aluminium pads that connect the die to its package',
  layer: 'die', parent: 'die', node: 'bond-pads', slides: [45],
  what: 'Large aluminium squares around the edge of the die, made from the same sputtered metal as the wires (slide 45).',
  made: 'Patterned in the metal layer (slide 45) and left open through the protective overcoat.',
  does: 'Wires bonded to these pads carry VDD, GND and signals between the package and the chip.',
  beyond: [{ text: 'Pads are typically around 100 µm across; the overcoat opening is a separate mask not covered in Topic 2.', source: 'Weste & Harris, CMOS VLSI Design, 4th ed., ch. 13' }],
})
