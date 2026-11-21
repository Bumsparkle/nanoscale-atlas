import { defineContent } from '../../content-schema'
import { T2 } from '../../../sources'

export default defineContent({
  id: 'die', title: 'Die', short: 'One chip: many transistors on one piece of silicon',
  layer: 'die', parent: 'wafer', node: 'die', sources: [T2(2), T2(24), T2(46)],
  what: 'An integrated circuit: many transistors on one chip. Its minimum mask dimensions set the transistor size, and with it speed, cost and power.',
  made: 'Built on the wafer by the CMOS process, then sawn out.',
  does: 'Holds memory and logic blocks wired from standard cells such as the inverter.',
  beyond: [{ text: 'The floorplan shown (memory array, logic rows, pad ring) is illustrative.', source: 'Weste & Harris, CMOS VLSI Design, 4th ed., ch. 1' }],
  dive: { layer: 'cell' },
})
