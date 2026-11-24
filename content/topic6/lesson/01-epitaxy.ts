import { T6 } from '../../../src/sources'
import type { LessonSectionSchema } from '../../../src/learn/schema'
import type { z } from 'zod'

/**
 * Chapter 5: Atom by atom (Topic 6). Six sections: what epitaxy is,
 * lattice mismatch, silicon epitaxy and autodoping, MBE, RHEED, then SOI.
 */
type S = z.input<typeof LessonSectionSchema>
const f = (...n: string[]) => n.map((x) => `t6-${x}`)
const q = (...n: string[]) => n.map((x) => `q-t6-${x}`)
export const questions: unknown[] = []

const MODES = (mode = 'fvdm', coverage = 1.5) => ({ layer: 'surface' as const, tab: 'modes', epi: { mode, coverage } })
const STRAIN = (film = 'InAs', substrate = 'GaAs', thick = 1) => ({ layer: 'surface' as const, tab: 'strain', epi: { film, substrate, thick } })
const SIEPI = (epi: Record<string, unknown> = {}) => ({ layer: 'deposition' as const, tab: 'siepi', epi: { T: 1100, rate: 1, sub: 'As', seal: false, rp: false, ...epi } })
const MBE = (epi: Record<string, unknown> = {}) => ({ layer: 'mbe' as const, epi: { shutter: true, logGa: -3.5, ...epi } })
const SOI = (soi = 0) => ({ layer: 'wafer' as const, tab: 'soi', epi: { soi } })

