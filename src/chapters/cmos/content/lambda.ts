import { defineContent } from '../../content-schema'
import { T2 } from '../../../sources'

export default defineContent({
  id: 'lambda', title: 'λ design rules', short: 'λ = f/2 = 0.3 µm in the 0.6 µm process',
  layer: 'layout', parent: 'cell', node: 'lambda', sources: [T2(46), T2(47)],
  what: 'A grid in units of λ = f/2, where the feature size f is the distance between source and drain, set by the minimum width of polysilicon.',
  made: 'Rules are normalised to the feature size so one layout works across processes. For example, λ = 0.3 µm in a 0.6 µm process.',
  does: 'Conservative λ rules keep each layer manufacturable. Feature size improves about 30 % every 3 years, so the same λ layout scales down.',
})
