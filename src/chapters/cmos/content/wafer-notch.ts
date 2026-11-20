import { defineContent } from '../../content-schema'

export default defineContent({
  id: 'wafer-notch', title: 'Orientation notch', short: 'Marks the crystal orientation of the wafer',
  layer: 'wafer', parent: 'wafer', node: 'wafer-notch', slides: [3, 24],
  what: 'A small notch cut into the wafer edge.',
  made: 'Ground into the edge when the single-crystal ingot is shaped (slide 3 shows why the crystal order matters).',
  does: 'Tools align each mask to the crystal and to the previous layer using it, so every die lines up from step to step (slide 24).',
  beyond: [{ text: 'On 300 mm wafers the notch marks a 〈110〉 direction.', source: 'SEMI M1 wafer standard' }],
})
