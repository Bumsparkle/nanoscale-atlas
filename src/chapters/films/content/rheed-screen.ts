import { defineContent } from '../../content-schema'
import { T6 } from '../../../sources'

export default defineContent({
  id: "rheed-screen", title: "RHEED screen", short: "Diffraction streaks that pulse once per monolayer",
  layer: "mbe", parent: null, node: "rheed-screen", sources: [T6(24), T6(25)],
  what: "A phosphor screen opposite the gun showing the diffraction streaks.",
  made: "Watched by a camera.",
  does: "Flat surfaces give sharp streaks. As a monolayer fills, the intensity dips (half covered, roughest) and recovers (complete): one oscillation per monolayer, so counting them measures the growth rate.",
})
