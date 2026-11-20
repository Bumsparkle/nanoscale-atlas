import { defineContent } from '../../content-schema'

export default defineContent({
  id: 'die', title: 'Die', short: 'One chip: many transistors on one piece of silicon',
  layer: 'die', parent: 'wafer', node: 'die', slides: [2, 24, 46],
  what: 'An integrated circuit: many transistors on one chip (slide 2). Its minimum mask dimensions set the transistor size, and with it speed, cost and power (slide 46).',
  made: 'Built on the wafer by the CMOS process (slides 24, 29–45), then sawn out.',
  does: 'Holds memory and logic blocks wired from standard cells such as the inverter.',
  beyond: [{ text: 'The floorplan shown (memory array, logic rows, pad ring) is illustrative.', source: 'Weste & Harris, CMOS VLSI Design, 4th ed., ch. 1' }],
  dive: { layer: 'cell' },
})
