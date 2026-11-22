import { defineContent } from '../../content-schema'
import { T4 } from '../../../sources'

export default defineContent({
  id: "oxide-precipitate", title: "SiO₂ precipitate", short: "A trap site in the bulk",
  layer: "wafer", parent: null, node: "oxide-precipitate", tabs: ["gettering"], sources: [T4(14), T4(20)],
  what: "A cluster of SiO₂ with dislocations and stacking faults around it.",
  made: "Interstitial oxygen from the CZ crucible gathers on a nucleus.",
  does: "Its strained surroundings trap fast-diffusing metal atoms.",
})
