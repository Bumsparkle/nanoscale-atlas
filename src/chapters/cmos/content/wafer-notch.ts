import { defineContent } from '../../content-schema'
import { T2 } from '../../../sources'

export default defineContent({
  id: 'wafer-notch', title: 'Orientation notch', short: 'Marks the crystal orientation of the wafer',
  layer: 'wafer', parent: 'wafer', node: 'wafer-notch', sources: [T2(3), T2(24)],
  what: 'A small notch cut into the wafer edge.',
  made: 'Not covered in the lecture; see below. Slide 3 shows why the crystal order matters.',
  does: 'Each mask must line up with the layers already on the wafer (show six masks in registration).',
  beyond: [
    { text: 'The notch is ground into the edge when the ingot is shaped; on 300 mm wafers it marks a 〈110〉 direction, and tools use it for coarse alignment.', source: 'SEMI M1 wafer standard' },
  ],
})
