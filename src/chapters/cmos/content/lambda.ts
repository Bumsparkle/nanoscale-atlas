import { defineContent } from '../../content-schema'

export default defineContent({
  id: 'lambda', title: 'λ design rules', short: 'λ = f/2 = 0.3 µm in the 0.6 µm process',
  layer: 'layout', parent: 'cell', node: 'lambda', slides: [46, 47],
  what: 'A grid in units of λ = f/2, where the feature size f is the distance between source and drain, set by the minimum width of polysilicon (slide 46).',
  made: 'Rules are normalised to the feature size so one layout works across processes. For example, λ = 0.3 µm in a 0.6 µm process (slide 46).',
  does: 'Conservative λ rules (slide 47) keep each layer manufacturable. Feature size improves about 30 % every 3 years (slide 46), so the same λ layout scales down.',
})
