import { defineContent } from '../../content-schema'
import { T4 } from '../../../sources'

export default defineContent({
  id: "tank-sc1", title: "SC-1 tank", short: "NH₄OH/H₂O₂/H₂O at 80–90 °C",
  layer: "cleanroom", parent: null, node: "tank-sc1", tabs: ["wetbench"], sources: [T4(10), T4(11)],
  what: "Standard clean 1: NH₄OH/H₂O₂/H₂O, 1:1:5 to 0.05:1:5, 80–90 °C, 10 min.",
  made: "Little NH₄OH reduces etching and roughening of the Si.",
  does: "Oxidises organic films, oxidises the Si and complexes metals: strips organics, metals and particles.",
})
