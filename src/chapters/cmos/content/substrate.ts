import { defineContent } from '../../content-schema'

export default defineContent({
  id: 'substrate',
  title: 'p-type substrate',
  short: 'Lightly doped p-type silicon: the body of the nMOS',
  layer: 'cell',
  parent: 'cell',
  anchors: [{ key: 'si:p' }],
  slides: [10, 12, 25, 26, 29],
  fabStep: 'start',
  what: 'Single-crystal silicon doped p-type with a group III acceptor such as boron (slide 5). Everything in the inverter is built into or on top of it, from the bottom up (slide 29).',
  made: 'Arrives as the blank wafer, before any processing (slide 29).',
  does: 'It is the body of the nMOS transistor: CMOS typically uses a p-type substrate for nMOS (slide 25). The body is tied to GND (slide 12) through the substrate tap, because metal on lightly doped silicon would form a Schottky diode (slide 26).',
  beyond: [
    { text: 'Only the top 2.4 µm are drawn. A real 300 mm wafer is 775 µm thick.', source: 'SEMI M1 wafer standard' },
  ],
})
