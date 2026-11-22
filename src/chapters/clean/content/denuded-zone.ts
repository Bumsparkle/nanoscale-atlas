import { defineContent } from '../../content-schema'
import { T4 } from '../../../sources'

export default defineContent({
  id: "denuded-zone", title: "Denuded zone", short: "10–20 µm free of precipitates (or an epi layer)",
  layer: "wafer", parent: null, node: "denuded-zone", tabs: ["gettering"], sources: [T4(13), T4(14)],
  what: "The 10–20 µm under the devices with no oxygen precipitates.",
  made: "Oxygen out-diffuses from the surface at high temperature (~1100 °C) before nucleation.",
  does: "Keeps defects away from the devices while the bulk below traps metals.",
})
