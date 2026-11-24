import { defineContent } from '../../content-schema'
import { T7 } from '../../../sources'

export default defineContent({
  id: "eb-trajectories", title: "Electron paths", short: "Forward scatter and backscatter",
  layer: "ebeam", parent: null, node: "eb-trajectories", sources: [T7(21)],
  tabs: ["proximity"],
  what: "Simulated paths of beam electrons in PMMA on silicon.",
  made: "Monte Carlo: random elastic deflections and continuous energy loss.",
  does: "Backscattered electrons return far from the beam and add exposure there (the proximity effect); higher energy spreads them further.",
  beyond: [{ text: "Screened-Rutherford scattering with Bethe energy loss.", source: "Joy, Monte Carlo Modeling for Electron Microscopy and Microanalysis (1995)" }],
})
