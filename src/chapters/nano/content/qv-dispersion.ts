import { defineContent } from '../../content-schema'
import { T8 } from '../../../sources'

export default defineContent({
  id: "qv-dispersion", title: "E(k) parabola", short: "The free electron",
  layer: "qwave", parent: null, node: "qv-dispersion", sources: [T8(5)],
  tabs: ["free"],
  what: "E = ħ²k²/2m for an electron with V = 0.",
  made: "Solving the Schrödinger equation without walls.",
  does: "Every k is allowed: a continuum of energies, as in bulk material.",
})
