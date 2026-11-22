import { defineContent } from '../../content-schema'
import { T2 } from '../../../sources'

export default defineContent({
  id: 'wafer', title: '300 mm silicon wafer', short: 'Single-crystal silicon disc carrying hundreds of dies',
  layer: 'wafer', parent: null, node: 'wafer', tabs: ['explore', 'process', 'yield'], sources: [T2(3), T2(24), T2(29)],
  what: 'A polished disc of single-crystal silicon. CMOS transistors are fabricated on silicon wafers; every die on it receives the same sequence of masks and steps.',
  made: 'The fab starts from a blank, lightly doped p-type wafer and builds the circuits from the bottom up.',
  does: 'Carries many copies of the chip at once. Lithography works like a printing press: each mask is stepped across the wafer.',
  beyond: [
    { text: '300 mm diameter, 775 µm thick, with a notch marking the crystal orientation.', source: 'SEMI M1 wafer standard' },
    { text: 'The rainbow sheen is diffraction from the repeating patterns on the dies.', source: 'Hecht, Optics, ch. 10' },
  ],
  dive: { layer: 'die' },
})
