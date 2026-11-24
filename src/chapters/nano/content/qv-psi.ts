import { defineContent } from '../../content-schema'
import { T8 } from '../../../sources'

export default defineContent({
  id: "qv-psi", title: "Wavefunction", short: "ψ or |ψ|²",
  layer: "qwave", parent: null, node: "qv-psi", sources: [T8(4), T8(5), T8(7), T8(10)],
  tabs: ["free", "well"],
  what: "The wavefunction of each state, or its probability density.",
  made: "From the Schrödinger equation with the boundary conditions.",
  does: "In an infinite well ψₙ = √(2/L) sin(nπx/L); in a finite well it leaks into the barriers.",
})
