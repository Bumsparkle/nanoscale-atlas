import { defineContent } from '../../content-schema'
import { T8 } from '../../../sources'

export default defineContent({
  id: "qv-kspace", title: "k-space", short: "Counting the states",
  layer: "qwave", parent: null, node: "qv-kspace", sources: [T8(23), T8(24), T8(25), T8(26), T8(27), T8(28), T8(29), T8(30)],
  tabs: ["dos"],
  what: "The allowed standing waves as points of a grid of spacing π/L.",
  made: "From the boundary conditions in each free direction.",
  does: "The points inside a sphere, disc or line of radius k give N(E), and ρ(E) = (1/V)dN/dE: E^½, constant, E^−½, δ.",
})
