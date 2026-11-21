import { defineContent } from '../../content-schema'
import { T3 } from '../../../sources'

export default defineContent({
  id: "cz-ingot", title: "Growing ingot", short: "Single crystal pulled and rotated out of the melt",
  layer: "puller", parent: null, node: "cz-ingot", tabs: ["cz"], sources: [T3(16), T3(17), T3(19)],
  what: "The single-crystal silicon boule being drawn from the melt; its colour here shows its dopant concentration Cs.",
  made: "Pulled slowly upwards while rotating. Pull rate, melt temperature and rotation rate are the control parameters.",
  does: "Its doping follows Cs = k0·C0·(1 − M/M0)^(k0 − 1): for k0 < 1 the tail end is more heavily doped than the seed end. Essentially every IC wafer comes from a Czochralski crystal.",
  dive: { layer: "ingot" },
})
