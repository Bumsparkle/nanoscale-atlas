import { defineContent } from '../../content-schema'
import { T2 } from '../../../sources'

export default defineContent({
  id: 'oxide-film', title: 'Gate oxide, atom by atom', short: 'Amorphous SiO₂, < 20 Å: 6–7 atomic layers',
  layer: 'oxide', parent: 'gate-oxide', node: 'oxide-film', sources: [T2(11), T2(37)],
  what: 'A very thin SiO₂ layer, under 20 Å, about 6–7 atomic layers. Si (tan) and O (red) atoms form a disordered network.',
  made: 'Grown or deposited before the poly.',
  does: 'A very good insulator between gate and body: the gate acts through it by field alone.',
  beyond: [
    { text: 'Each Si bonds to four O and each O bridges two Si, with no long-range order (continuous random network).', source: 'Zachariasen, J. Am. Chem. Soc. 54, 3841 (1932)' },
    { text: 'Atom positions are generated, not measured: density ≈ 2.2 g/cm³, Si–O ≈ 1.6 Å.', source: 'Plummer, Deal & Griffin, ch. 6' },
  ],
})
