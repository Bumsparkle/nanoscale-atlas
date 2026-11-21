import { defineContent } from '../../content-schema'

export default defineContent({
  id: 'min-transistor', title: 'Minimum transistor', short: 'W = 4λ, L = 2λ: 1.2 µm wide, 0.6 µm long at f = 0.6 µm',
  layer: 'layout', parent: 'cell', node: 'min-transistor', slides: [46, 48],
  what: 'Both gates in this layout are the minimum transistor, "sometimes called 1 unit" (slide 48). The channel length L is the poly width across the diffusion, 2λ; the width W is the diffusion under the gate, 4λ.',
  made: 'Set by the masks: poly width (2λ minimum, slide 47) gives L, and the diffusion extent along the gate gives W.',
  does: 'In the f = 0.6 µm process, L = 2λ = 0.6 µm and W = 4λ = 1.2 µm. The slide text says "Length / Width … 4λ / 2λ … 0.6 µm wide, 1.2 µm long", that is L = 1.2 µm and W = 0.6 µm. The drawn layout and slide 46 (f is the source–drain distance, set by the poly width) give L = 0.6 µm and W = 1.2 µm.',
  beyond: [
    { text: 'Slide 48 sizes the pMOS 8/2 (twice as wide, for the lower hole mobility of slide 10); the slide 27 mask set used here draws both at the minimum.', source: 'Slides 10, 27, 48; Weste & Harris, CMOS VLSI Design, 4th ed., ch. 1' },
    { text: 'The usual convention quotes W/L, so "4/2" means W = 4λ, L = 2λ.', source: 'Weste & Harris, CMOS VLSI Design, 4th ed., ch. 1' },
  ],
})
