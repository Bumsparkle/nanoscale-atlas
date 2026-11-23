import { defineContent } from '../../content-schema'
import { T6 } from '../../../sources'

export default defineContent({
  id: "barrel", title: "Barrel epi reactor", short: "Lamp-heated susceptor for silicon epitaxy",
  layer: "deposition", parent: null, node: "barrel", tabs: ["siepi"], sources: [T6(11)],
  what: "A faceted susceptor holding wafers inside a quartz bell, heated by banks of quartz lamps.",
  made: "Gas (e.g. HSiCl₃ + H₂) enters at the top and leaves at the bottom; 900–1100 °C, 100 Torr to atmospheric.",
  does: "Grows a lightly doped epi layer on heavily doped substrates; HCl can etch the surface clean in situ.",
})
