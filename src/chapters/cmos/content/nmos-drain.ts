import { defineContent } from '../../content-schema'
import { T2 } from '../../../sources'

export default defineContent({
  id: 'nmos-drain',
  title: 'nMOS drain (n+)',
  short: 'n+ silicon on the output side, wired to Y',
  layer: 'cell',
  parent: 'cell',
  anchors: [{ key: 'si:n+', x: 14, y: 2 }],
  sources: [T2(11), T2(25), T2(41)],
  fabStep: 'n-implant',
  what: 'The n+ diffusion on the output side of the nMOS gate.',
  made: 'The same self-aligned n+ implant as the source: the poly gate splits one n+ opening into source and drain.',
  does: 'Connected to the output Y by metal. With A = 1 the nMOS is ON and pulls Y to GND, so Y = 0.',
  dive: { layer: 'transistor', device: 'nmos' },
})
