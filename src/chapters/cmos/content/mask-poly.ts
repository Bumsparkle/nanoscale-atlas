import { defineContent } from '../../content-schema'
import { T2 } from '../../../sources'

export default defineContent({
  id: 'mask-poly', title: 'Polysilicon mask', short: 'The gates: width 2λ = f',
  layer: 'layout', parent: 'cell', node: 'mask-poly', sources: [T2(28), T2(38), T2(46), T2(47)],
  what: 'The U of polysilicon: two vertical legs (the gates) joined by a bridge (input A).',
  made: 'Patterned with the same lithography sequence as the n-well.',
  does: 'Its minimum width sets the feature size f, the distance between source and drain. Rules: width ≥ 2λ, spacing ≥ 3λ, and a gate extends ≥ 2λ past the diffusion it crosses.',
  fabStep: 'gate-expose',
})
