import { defineContent } from '../../content-schema'
import { T2 } from '../../../sources'

export default defineContent({
  id: 'substrate',
  title: 'p-type substrate',
  short: 'Lightly doped p-type silicon: the body of the nMOS',
  layer: 'cell',
  parent: 'cell',
  anchors: [{ key: 'si:p' }],
  sources: [T2(10), T2(12), T2(25), T2(26), T2(29)],
  fabStep: 'start',
  what: 'Single-crystal silicon doped p-type with a group III acceptor such as boron. Everything in the inverter is built into or on top of it, from the bottom up.',
  made: 'Arrives as the blank wafer, before any processing.',
  does: 'It is the body of the nMOS transistor: CMOS typically uses a p-type substrate for nMOS. The body is tied to GND through the substrate tap, because metal on lightly doped silicon would form a Schottky diode.',
  beyond: [
    { text: 'Only the top 2.4 µm are drawn. A real 300 mm wafer is 775 µm thick.', source: 'SEMI M1 wafer standard' },
  ],
})
