import { defineContent } from '../../content-schema'

export default defineContent({
  id: 'inverter-instance', title: 'This inverter', short: '18.6 µm × 8.4 µm: 62λ × 28λ at λ = 0.3 µm',
  layer: 'die', parent: 'die', node: 'inverter-instance', slides: [15, 27, 46],
  what: 'One CMOS inverter (slide 15): 62λ × 28λ including its rails. At λ = 0.3 µm (slide 46) that is 18.6 µm × 8.4 µm.',
  made: 'Six masks (slide 27) and the fabrication sequence of slides 29–45.',
  does: 'Y = NOT A. Zoom in to see it built.',
  dive: { layer: 'cell' },
})
