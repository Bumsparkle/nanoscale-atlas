import { defineContent } from '../../content-schema'

export default defineContent({
  id: 'bond-pads', title: 'Bond pads', short: 'Aluminium pads that connect the die to its package',
  layer: 'die', parent: 'die', node: 'bond-pads', slides: [45],
  what: 'Large aluminium squares around the edge of the die, made from the same sputtered metal as the wires (slide 45).',
  made: 'Patterned in the metal layer (slide 45).',
  does: 'Connect VDD, GND and signals to the outside world.',
  beyond: [{ text: 'Wires bonded to the pads link the die to its package.', source: 'Weste & Harris, CMOS VLSI Design, 4th ed., ch. 13' }, { text: 'Pads are typically around 100 µm across; the overcoat opening is a separate mask not covered in Topic 2.', source: 'Weste & Harris, CMOS VLSI Design, 4th ed., ch. 13' }],
})
