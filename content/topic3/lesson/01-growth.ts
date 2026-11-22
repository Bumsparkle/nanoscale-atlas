import { T3 } from '../../../src/sources'
import type { LessonSectionSchema } from '../../../src/learn/schema'
import type { z } from 'zod'

/**
 * Chapter 2: From sand to wafer (Topic 3). Ten sections; the checks are
 * questions from content/topic3/questions (they join the bank there).
 */
type S = z.input<typeof LessonSectionSchema>
const f = (...n: string[]) => n.map((x) => `t3-${x}`)
const q = (...n: string[]) => n.map((x) => `q-t3-${x}`)
export const questions: unknown[] = []

export const sections: S[] = [
  {
    id: 'g-crystal', title: 'Crystals and unit cells',
    intro: 'Topic 3 starts from the material itself: how silicon atoms stack into a crystal, and why that particular stacking matters for everything built on it.',
    steps: [
      {
        id: 'g-cells', title: 'A box that fills space', scene: { layer: 'lattice', tab: 'cells', crystal: { cell: 'sc', offset: 0 } }, sources: [T3(1), T3(2), T3(3), T3(4)],
        factIds: f('s01-topic', 's02-aims', 's03-synopsis', 's04-unit-cell', 's04-basic'),
        text: 'This chapter covers silicon itself: its crystal, its electronic bands, how it is grown and refined, its defects, and the basic fabrication flow. A crystal is described by one small cube of side a, the unit cell, copied over and over along x, y and z until it fills space. The simplest cell has an atom at each of its eight corners. Adding atoms elsewhere in the box gives the other cubic families: one more atom exactly in the middle of the cube, or one more in the middle of each of the six faces.',
        example: { kind: 'demo', text: 'Switch between the three cubic cells and watch where the extra atoms appear.' },
        checks: q('bcc'),
      },
      {
        id: 'g-diamond', title: 'Two cells merged', scene: { layer: 'lattice', tab: 'cells', crystal: { cell: 'fcc', offset: 0 } }, sources: [T3(5)],
        factIds: f('s05-diamond', 's05-tetra', 's05-table', 's05-compounds'),
        related: ['silicon-bonds'],
        text: 'Silicon is not one of the three simple cubes. Take a face-centred cube, make an identical copy, and shift the copy a quarter of the cell edge along all three axes at once. Each moved atom now sits in the middle of four atoms of the first cube, at the corners of a tetrahedron: four neighbours for an element from group IV, the column with C, Ge, Sn and Pb. The same arrangement, with two kinds of atom alternating, gives compound semiconductors such as GaAs and InP, and mixtures of three or four elements.',
        example: { kind: 'demo', text: 'Choose diamond and drag the slider: the amber cell slides in along the body diagonal until every amber atom has four bonds.' },
        checks: q('diamond'),
      },
      {
        id: 'g-bond', title: 'How long is a bond?', scene: { layer: 'lattice', tab: 'cells', crystal: { cell: 'diamond', offset: 1 } }, sources: [T3(5)],
        factIds: f('s05-bond'),
        text: 'Once the two cells have merged you can read the bond length off the geometry. The neighbour of a corner atom sits at (¼, ¼, ¼) of the cell, a quarter of the way along the cube’s body diagonal. A body diagonal is √3 times the edge. Silicon’s cell edge is a = 0.543 nm. Be careful with the ball-and-stick drawing on slide 5: its bond label belongs to diamond, the carbon crystal, whose atoms are smaller.',
        checks: q('bond'),
      },
    ],
    review: q('s04-unit-cell', 's05-compounds', 's05-tetra'),
  },
  {
    id: 'g-miller', title: 'Miller indices',
    intro: 'Wafers are cut along particular crystal planes, and etching, oxidation and even transistor speed depend on which plane faces up. Miller indices are the names of those planes.',
    steps: [
      {
        id: 'g-miller-name', title: 'Naming a plane', scene: { layer: 'lattice', tab: 'miller', crystal: { hkl: [1, 0, 0] } }, sources: [T3(6)],
        factIds: f('s06-miller', 's06-notation'),
        text: 'Find where the plane cuts the three axes, in units of the cell edge. Take one over each intercept; a plane that never meets an axis has an intercept at infinity and so a zero. Multiply through by the smallest number that clears every fraction. The three whole numbers, written in round brackets, name the plane. Square brackets are kept for directions, so the two are never confused on paper.',
        example: { kind: 'worked', text: 'Intercepts 1, 1, ∞: reciprocals 1, 1, 0, so the plane is (110). Intercepts 2, 2, 2 give ½, ½, ½, which clears to (111).' },
        checks: q('miller-gen'),
      },
      {
        id: 'g-miller-dir', title: 'Directions and normals', scene: { layer: 'lattice', tab: 'miller', crystal: { hkl: [1, 0, 0] } }, sources: [T3(6)],
        factIds: f('s06-direction', 's06-diagram'),
        text: 'A direction is just a vector: h steps along x, k along y, l along z. In a cubic crystal there is a handy coincidence: the direction with the same three numbers as a plane is the plane’s normal, sticking straight out of it. Slide 6 draws three standard planes: a cube face, a plane through two opposite edges running parallel to z, and a triangle cutting all three axes.',
        example: { kind: 'demo', text: 'Type different h, k and l: the amber arrow is the normal, and the atoms in the plane light up.' },
        checks: q('m110'),
      },
      {
        id: 'g-miller-density', title: 'Planes are not equal', scene: { layer: 'lattice', tab: 'miller', crystal: { hkl: [1, 1, 0] } }, sources: [T3(6)],
        factIds: f('s06-density'),
        text: 'Count the atoms that lie in a plane and divide by its area: different planes come out differently packed. That matters in processing, because how fast a surface oxidises or etches depends on how many bonds it presents. The panel gives the count in atoms per a² and per cm² for whatever plane you type.',
        checks: q('density'),
      },
    ],
    review: q('m111', 'miller-210', 's06-notation', 's04-basic'),
  },
  {
    id: 'g-bands', title: 'From atoms to bands',
    intro: 'Why is silicon a semiconductor? Bring isolated atoms together and watch their sharp energy levels turn into bands with a gap between them.',
    steps: [
      {
        id: 'g-bands-atoms', title: 'Isolated atoms', scene: { layer: 'lattice', tab: 'bands', crystal: { r: 2.8 } }, sources: [T3(7), T3(9)],
        factIds: f('s07-orbitals', 's07-levels', 's07-cloud', 's09-far'),
        text: 'Around a single atom the electrons sit in orbitals with characteristic shapes, s, p, d and f, and each orbital has a sharp energy. The fuzzy region where an electron will probably be found is called its electron cloud. Energies climb from the innermost 1s through 2s and 2p to the outer 3s and 3p of silicon. While the atoms are far apart their clouds do not overlap.',
        example: { kind: 'demo', text: 'Drag the spacing all the way out: the blue clouds separate and the chart shows flat lines.' },
        checks: q('far'),
      },
      {
        id: 'g-bands-split', title: 'Levels split', scene: { layer: 'lattice', tab: 'bands', crystal: { r: 2.8 } }, sources: [T3(8), T3(9)],
        factIds: f('s08-solid', 's08-pauli', 's08-bands', 's08-unique', 's08-diagram', 's09-c', 's09-bc'),
        text: 'Push N atoms closer. At a spacing slide 9 calls c the outer clouds start to overlap, and the outer electrons of neighbours feel each other. Interacting electrons are not allowed to sit in identical quantum states, so each atomic level becomes N slightly different levels, packed so closely that they form a continuous range of energies. Every material ends up with its own pattern of these ranges.',
        example: { kind: 'demo', text: 'Drag from d towards c and b: the lines fan out into shaded ranges.' },
        checks: q('pauli'),
      },
      {
        id: 'g-bands-merge', title: 'The ranges meet', scene: { layer: 'lattice', tab: 'bands', crystal: { r: 1.8 } }, sources: [T3(9)],
        factIds: f('s09-b', 's09-inner'),
        text: 'Keep pushing. The 3s range widens upwards and the 3p range downwards until, at spacing b, the space between them closes completely. Count the states: two s-states and six p-states per atom. The deep inner levels hardly change at all, because those electrons stay close to their own nucleus.',
        checks: q('merge'),
      },
      {
        id: 'g-bands-gap', title: 'A gap at the crystal spacing', scene: { layer: 'lattice', tab: 'bands', crystal: { r: 1.4 } }, sources: [T3(9)],
        factIds: f('s09-a', 's09-names'),
        text: 'Closer than b, the merged range re-splits into two halves of equal size, and an energy range with no states at all opens between them. At silicon’s real spacing, a, the four valence electrons of every atom exactly fill the lower half; the upper half is empty. The full lower range holds the bonding electrons; the empty upper one is where electrons can move freely once they get there.',
        checks: q('gap'),
      },
      {
        id: 'g-bands-solids', title: 'Metal, semiconductor, insulator', scene: { layer: 'lattice', tab: 'bands', crystal: { r: 1 } }, sources: [T3(10)],
        factIds: f('s10-insulator', 's10-metal', 's10-semi', 's10-diagram'),
        text: 'A current needs electrons that can move into empty states at almost the same energy. A partly filled band offers them. A band that is completely full offers none, and neither does an empty one, like liquid in a bottle that is either full or empty. So what matters is the filling and the size of the gap between the top full band and the next empty one: the strip under the chart compares the three cases.',
        checks: q('insulator'),
      },
    ],
    review: q('metal', 'semi', 's09-b', 's06-density'),
  },
  {
    id: 'g-carriers', title: 'Carriers, dopants and the junction',
    intro: 'Pure silicon conducts badly. Dopants change that by orders of magnitude, and a junction between two dopant types is in almost every device.',
    steps: [
      {
        id: 'g-carriers-intrinsic', title: 'Intrinsic and extrinsic', scene: { layer: 'lattice', tab: 'structure', lattice: { structure: 'crystal', dopant: 'P' } }, sources: [T3(11)],
        factIds: f('s11-intrinsic', 's11-extrinsic', 's11-eg', 's11-thermal', 's11-field', 's11-donor'),
        text: 'A semiconductor with no significant dopant is called intrinsic, or i-type: its only carriers are electrons excited across the gap, each leaving a hole behind, spread within about 2kBT of the band edges. In a field they drift opposite ways. A doped semiconductor is extrinsic: a donor adds a level just under the conduction-band edge, Ec, and the electrons it releases outnumber the holes enormously. The gap is the distance from the top of the valence band, Ev, to Ec.',
        checks: q('intrinsic', 'eg'),
      },
      {
        id: 'g-carriers-dopants', title: 'Donors and acceptors', scene: { layer: 'lattice', tab: 'structure', lattice: { structure: 'crystal', dopant: 'none' } }, sources: [T3(12)],
        factIds: f('s12-dopants', 's12-orders', 's12-donors', 's12-acceptors', 's12-diagram'),
        related: ['silicon-dopants'],
        text: 'Doping means adding specially chosen impurities in carefully predetermined amounts. An atom with five valence electrons uses four in bonds and gives up the fifth easily: a donor. One with three leaves a bond short of an electron, a hole that wanders off: an acceptor. Slide 12 has a slip here, listing boron with the five-electron atoms; boron has three. The change in conductivity is enormous.',
        checks: q('acceptor', 'orders'),
      },
      {
        id: 'g-carriers-majority', title: 'Majority and minority', scene: { layer: 'lattice', tab: 'structure', lattice: { structure: 'crystal', dopant: 'none' } }, sources: [T3(12)],
        factIds: f('s12-minority', 's12-p-b'),
        text: 'The carrier that a dopant supplies vastly outnumbers the other kind, which is still present in small numbers from thermal generation. The plentiful carrier carries most of the current; the scarce one matters for junctions and leakage. In practice one element is the workhorse for each type in silicon processing: phosphorus for one, boron for the other.',
        checks: q('minority'),
      },
      {
        id: 'g-carriers-diode', title: 'The junction and the diode', scene: { layer: 'cell', view: 'logic', bench: { tab: 'junction', v: 0, ratio: 1 } }, sources: [T3(13), T3(14)],
        factIds: f('s13-nd', 's13-metallurgical', 's14-symbol', 's14-knee', 's14-reverse', 's14-everywhere'),
        related: ['junction-depletion', 'junction-diode'],
        text: 'Slide 13 repeats the junction of Chapter 1, with one slip: the ions uncovered on the n side are donors, so their density is Nd, not Na. Where the two types meet, at the metallurgical junction, a charged layer forms. Slide 14 adds the circuit view. The triangle in the symbol points from the p side, the anode, to the n side, the cathode, the way conventional current flows. In the forward direction current stays tiny until a knee voltage, then climbs steeply; in reverse only a small leakage flows until breakdown.',
        checks: q('forward', 'knee'),
      },
    ],
    review: q('nd', 's14-reverse', 's10-semi'),
  },
  {
    id: 'g-refining', title: 'From sand to a crystal puller',
    intro: 'Every wafer starts as quartz sand. Three chemical steps purify it to parts per billion, and a crystal puller turns the result into one single crystal.',
    steps: [
      {
        id: 'g-refine-steps', title: 'Three steps to pure silicon', scene: { layer: 'sand' }, sources: [T3(15), T3(16)],
        factIds: f('s15-mgs', 's15-tcs', 's15-siemens', 's15-two', 's16-raw'),
        text: 'Quartz is silicon dioxide. Heated with carbon in an arc furnace it gives metallurgical-grade silicon, about 98 % pure, with the carbon leaving as a gas (slide 15 writes CO₂; at that temperature it is mostly CO). That metal is reacted with hydrogen chloride into trichlorosilane, which can be distilled like a liquid fuel. Finally the purified gas is reduced back to silicon on hot rods in the Siemens reactor. The result is polycrystalline: many grains. Two methods turn it into a single crystal.',
        example: { kind: 'demo', text: 'Click the sand and the grey lump beside it, then scroll in to the Siemens reactor.' },
        checks: q('mgs', 'tcs'),
      },
      {
        id: 'g-refine-purity', title: 'How pure?', scene: { layer: 'polysilicon' }, sources: [T3(16)],
        factIds: f('s16-purity'),
        text: 'The polysilicon that charges the crucible is extraordinarily clean: below one part per billion of most impurities. Two light elements are the exception and are counted in atoms per cubic centimetre instead: oxygen at around 10¹⁸ and carbon at around 10¹⁶. Remember the oxygen: Chapter 3 turns it into a tool.',
        checks: q('purity'),
      },
      {
        id: 'g-refine-cz', title: 'The Czochralski puller', scene: { layer: 'puller', tab: 'fz' }, sources: [T3(16)],
        factIds: f('s16-melt', 's16-params', 's16-all', 's16-diagram', 's16-sequence'),
        text: 'The polysilicon is melted in a quartz crucible, heated by a carbon element inside a water-cooled jacket, and held just above silicon’s melting point. A small single-crystal seed is dipped into the melt, drawn up into a thin neck, then allowed to widen into a shoulder and the full diameter. Three settings control the crystal: how fast it is pulled, how hot the melt is, and how fast it turns. This method makes essentially all IC wafers.',
        example: { kind: 'demo', text: 'Switch between the two growth methods, then watch the seed turn one way and the crucible the other.' },
        checks: q('cz-tab', 'melt-k'),
      },
    ],
    review: q('siemens', 'raw', 'params', 's12-p-b'),
  },
  {
    id: 'g-segregation', title: 'Dopant along the ingot',
    intro: 'Doping the melt does not dope the crystal evenly. One coefficient and one equation explain why the tail of every ingot is different from its seed end.',
    steps: [
      {
        id: 'g-seg-k0', title: 'The segregation coefficient', scene: { layer: 'puller', tab: 'cz', growth: { dopant: 'Sb', k0: 0.023, frac: 0.3 } }, sources: [T3(17)],
        factIds: f('s17-dopant', 's17-k0', 's17-table', 's17-diagram'),
        text: 'To dope a crystal, a known amount of dopant goes into the melt. At the freezing interface the solid accepts only a fraction of what the liquid holds: k0 is the ratio of the concentration that freezes in to the concentration in the liquid. Each element has its own value (slide 17’s table). The usual dopants for the two types lie near the top of the table for their column.',
        example: { kind: 'demo', text: 'Click through the dopant chips and watch k0 and the ingot colour change.' },
        checks: q('boron'),
      },
      {
        id: 'g-seg-derive', title: 'A dopant budget', scene: { layer: 'puller', tab: 'cz', growth: { dopant: 'P', k0: 0.35, frac: 0.2 } }, sources: [T3(18)],
        factIds: f('s18-defs', 's18-ds', 's18-cl', 's18-eq3'),
        text: 'Keep accounts of the dopant. Start with M0 grams of melt holding C0 grams of dopant per gram. After M grams of crystal have frozen, S grams of dopant are left in the M0 − M grams of liquid, so the liquid’s concentration is the ratio of those two. Freezing a little more crystal, dM, carries away Cs·dM of dopant, and Cs is k0 times the liquid concentration. That gives a small equation for how S changes.',
        checks: q('ds', 'cl'),
      },
      {
        id: 'g-seg-scheil', title: 'The ingot gets richer', scene: { layer: 'puller', tab: 'cz', growth: { dopant: 'P', k0: 0.35, frac: 0.5 } }, sources: [T3(17), T3(19)],
        factIds: f('s19-scheil', 's19-start', 's19-trend', 's19-uniform', 's19-graph', 's17-less', 's17-k0'),
        text: 'Integrating the budget gives Cs = k0·C0·(1 − M/M0)^(k0 − 1). Most dopants have k0 below one: they prefer the liquid, so the melt grows richer as the crystal grows and every new slice of crystal carries more dopant than the last. The very first slice, at the seed, freezes from the original melt. When k0 is close to one the doping hardly changes along the ingot; when it is tiny it rises steeply at the end.',
        example: { kind: 'demo', text: 'Drag k0 and the fraction pulled: the ingot’s colour and the dot on the graph follow the equation.' },
        checks: q('scheil-gen', 'seed-end'),
      },
      {
        id: 'g-seg-fz', title: 'Float zone', scene: { layer: 'puller', tab: 'fz', growth: { k0: 0.35, frac: 0.5, passes: 1 } }, sources: [T3(20)],
        factIds: f('s20-fz', 's20-refine', 's20-diagram'),
        text: 'The float-zone method has no crucible. A polycrystalline rod is held at both ends while an RF coil melts a short zone, held in place by surface tension, and moves it along the rod; single crystal grows behind it from a seed. Because impurities prefer the liquid, the travelling zone sweeps them towards the far end. Repeat the sweep and the rod gets cleaner each time, so the same machine can refine as well as grow.',
        checks: q('passes'),
      },
    ],
    review: q('less', 'k-gt-1', 'eq3', 's16-all'),
  },
  {
    id: 'g-defects', title: 'Defects, and ingot to wafer',
    intro: 'No crystal is perfect: point defects are always present and drive many process steps. Then the ingot is shaped and sliced into wafers.',
    steps: [
      {
        id: 'g-def-types', title: 'Kinds of defect', scene: { layer: 'lattice', tab: 'defects', crystal: { T: 1000 } }, sources: [T3(21)],
        factIds: f('s21-types', 's21-bad', 's21-point', 's21-impurity'),
        text: 'Crystals contain mistakes, some from growth and some made by processing. An empty lattice site and an extra atom squeezed between sites are point defects; a misfit extra line of atoms is a dislocation, an extra plane a stacking fault, a cluster of foreign material a precipitate. In general they harm devices, but the point defects matter most for processing: dopants diffuse by exchanging with them.',
        checks: q('vac'),
      },
      {
        id: 'g-def-model', title: 'How many point defects?', scene: { layer: 'lattice', tab: 'defects', crystal: { T: 25 } }, sources: [T3(22)],
        factIds: f('s22-free', 's22-unequal', 's22-kinetics', 's22-cv', 's22-ci', 's22-values'),
        text: 'A perfect crystal is not the lowest free-energy state: some disorder pays for itself, so a finite number of point defects exists in equilibrium. Each kind follows an Arrhenius law with its own prefactor and activation energy (slide 22), so the two populations differ and both rise steeply with temperature. In a real wafer, how fast defects form and disappear can matter more than the equilibrium value.',
        checks: q('cv-gen', 't1000'),
      },
      {
        id: 'g-def-wafers', title: 'From ingot to wafers', scene: { layer: 'ingot' }, sources: [T3(23)],
        factIds: f('s23-grind', 's23-saw', 's23-notch', 's23-batch'),
        text: 'The grown crystal still has its seed cone and tail. Those are cut off, the body is ground to an exact diameter, and a flat or notch is ground along its length to mark the crystal orientation. A thin blade with a diamond-coated hole cuts slices off the end. Each slice gets a laser-scribed number for tracking, and batches go through chemical baths in carriers.',
        checks: q('saw'),
      },
    ],
    review: q('int', 'ci-gen', 'ground', 's20-refine'),
  },
  {
    id: 'g-flow', title: 'The fab flow, epitaxy and oxidation',
    intro: 'The wafer enters the fab. Slide 24’s flow chart is the map; epitaxy and thermal oxidation are its first stops.',
    steps: [
      {
        id: 'g-flow-chart', title: 'The process flow', scene: { layer: 'wafer', tab: 'process', proc: { op: 'oxidation' } }, sources: [T3(24)],
        factIds: f('s24-flow', 's24-loop', 's24-epiready'),
        text: 'The wafer manufacturer delivers polished wafers ready for epitaxy. In the fab the same few modules repeat, layer after layer: grow an oxide, print a pattern into resist, etch the pattern into the film, then add dopants or a metal. Each pass ends by looping back for the next layer, until the finished wafer is diced and packaged.',
        example: { kind: 'demo', text: 'Click each box of the flow: it runs on the cross-section, and links to the same step in the Chapter 1 inverter.' },
        checks: q('flow-litho'),
      },
      {
        id: 'g-flow-cvd', title: 'Epitaxy by CVD', scene: { layer: 'wafer', tab: 'process', proc: { op: 'epitaxy', epi: 'mbe' } }, sources: [T3(25)],
        factIds: f('s25-cvd', 's25-precursor', 's25-use', 's25-conditions', 's25-steps'),
        related: ['gate-poly'],
        text: 'Epitaxy grows new crystal that continues the substrate’s lattice. In chemical vapour deposition a silicon-bearing gas flows over the hot wafer; molecules adsorb, move about, react, and leave their silicon in step with the crystal below while the by-products are pumped away. It runs hot for perfect crystallinity but well below the melting point, and the surface must be ultraclean, so it is cleaned in situ. Its usual job is a lightly doped layer on a heavily doped wafer.',
        checks: q('epi-cvd'),
      },
      {
        id: 'g-flow-mbe', title: 'Molecular beam epitaxy', scene: { layer: 'wafer', tab: 'process', proc: { op: 'epitaxy', epi: 'mbe' } }, sources: [T3(26)],
        factIds: f('s26-mbe', 's26-rheed', 's26-rate', 's26-diagram'),
        text: 'MBE fires beams of atoms from heated effusion cells at the substrate inside an ultra-high vacuum, so clean that a molecule crosses the chamber without hitting another. Growth is slow and exact, and an electron-diffraction gun watches the surface during growth (RHEED). It is the tool for atomically sharp layers of compound semiconductors.',
        checks: q('mbe-rate'),
      },
      {
        id: 'g-flow-ox', title: 'Thermal oxidation eats silicon', scene: { layer: 'wafer', tab: 'process', proc: { op: 'oxidation', ambient: 'dry', oxT: 1100, oxHours: 4 } }, sources: [T3(27)],
        factIds: f('s27-reactions', 's27-interface', 's27-consume', 's27-slows'),
        related: ['lithography-oxide'],
        text: 'Thermal oxide is not deposited: it is made from the wafer. Oxygen or water vapour diffuses through the oxide already there and reacts with silicon underneath, so the silicon is used up and the interface sinks while the top surface rises. As the oxide thickens, the oxidant has further to diffuse and growth slows: linear at first, then like the square root of time (the Deal–Grove model).',
        example: { kind: 'demo', text: 'The dashed amber line is the original silicon surface: the oxide straddles it.' },
        checks: q('si-gen', 'ox-where'),
      },
      {
        id: 'g-flow-drywet', title: 'Dry or wet', scene: { layer: 'wafer', tab: 'process', proc: { op: 'oxidation', ambient: 'dry' } }, sources: [T3(27)],
        factIds: f('s27-dry', 's27-wet'),
        text: 'The oxidant can be pure oxygen or steam. Water diffuses through oxide far more readily, so steam grows a thick isolation oxide in reasonable time, while oxygen grows slowly and evenly enough to control a film only a few nanometres thick, the kind under a transistor gate.',
        checks: q('wet'),
      },
    ],
    review: q('dry', 'slows', 'epi-use', 's23-saw'),
  },
  {
    id: 'g-pattern', title: 'Lithography and etching',
    intro: 'A pattern is printed in light-sensitive resist and transferred into the film beneath. The resist’s polarity and the etch’s direction decide what you get.',
    steps: [
      {
        id: 'g-pat-resist', title: 'Two kinds of resist', scene: { layer: 'wafer', tab: 'process', proc: { op: 'litho', tone: 'positive' } }, sources: [T3(28)],
        factIds: f('s28-resist', 's28-uv', 's28-positive', 's28-negative'),
        related: ['lithography-resist'],
        text: 'Photoresist is a polymer resin carrying a light-sensitive compound; what makes it useful is that ultraviolet light changes its chemistry. Resists come in two polarities. In one the light breaks the compound down so the exposed resist becomes soluble; in the other the light cross-links the resist so the exposed areas become insoluble. Chapter 1’s flow used the first kind.',
        checks: q('neg'),
      },
      {
        id: 'g-pat-develop', title: 'Develop: what stays', scene: { layer: 'wafer', tab: 'process', proc: { op: 'litho', tone: 'positive' } }, sources: [T3(28)],
        factIds: f('s28-develop', 's28-diagram'),
        text: 'The developer dissolves whatever is soluble. Slide 28 describes exposure as polymerising the resist and the developer as removing the unpolymerised part: that is true of only one polarity, so read it with care. With the same mask the two polarities give opposite patterns, which is why every mask is drawn for a known resist.',
        checks: q('neg-result'),
      },
      {
        id: 'g-pat-wet', title: 'Wet etching undercuts', scene: { layer: 'wafer', tab: 'process', proc: { op: 'etch', iso: false, lineUm: 2 } }, sources: [T3(29)],
        factIds: f('s29-selectivity', 's29-isotropic', 's29-size'),
        related: ['lithography-etch'],
        text: 'An etch should attack the film and leave everything else: hydrofluoric acid dissolves oxide but barely touches silicon. A liquid etch is chemical and has no preferred direction, so as it eats down it also eats sideways under the edge of the resist. On a wide line that bite hardly matters. Once the line width is comparable to the film thickness, the bites from both sides meet.',
        checks: q('iso'),
      },
      {
        id: 'g-pat-dry', title: 'Dry etching goes straight down', scene: { layer: 'wafer', tab: 'process', proc: { op: 'etch', iso: true, lineUm: 2 } }, sources: [T3(29)],
        factIds: f('s29-anisotropic', 's29-dry', 's29-diagram'),
        text: 'Modern processes etch with ions from a plasma, accelerated straight at the wafer: reactive ion etching. The bombardment is directional, so material is removed downward far faster than sideways and the walls come out vertical. Slide 29 contrasts three outcomes side by side.',
        checks: q('aniso'),
      },
    ],
    review: q('pos', 'narrow', 's29-selectivity', 's27-wet'),
  },
  {
    id: 'g-doping', title: 'Diffusion, implantation and metal',
    intro: 'Dopants go in by diffusion from a hot source or by firing ions; then the devices are wired with metal.',
    steps: [
      {
        id: 'g-dop-diff', title: 'Predeposition and drive-in', scene: { layer: 'wafer', tab: 'process', proc: { op: 'diffusion', dopant: 'B', driveMin: 60 } }, sources: [T3(30)],
        factIds: f('s30-predep', 's30-furnace', 's30-drive', 's30-temp', 's30-profile'),
        related: ['well-methods'],
        text: 'Diffusion doping has two stages in a quartz-tube furnace. First a dopant oxide reacts with the exposed silicon and leaves a thin, heavily doped skin. Then, with the source removed, the wafer is heated again so that skin spreads deeper and wider. The dopant spreads sideways as well as down, so it creeps under the edge of the masking oxide.',
        example: { kind: 'demo', text: 'Change the second stage’s time and temperature: the profile chart and the junction follow.' },
        checks: q('drive'),
      },
      {
        id: 'g-dop-arr', title: 'How fast dopants move', scene: { layer: 'wafer', tab: 'process', proc: { op: 'diffusion', dopant: 'B' } }, sources: [T3(30)],
        factIds: f('s30-arrhenius'),
        text: 'Dopant atoms hop between sites, helped by point defects, and every hop needs an energy Q. The fraction of attempts that succeed is a Boltzmann factor, so the diffusion constant grows exponentially with temperature: D = D0·exp(−Q/kT), with T in kelvin. A hundred degrees more can mean ten times faster diffusion.',
        example: { kind: 'worked', text: 'Boron: D0 = 0.76 cm²/s, Q = 3.46 eV. At 1000 °C, T = 1273 K and kT = 0.1097 eV, so Q/kT = 31.5 and D ≈ 1.5 × 10⁻¹⁴ cm²/s.' },
        checks: q('d-gen'),
      },
      {
        id: 'g-dop-imp', title: 'Ion implantation', scene: { layer: 'wafer', tab: 'process', proc: { op: 'implant', species: 'B', keV: 20 } }, sources: [T3(31)],
        factIds: f('s31-implant', 's31-energy', 's31-room', 's31-control', 's31-essential'),
        related: ['diffusion-self-aligned'],
        text: 'An implanter ionises the dopant, accelerates the ions through a high voltage, selects them and scans the beam over the wafer, which stays cool throughout. The beam current and time set exactly how many atoms go in; the acceleration sets how deep they stop. That control is why every modern fab depends on implanters.',
        checks: q('energy'),
      },
      {
        id: 'g-dop-anneal', title: 'The anneal', scene: { layer: 'wafer', tab: 'process', proc: { op: 'implant', annealed: false } }, sources: [T3(31)],
        factIds: f('s31-anneal'),
        text: 'Fast ions smash through the lattice and leave it badly damaged, and most dopant atoms come to rest between lattice sites where they do nothing electrically. A short high-temperature step lets the crystal regrow and moves the dopants onto lattice sites.',
        example: { kind: 'demo', text: 'The hatching on the cross-section is the damage; tick the box to heat the wafer.' },
        checks: q('anneal'),
      },
      {
        id: 'g-dop-metal', title: 'Metallization by evaporation', scene: { layer: 'wafer', tab: 'process', proc: { op: 'metal', metalNm: 300 } }, sources: [T3(32)],
        factIds: f('s32-metallization', 's32-evaporation', 's32-filament', 's32-choice', 's32-vacuum'),
        related: ['wiring-metal'],
        text: 'Finally the devices are connected into circuits. In thermal evaporation a pure metal is heated in a vacuum chamber until it vaporises; the vapour travels in straight lines and condenses on the cooler wafers held above. The source sits in a small container that is itself the heater, carrying a large current, so its material must survive the temperature without reacting with the metal it holds.',
        checks: q('filament'),
      },
    ],
    review: q('predep', 'dp-gen', 'evap', 's27-dry'),
  },
]