export const sections: S[] = [
  {
    id: 'e-what', title: 'What epitaxy is',
    intro: 'Epitaxy grows a film that is a continuation of the crystal beneath it. Chapter 5 zooms from the reactor down to the atoms.',
    steps: [
      {
        id: 'e-uses', title: 'Crystal on crystal', scene: SIEPI(), sources: [T6(1), T6(2), T6(3)],
        factIds: f('s02-materials', 's03-uses'),
        text: 'Topic 6 is epitaxy. Almost every semiconductor can be grown this way: silicon; the III–V arsenides, phosphides, nitrides and antimonides such as GaAs, AlGaAs, InP, GaN and InSb; II–VI compounds such as ZnSe and CdTe; and silicon–germanium. In silicon chips an epitaxial layer gives a region whose doping is set independently of the wafer underneath. A bipolar transistor is built in a lightly doped layer that sits on top of a heavily doped one buried below it; CMOS wells sit in a lightly doped p layer on a heavily doped p⁺ wafer.',
        example: { kind: 'demo', text: 'The barrel reactor in front of you grows silicon epi; the inset slab shows a new layer on its substrate.' },
        checks: q('bipolar'),
      },
      {
        id: 'e-def', title: 'Same or different', scene: STRAIN('GaAs', 'Si', 5), sources: [T6(4)],
        factIds: f('s04-def', 's04-homo', 's04-hetero', 's04-fig'),
        text: 'The word comes from Greek for “arranged upon”: the film’s atoms take up the positions the substrate’s lattice dictates, so the crystal simply carries on. When film and substrate are the same material, silicon on silicon or gallium arsenide on gallium arsenide, it is homoepitaxy. When they differ, as with silicon on sapphire or silicon on silicon–germanium, it is heteroepitaxy. Slide 4 sketches the three outcomes: a matched layer, a relaxed layer with broken rows of bonds at the interface, and a strained layer.',
        example: { kind: 'demo', text: 'Pick a substrate in the panel and click materials on the chart to grow them.' },
        checks: q('homo'),
      },
      {
        id: 'e-stages', title: 'How atoms build a film', scene: MODES('fvdm', 0.3), sources: [T6(7), T6(8)],
        factIds: f('s07-steps', 's08-stages'),
        text: 'Growth only happens when the supply is supersaturated, the chemical potential of the solid lower than that of the gas. Then come the same kinds of step as in CVD: mass transport through the gas, reactions in the gas and on the surface, and finally the atoms finding their places. Slide 8 follows a single atom: it is deposited on a flat terrace, wanders across it, may meet others and nucleate an island, attach to an island or leave it again, slide along an island edge, or reach a step and join it.',
        example: { kind: 'demo', text: 'Watch the blue atom drifting over the surface.' },
        checks: q('stages'),
      },
      {
        id: 'e-modes', title: 'Three growth modes', scene: MODES('fvdm', 2), sources: [T6(9)],
        factIds: f('s09-modes'),
        text: 'How the film fills in depends on what the atoms prefer to bond to. In Frank–van der Merwe growth each layer completes before the next begins, the ideal for epitaxy. In Volmer–Weber growth atoms cluster into separate islands from the start. Stranski–Krastanov growth begins layer by layer, then, after a few layers, switches to islands; with strained materials those islands are small enough to trap electrons in all three directions.',
        example: { kind: 'demo', text: 'Choose a mode and slide the amount deposited from zero to four monolayers.' },
        checks: q('sk'),
      },
    ],
    review: q('sos', 'vw', 's02-materials'),
  },
  {
    id: 'e-mismatch', title: 'Lattice mismatch',
    intro: 'Heteroepitaxy only works if the two crystals nearly fit. This section uses the strain view: a film on a substrate, with the mismatch drawn four times larger than life.',
    steps: [
      {
        id: 'e-strain', title: 'Strained or relaxed', scene: STRAIN('InAs', 'GaAs', 1), sources: [T6(5)],
        factIds: f('s05-mismatch', 's05-modes'),
        text: 'A film whose natural spacing differs from the substrate’s has two choices. It can bend: every bond stays intact, the film is squeezed (or stretched) in the plane to match the substrate, and it bulges the other way perpendicular to it. That is pseudomorphic growth. Or it can give up: rows of bonds break at the interface, leaving misfit dislocations, and the film relaxes to its own spacing. That is metamorphic growth. The bigger the difference, the sooner the second happens, which is why the two lattice constants must be close.',
        example: { kind: 'demo', text: 'Drag the thickness slider for InAs on GaAs and watch the red dislocation markers appear.' },
        checks: q('relax'),
      },
      {
        id: 'e-chart', title: 'The bandgap chart', scene: STRAIN('InAs', 'GaAs', 5), sources: [T6(6)],
        factIds: f('s06-chart', 's06-matched'),
        text: 'Slide 6 plots each semiconductor’s bandgap against its lattice constant. Silicon sits at 5.43 Å and 1.1 eV; gallium arsenide at 5.65 Å and 1.42 eV, with germanium almost on top of it in spacing but at 0.66 eV; indium phosphide at 5.87 Å, 1.35 eV; indium arsenide at 6.06 Å, 0.36 eV; indium antimonide far out at 6.48 Å. Alloys lie on lines between their parents. A vertical line through a substrate picks out everything that fits it: aluminium compounds above gallium arsenide, and particular InGaAs and InAlAs mixtures above indium phosphide.',
        example: { kind: 'demo', text: 'The amber square is your film, the grey line your substrate; solid outlines are direct-gap materials.' },
        checks: q('match-gaas', 'mis'),
      },
      {
        id: 'e-mobility', title: 'Strain as a tool', scene: STRAIN('Si', 'Ge', 1), sources: [T6(15), T6(16)],
        factIds: f('s15-sige', 's15-mobility', 's16-strained'),
        text: 'Strain is not always a defect. Silicon grown on a layer containing germanium is pulled apart to match it, and that distortion changes its band structure so electrons move more easily: the effective mobility of NMOS transistors rises with the germanium content of the substrate, from 10 % to 20 % and beyond. Slide 15 also compares electron mobilities at room temperature, from about 1 400 cm²/V·s in silicon up through gallium arsenide and indium arsenide to about 80 000 in indium antimonide. Intel’s strained-silicon transistor had a 0.05 µm gate on a 1.2 nm oxide, with silicide on the gate.',
        checks: q('strained-si'),
      },
    ],
    review: q('mob', 's04-fig', 's05-modes'),
  },
  {
    id: 'e-si', title: 'Silicon epitaxy',
    intro: 'Back up to the reactor. Silicon epitaxy is high-temperature CVD, and its main problem is dopant going where it should not.',
    steps: [
      {
        id: 'e-reactor', title: 'Sources and reactor', scene: SIEPI(), sources: [T6(10), T6(11)],
        factIds: f('s10-gases', 's11-tcs', 's11-conditions', 's11-reactor'),
        text: 'Silicon epi grows from silane, which simply decomposes on heating, or from the chlorosilanes, dichlorosilane, trichlorosilane and silicon tetrachloride, which are reduced by hydrogen; disilane is another option. Phosphine, arsine and diborane supply dopants. A typical process flows 5–50 litres of gas a minute at 900–1100 °C and from 100 Torr up to atmospheric pressure. In a barrel reactor the wafers stand on the faces of a many-sided graphite block heated by quartz lamps; gas enters at the top and leaves at the bottom, hydrogen chloride etches the surface clean first, and argon, hydrogen and nitrogen purge.',
        example: { kind: 'demo', text: 'Drag the temperature and growth rate; the chart shows the doping profile they give.' },
        checks: q('barrel'),
      },
      {
        id: 'e-why', title: 'Why grow it at all', scene: SIEPI(), sources: [T6(12)],
        factIds: f('s12-profile'),
        text: 'Diffusion and implantation can only add dopant. They make a region more heavily doped, and so less resistive, than the wafer below. Many devices need the opposite: a lightly doped layer, say 3 Ω·cm, at the surface of a heavily doped, 0.01 Ω·cm wafer. No amount of diffusion can take dopant away, so the lightly doped region has to be added as new crystal on top.',
        checks: q('whyepi'),
      },
      {
        id: 'e-auto', title: 'Doping and autodoping', scene: SIEPI(), sources: [T6(13)],
        factIds: f('s13-intentional', 's13-ranges', 's13-autodoping', 's13-graph'),
        text: 'Dopant gas is added on purpose to set the layer’s level, but the amount taken up is not simply proportional to the amount in the gas, and dopants change how fast silicon grows. Boron can be set from 10¹⁶ to 10¹⁹ cm⁻³, arsenic and phosphorus from 10¹⁶ to 10²⁰ cm⁻³. Unwanted dopant also arrives: it diffuses up out of a heavily doped wafer through the solid, and it evaporates from the wafer’s back and edges into the gas and is grown back in. The profile falls steeply from the substrate, then flattens into a long shoulder before reaching the intended level.',
        checks: q('autodope'),
      },
      {
        id: 'e-min', title: 'Keeping it sharp', scene: SIEPI(), sources: [T6(14)],
        factIds: f('s14-minimise', 's14-diffusivity'),
        text: 'Slide 14 lists the remedies. Grow fast, so the dopant has less time to escape. Grow cool, which helps for boron, though not for arsenic. Cover the back of the wafer with lightly doped polysilicon or a low-temperature oxide so its dopant cannot reach the gas. Avoid chlorinated sources, whose HCl etches dopant free, and grow at reduced pressure, so evaporated dopant is pumped away. Choose a slow diffuser for the buried layer: arsenic and antimony move least, boron, phosphorus and indium most.',
        example: { kind: 'demo', text: 'Tick the options in the panel one at a time and watch the transition width shrink.' },
        checks: q('seal'),
      },
    ],
    review: q('tcs', 'epi-t', 'range', 's06-matched'),
  },
  {
    id: 'e-mbe', title: 'Molecular beam epitaxy',
    intro: 'Step through the door into the MBE chamber: a steel sphere at the best vacuum on Earth, with furnaces aimed at a spinning wafer.',
    steps: [
      {
        id: 'e-uhv', title: 'Ultra-high vacuum', scene: MBE(), sources: [T6(17), T6(18)],
        factIds: f('s17-mbe', 's17-cake', 's18-req'),
        text: 'MBE is evaporation done with extreme care. The chamber is pumped below 10⁻¹³ bar, with cryopumps and liquid-nitrogen-cooled panels freezing out stray gas. Ultra-pure elements, gallium and arsenic at seven nines, are heated until they sublimate and condense on the wafer. “Beam” means the atoms cross without colliding, which needs the pressure below 10⁻⁴ Torr. But a far better vacuum, below 10⁻⁹ Torr, is needed so the growing surface is not covered by stray gas before the next layer arrives. Layers a few atoms thick are stacked, much like a many-layered cake.',
        checks: q('uhv'),
      },
      {
        id: 'e-chamber', title: 'The growth chamber', scene: MBE(), sources: [T6(19), T6(20)],
        factIds: f('s19-chamber', 's20-system'),
        text: 'Inside the chamber several small furnaces, each holding one element, point up at the wafer. A flap in front of each opens and closes its beam. The wafer is held on a heated block that rotates so all parts of it see the same flux. A grazing electron gun on one side and a phosphor screen opposite watch the surface, and an ion gauge measures the beam pressure. A complete system adds a chamber for loading wafers and one for analysing them, with a transfer rod between.',
        example: { kind: 'demo', text: 'Orbit the chamber: four cells below, the RHEED gun and screen on either side.' },
        checks: q('cell'),
      },
      {
        id: 'e-principles', title: 'Shutters and cells', scene: MBE(), sources: [T6(21), T6(22)],
        factIds: f('s21-principles', 's22-chars'),
        text: 'Arriving atoms roam the warm surface until they find a site to bond to. The beam strength is set by each cell’s temperature, and the flaps switch beams on and off in a fraction of a second. Growth is slow, around a micron an hour, and the wafer is fairly cool, so thicknesses are controlled atom by atom, interfaces are one layer sharp, and dopants hardly diffuse. The downside is cost: the equipment is expensive and the throughput small.',
        example: { kind: 'demo', text: 'Close and open the Ga shutter from the panel and watch the beam and the monolayer count.' },
        checks: q('shutter'),
      },
      {
        id: 'e-flux', title: 'How many atoms arrive', scene: MBE(), sources: [T6(23)],
        factIds: f('s23-flux', 's23-rate'),
        text: 'Kinetic theory gives the rate at which molecules strike a surface from a gas at pressure P: φ = P(2πmkT)^(−1/2), which in practical units is 2.64 × 10²⁰ · P/√(MT) molecules per cm² per second, with P in pascals, M the molecular weight and T in kelvin. From a cell with aperture A at distance L, the growth rate is φ·(A/πL²) multiplied by the thickness of one monolayer and divided by the surface density of the atoms that control growth.',
        checks: q('flux'),
      },
    ],
    review: q('sharp', 'aperture', 'slow-diff'),
  },
  {
    id: 'e-rheed', title: 'Watching it grow',
    intro: 'MBE can be watched layer by layer while it happens. The green screen on the chamber wall is how.',
    steps: [
      {
        id: 'e-rheed-what', title: 'Electrons at a glancing angle', scene: MBE(), sources: [T6(24)],
        factIds: f('s24-rheed'),
        text: 'Reflection high-energy electron diffraction fires a beam of fast electrons at the wafer at a very shallow angle, a degree or two. At that angle they skim the top atomic layers only, so what comes off describes the surface and not the bulk. The ordered rows of surface atoms diffract the electrons into a pattern of streaks on a phosphor screen on the far side of the chamber. A smooth surface gives sharp, bright streaks; a rough one gives dim spots.',
        example: { kind: 'demo', text: 'Watch the streaks on the screen brighten and fade while the shutter is open.' },
        checks: q('screen'),
      },
      {
        id: 'e-osc', title: 'Counting layers', scene: MBE(), sources: [T6(25)],
        factIds: f('s25-osc'),
        text: 'As a new layer starts, islands scatter the beam and the specular spot dims; as they merge into a complete layer the surface is smooth again and it recovers. So the brightness rises and falls once for every layer: brightest when the coverage θ is a whole number, darkest at θ = ½. Count the oscillations and you count monolayers; time them and you have the growth rate directly. For a zinc-blende crystal grown on (001), one monolayer is half the lattice constant thick.',
        example: { kind: 'demo', text: 'The trace in the panel is the intensity in real time; change the Ga beam and the period changes.' },
        checks: q('rheed'),
      },
      {
        id: 'e-sl', title: 'Superlattices', scene: MBE(), sources: [T6(27)],
        factIds: f('s27-superlattice'),
        text: 'With beams that switch in an instant and layers counted one by one, MBE can build structures no other method can. Slide 27 is a transmission electron microscope image of a superlattice: two compounds stacked in a regular repeat, each block exactly fifteen monolayers, with interfaces sharp to a single atomic plane. Such stacks make quantum wells, lasers and high-electron-mobility transistors.',
        checks: q('sl'),
      },
    ],
    review: q('half', 's23-rate', 's24-rheed'),
  },
  {
    id: 'e-soi', title: 'Silicon on insulator',
    intro: 'The last slides put a thin silicon layer on glass. Zoom back to the wafer level: the cross-section steps through how it is made.',
    steps: [
      {
        id: 'e-soi-why', title: 'Why SOI', scene: SOI(5), sources: [T6(28)],
        factIds: f('s28-soi', 's28-makers'),
        text: 'In silicon on insulator the transistors are built in a thin film of silicon lying on a buried layer of oxide. The heavily doped source and drain regions, the “bathtubs”, go all the way down to the oxide, so the large junction area between them and the silicon underneath simply disappears, and with it most of the capacitance that slows switching. Soitec makes such wafers with its smart-cut process. IBM’s alternative, SIMOX, gets its name from separation by implantation of oxygen.',
        checks: q('bathtub'),
      },
      {
        id: 'e-cut', title: 'Smart cut', scene: SOI(0), sources: [T6(29)],
        factIds: f('s29-smartcut'),
        text: 'Smart cut starts with an ordinary silicon wafer and oxidises it, giving the buried oxide its high-quality interface. Hydrogen ions are implanted through the oxide to a set depth. The wafer is turned over and bonded to a second, handle wafer. Heating makes the hydrogen gather into tiny blisters, and the wafer splits cleanly along that plane, mechanically or by heat. A final anneal drives the hydrogen out and a polish smooths the new surface; the leftover piece of the first wafer can be used again.',
        example: { kind: 'demo', text: 'Step through the process with the panel buttons.' },
        checks: q('split'),
      },
      {
        id: 'e-tem', title: 'The result', scene: SOI(5), sources: [T6(30), T6(31)],
        factIds: f('s30-tem', 's31-cmos'),
        text: 'Slide 30 is a cross-sectional electron micrograph of a Soitec wafer: 205 nm of silicon on 400 nm of oxide over the bulk. Slide 31 compares the two kinds of CMOS. In bulk silicon each transistor sits in a well, p- or n-type, over a heavily doped buried layer in the substrate, and the wells are separated only by junctions. In SOI each transistor sits on its own island of silicon, cut off below by oxide and beside it by trench isolation.',
        checks: q('box'),
      },
    ],
    review: q('simox', 's25-osc', 's29-smartcut'),
  },
]
