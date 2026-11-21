import { defineContent } from '../../content-schema'

export default defineContent({
  id: 'mask-poly', title: 'Polysilicon mask', short: 'The gates: width 2λ = f',
  layer: 'layout', parent: 'cell', node: 'mask-poly', slides: [28, 38, 46, 47],
  what: 'The U of polysilicon: two vertical legs (the gates) joined by a bridge (input A) (slide 28).',
  made: 'Patterned with the same lithography sequence as the n-well (slide 38).',
  does: 'Its minimum width sets the feature size f, the distance between source and drain (slide 46). Rules: width ≥ 2λ, spacing ≥ 3λ, and a gate extends ≥ 2λ past the diffusion it crosses (slide 47).',
  fabStep: 'gate-expose',
})
