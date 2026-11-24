import { defineContent } from '../../content-schema'
import { T8 } from '../../../sources'

export default defineContent({
  id: "nf-gates", title: "Split gates", short: "A wire by depletion",
  layer: "nanofab", parent: null, node: "nf-gates", sources: [T8(15)],
  tabs: ["wires"],
  what: "Two metal gates with a narrow gap on top of a quantum well.",
  made: "Lithography and metal deposition.",
  does: "A negative bias depletes the well under the gates, leaving electrons only in a strip under the gap.",
})
