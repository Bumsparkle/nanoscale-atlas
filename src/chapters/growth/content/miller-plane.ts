import { defineContent } from '../../content-schema'
import { T3 } from '../../../sources'

export default defineContent({
  id: "miller-plane", title: "Miller plane (hkl)", short: "The crystal plane with intercepts a/h, a/k, a/l",
  layer: "lattice", parent: null, node: "miller-plane", tabs: ["miller"], sources: [T3(6)],
  what: "A crystal plane named by its Miller indices: the reciprocals of its intercepts with x, y and z, cleared to whole numbers.",
  made: "Its normal is the direction [hkl]: in a cubic crystal [100] is perpendicular to (100).",
  does: "Planes differ in atom density: in silicon (111) is denser than (100) (slide 6). Atoms lying in the plane are lit.",
  beyond: [
    { text: "Sheet densities in Si: (100) 6.8 × 10¹⁴, (111) 7.8 × 10¹⁴, (110) 9.6 × 10¹⁴ atoms cm⁻².", source: "Sze & Ng, Physics of Semiconductor Devices, App. F" },
  ],
})
