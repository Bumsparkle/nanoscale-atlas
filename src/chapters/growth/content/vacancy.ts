import { defineContent } from '../../content-schema'
import { T3 } from '../../../sources'

export default defineContent({
  id: "vacancy", title: "Vacancy (V)", short: "A missing atom at a lattice site",
  layer: "lattice", parent: null, node: "vacancy", tabs: ["defects"], sources: [T3(21), T3(22)],
  what: "A lattice site with no atom.",
  made: "Forms thermally: the crystal's free energy is lowest with a finite number of vacancies.",
  does: "Equilibrium concentration CV0* ≈ 9 × 10²³ exp(−2.6 eV/kT) cm⁻³: about zero at room temperature, ~10¹³ cm⁻³ at 1000 °C. Vacancies help dopants move.",
})
