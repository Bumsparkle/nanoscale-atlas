import { defineContent } from '../../content-schema'
import { T8 } from '../../../sources'

export default defineContent({
  id: "qmbe-stack", title: "Grown stack", short: "The layers so far, to scale",
  layer: "qmbe", parent: null, node: "qmbe-stack", sources: [T8(9), T8(14)],
  what: "The heterostructure grown so far.",
  made: "One layer per shutter sequence.",
  does: "Each layer’s material and thickness set the band profile and the confined levels.",
})
