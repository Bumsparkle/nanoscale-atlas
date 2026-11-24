import { T3, T6, T8 } from '../../../src/sources'
import type { LessonSectionSchema } from '../../../src/learn/schema'
import type { z } from 'zod'
import { ALIGN, BANDS, CONFINE, DOS, FAB, FREE, QMBE, SCALE, TEM, WELL } from '../scenes'

/**
 * Chapter 7: Quantum structures (Topic 8). Eight sections: the nanoscale,
 * waves with walls, quantum wells, heterostructures, wires and dots, how
 * they are made, the density of states, and why quantum dots make better
 * lasers.
 */
type S = z.input<typeof LessonSectionSchema>
const f = (...n: string[]) => n.map((x) => `t8-${x}`)
const q = (...n: string[]) => n.map((x) => `q-t8-${x}`)
export const questions: unknown[] = []

export const sections: S[] = [
  {
    id: 'l8-nano', title: 'The nanoscale',
    intro: 'Where does “nano” start, and why should size change what a material does? Start with a ruler that runs from a tennis ball to a water molecule.',
    steps: [
      {
        id: 'l8-define', title: 'Nanotechnology', scene: SCALE({ logSize: -6 }), sources: [T8(1), T8(2)],
        factIds: f('s01-topic', 's02-nano', 's02-differ'),
        text: 'Topic 8 is about III–V semiconductor nanostructures. Nanotechnology is the understanding and control of matter on a scale from about one to a hundred nanometres, because in that window materials stop behaving like either single atoms or the everyday objects we handle: their physical, chemical and biological properties take on values of their own, and that is what new devices exploit.',
        example: { kind: 'demo', text: 'Drag the size slider and watch the regime readout change.' },
        checks: q('nano'),
      },
      {
        id: 'l8-ruler', title: 'Ten orders of magnitude', scene: SCALE({ logSize: -8 }), sources: [T8(2)],
        factIds: f('s02-scale'),
        text: 'Slide 2 lines up familiar things on a logarithmic axis in nanometres. A water molecule is a tenth of a nanometre, glucose about one, an antibody about ten; bacteria are around a micrometre and a cell ten; a full stop on a page is a millimetre, a tennis ball a tenth of a metre. Nanodevices such as nanotubes, dendrimers, nanoshells and quantum dots sit among the biological molecules.',
        example: { kind: 'demo', text: 'Each object sits at its size on the axis; the amber band is the nanotechnology range.' },
        checks: q('virus'),
      },
      {
        id: 'l8-regimes', title: 'Bands, light and electron waves', scene: SCALE({ logSize: -2 }), sources: [T8(3), T3(8)],
        factIds: f('s03-sizes', 's03-bands'),
        text: 'For a semiconductor, size decides which physics rules. A centimetre-sized crystal has continuous bands. A micrometre structure guides light, whose wavelength is about that size. Shrink it to around ten nanometres and the electrons themselves, whose room-temperature wavelength is about that long, feel the walls; the bands break up into separate levels as in an atom, which is the last stop at about an ångström.',
        example: { kind: 'demo', text: 'Move from 1 cm down to 1 Å and read what governs each size.' },
        checks: q('qdsize'),
      },
    ],
    review: q('sample', 's02-scale', 's03-sizes'),
  },
  {
    id: 'l8-waves', title: 'Waves with walls',
    intro: 'Solve the Schrödinger equation twice: with no walls, then inside an infinite well. Out of the boundary conditions come discrete levels and their wavefunctions.',
    steps: [
      {
        id: 'l8-free', title: 'The free electron', scene: FREE({ k: 0.5 }), sources: [T8(4), T8(5)],
        factIds: f('s04-tise', 's04-1d', 's05-free'),
        text: 'Write the wavefunction as a spatial part times e^(−iEt/ħ). The spatial part obeys ∇²ψ + (2m/ħ²)(E − V)ψ = 0, in one dimension d²ψ/dx² + (2m/ħ²)(E − V)ψ = 0, with E the total energy and V the potential. Set V to zero and a plane wave Ae^(ikx) solves it with k = √(2mE/ħ²): the energy rises as the square of the wavevector, with no restriction on k.',
        example: { kind: 'worked', text: 'With ħ²/2m₀ = 38.1 meV·nm², a free electron with k = 1 nm⁻¹ has 38 meV.' },
        checks: q('free', 'free-e'),
      },
      {
        id: 'l8-walls', title: 'An infinite well', scene: WELL({ level: 1 }), sources: [T8(6), T8(7)],
        factIds: f('s06-well', 's06-general', 's07-bc'),
        text: 'Now put the electron in a box: no potential between x = 0 and L, an infinite one outside, so it can never leave. Inside, the equation is the free one, and its general solution can be written as a sine plus a cosine of kx. The walls demand that ψ vanish at both edges. (The slide calls these “bonding conditions”; they are boundary conditions.) Only certain k survive both: kL must be a whole multiple of π.',
        example: { kind: 'demo', text: 'Each curve on the level is one allowed standing wave.' },
        checks: q('general'),
      },
      {
        id: 'l8-levels', title: 'Discrete energy levels', scene: WELL({ m: 1, L: 10 }), sources: [T8(7), T8(8)],
        factIds: f('s07-levels', 's08-plot'),
        text: 'With k = nπ/L the wavefunctions are sin(nπx/L) and the energies are n²π²ħ²/(2mL²): they grow as the square of n and fall as the square of the width. Slide 8 plots the first five for a 10 nm well and the bare electron mass, a few meV up to nearly a hundred. Each wavefunction has n − 1 nodes inside the well, and its square, the probability density, has n humps.',
        example: { kind: 'demo', text: 'Switch between ψ and |ψ|² and pick a level.' },
        checks: q('well-e', 'nodes'),
      },
      {
        id: 'l8-norm', title: 'Normalising ψ', scene: WELL({ prob: true }), sources: [T8(7)],
        factIds: f('s07-norm'),
        text: 'The particle must be somewhere in the well, so the integral of |ψ|² from 0 to L must equal one. Rewrite sin² as ½(1 − cos 2θ): the cosine term goes through whole periods and integrates to zero, leaving half the width. Setting A² times that half-width equal to one fixes the amplitude, the same for every n.',
        example: { kind: 'demo', text: 'Under |ψ|² each curve encloses the same area, whatever n.' },
        checks: q('norm'),
      },
    ],
    review: q('well', 'bc', 's02-nano'),
  },
  {
    id: 'l8-qw', title: 'Quantum wells',
    intro: 'A real well is a thin layer of narrow-gap semiconductor between wider-gap ones. Its walls are finite, which changes the levels in predictable ways.',
    steps: [
      {
        id: 'l8-qwell', title: 'Confined to a plane', scene: WELL({ m: 0.067, L: 10 }), sources: [T8(9)],
        factIds: f('s09-qw', 's09-dbw', 's09-figure'),
        text: 'Grow a 5 nm layer of B between thick layers of A, where B has the smaller gap. Electrons and holes that drift into B are held there in the growth direction but still move freely sideways: confined to a plane. As bulk pieces the three just have their own band edges; as thin epitaxial layers, once B is about as thick as the carriers’ de Broglie wavelength, its conduction and valence bands split into discrete subbands.',
        example: { kind: 'demo', text: 'Widen the GaAs well and watch the levels crowd together.' },
        checks: q('dbw'),
      },
      {
        id: 'l8-infinite', title: 'What the infinite well teaches', scene: WELL({ finite: false, L: 10 }), sources: [T8(10)],
        factIds: f('s10-zero', 's10-only', 's10-classical'),
        text: 'Slide 10 lists the lessons of the infinite well. The energy is quantised and the lowest level sits above the bottom: a confined particle can never be at rest. It is only ever found with one of the level energies, nothing in between. And because the spacing falls as one over L², a very wide well has levels so close they merge into the continuum of classical physics.',
        example: { kind: 'demo', text: 'Drag L from 10 to 60 nm, and read the panel alongside.' },
        checks: q('classical'),
      },
      {
        id: 'l8-finite', title: 'Finite walls', scene: WELL({ finite: true, V0: 0.3 }), sources: [T8(10)],
        factIds: f('s10-leak', 's10-tunnel', 's10-lower', 's10-deeper'),
        text: 'Real band offsets are a few hundred meV, not infinite. Then ψ does not stop at the walls: it decays exponentially into the barriers, so the particle has a finite chance of being found inside them and can tunnel through a thin one. The wavefunction behaves as if the well were a little wider, so every level sits below its infinite-well counterpart. The deeper the well, the less it leaks and the closer its low levels come to the infinite ones.',
        example: { kind: 'demo', text: 'The faint lines are the infinite-well levels; the table lists the probability in the barriers.' },
        checks: q('leak'),
      },
    ],
    review: q('well-de', 'zero', 'lower', 'deep'),
  },
  {
    id: 'l8-hetero', title: 'Heterostructures',
    intro: 'Stack two different semiconductors and the offsets of their bands decide where electrons and holes end up.',
    steps: [
      {
        id: 'l8-type1', title: 'Nested gaps', scene: ALIGN({ well: 'InP', barrier: 'InAlAs' }), sources: [T8(11), T6(6)],
        factIds: f('s11-type1'),
        text: 'Line up the band edges of two materials. If the narrower gap lies entirely inside the wider one, its conduction band is lower and its valence band higher, so it is a well for both carriers at once. Electrons and holes collect in the same layer, overlap strongly and recombine efficiently: this is type I, the arrangement used in light emitters.',
        example: { kind: 'demo', text: 'Use the quick buttons: GaAs between AlGaAs.' },
        checks: q('type1'),
      },
      {
        id: 'l8-type2', title: 'Staggered gaps', scene: ALIGN(), sources: [T8(11)],
        factIds: f('s11-type2', 's11-figure'),
        text: 'If the gaps are staggered, the lowest conduction band is in one material and the highest valence band in the other. The electron falls into one layer and the hole into its neighbour. Slide 11 draws both versions: in C/A/C the electron is in A and the hole outside; in D/A/D it is the other way round. Separated carriers overlap little, so they take a long time to recombine: type II.',
        example: { kind: 'demo', text: 'Watch the blue electron and amber hole fall into their layers.' },
        checks: q('type2'),
      },
      {
        id: 'l8-grow', title: 'Growing it', scene: QMBE({ grown: 1 }), sources: [T8(14), T8(22), T6(17)],
        factIds: f('s14-tem', 's22-mbe', 's09-qw'),
        text: 'These stacks are grown by epitaxy, one layer after another, with each element’s shutter opened in turn. MBE gives the best results: it deposits a precisely controlled thickness at a slow rate, which makes atomically sharp interfaces. Transmission electron micrographs of InGaAs wells in GaAs or InAlAs show each well as a crisp dark stripe a few nanometres wide.',
        example: { kind: 'demo', text: 'Grow the sample layer by layer, then zoom in to see the stack and its TEM view.' },
        checks: q('grow'),
      },
    ],
    review: q('hole', 'levels', 'tem', 's11-type1'),
  },
  {
    id: 'l8-confine', title: 'Wires and dots',
    intro: 'Confine a second direction and the well becomes a wire; a third, and it becomes a dot. Each confined direction adds its own term to the energy.',
    steps: [
      {
        id: 'l8-wire', title: 'Quantum wires', scene: CONFINE({ dims: 1 }), sources: [T8(12)],
        factIds: f('s12-wire', 's12-psi', 's12-e'),
        text: 'A quantum wire is narrow in two directions and long in the third. Along its length the electron is still a travelling wave, e^(ik_x x); across it, there are two standing waves, one for each narrow side a and b, each with its own quantum number. The energy is the free kinetic energy along the wire plus one confinement term per side, ħ²π²n²/(2ma²) and ħ²π²l²/(2mb²). The quantum numbers run 1, 2, 3; the slide’s minus signs give the same states again.',
        example: { kind: 'worked', text: 'A 10 × 10 nm GaAs wire: the lowest state has twice the confinement energy of a 10 nm well, 2 × 56 = 112 meV.' },
        checks: q('wire', 'wire-e'),
      },
      {
        id: 'l8-dot', title: 'Quantum dots', scene: CONFINE({ dims: 2 }), sources: [T8(13)],
        factIds: f('s13-dot', 's13-psi', 's13-e'),
        text: 'Squeeze the third direction too and nothing is free: the electron sits in a box, with a product of three standing waves and an energy that is the sum of three confinement terms. Only discrete levels exist, like an atom’s, so dots are nicknamed quantum boxes or artificial atoms. They are studied mostly for their optics, though electrons hopping on and off them are interesting too.',
        example: { kind: 'demo', text: 'Make a dot and read the level list, and read the panel alongside.' },
        checks: q('dot', 'dot-e'),
      },
      {
        id: 'l8-degen', title: 'Symmetry and degeneracy', scene: CONFINE({ dims: 3 }), sources: [T8(12), T8(13)],
        factIds: f('s13-e', 's12-e'),
        text: 'In a cube the three sides are equal, so swapping the quantum numbers changes the wavefunction but not the energy. Squares in a square wire do the same for two numbers. Make one side longer and the matching term shrinks, lifting the degeneracy: the level list splits.',
        example: { kind: 'demo', text: 'Change c away from a and b and watch levels separate.' },
        checks: q('degenerate'),
      },
    ],
    review: q('s12-wire', 's13-dot', 's10-tunnel'),
  },
  {
    id: 'l8-fab', title: 'Making wires and dots',
    intro: 'Top-down and bottom-up: etching and gates, nanowires grown under droplets, and three routes to dots, each with its weakness.',
    steps: [
      {
        id: 'l8-wires', title: 'Wires, top-down and bottom-up', scene: FAB('vls', { fstep: 0 }), sources: [T8(15), T8(16)],
        factIds: f('s15-wire', 's16-vls', 's16-seeds'),
        text: 'Start from a well and confine sideways: etch it into a narrow ridge, or lay two gates on top with a gap and bias them to drive electrons out from under them. Or grow wires from the bottom up. In vapour–liquid–solid growth a metal droplet, usually gold, alloys with gallium into a liquid; arsenic and gallium arriving from the vapour supersaturate it and crystallise beneath it, so a wire grows with the droplet riding on top. A gallium droplet can do the job alone: self-catalysed growth.',
        example: { kind: 'demo', text: 'Step through the five stages; switch seeds.' },
        checks: q('vls'),
      },
      {
        id: 'l8-pillars', title: 'Dots by lithography', scene: FAB('pillars', { fstep: 0 }), sources: [T8(17), T8(18)],
        factIds: f('s17-goal', 's18-pillars', 's18-disadv', 's18-stack'),
        text: 'Every dot method engineers barriers on all three sides, and there are three families: lithography, colloidal chemistry and epitaxy. Lithography is the most direct: write a pattern with an electron beam on a GaAs/AlGaAs/InGaAs/AlGaAs/GaAs well and etch pillars through it. The heterostructure confines vertically, the pillar walls the rest. It is slow and gives few dots, and the etch contaminates and damages their surfaces.',
        example: { kind: 'demo', text: 'Pattern and etch: the red tint marks the damaged walls.' },
        checks: q('pillars'),
      },
      {
        id: 'l8-colloid', title: 'Dots from a flask', scene: FAB('colloid', { dotNm: 4 }), sources: [T8(19)],
        factIds: f('s19-colloid', 's19-dispersion', 's19-colour'),
        text: 'Colloidal dots are precipitated by chemistry from a solution or a host such as a polymer, usually II–VI compounds like CdS and CdSe. Molecules bonded to the surface, a cap, keep them chemically stable, and a shell of a wider-gap material can be grown around the core. Their emission depends on size, larger dots shining redder, but each batch spans a range of sizes.',
        example: { kind: 'demo', text: 'Drag the diameter and watch the colour, and read the panel alongside.' },
        checks: q('red'),
      },
      {
        id: 'l8-pattern', title: 'Patterned growth', scene: FAB('patterned', { fstep: 0 }), sources: [T8(20)],
        factIds: f('s20-patterned', 's20-disadv'),
        text: 'Epitaxy can place dots on purpose. Openings are etched through a mask on the substrate, and growth in them forms pyramids; Fukui’s group grew GaAs tetrahedral dots this way on (111)B GaAs by selective-area MOCVD. Positioning is excellent, but you only get as many dots as the pattern has openings.',
        example: { kind: 'demo', text: 'Grow: a dot appears at each pyramid’s tip.' },
        checks: q('pattern'),
      },
      {
        id: 'l8-sk', title: 'Self-assembled dots', scene: FAB('sk', { fstep: 1 }), sources: [T8(21), T8(22), T6(9)],
        factIds: f('s21-sk', 's21-disadv', 's21-control', 's21-afm', 's22-size', 's22-images'),
        text: 'Deposit InAs on GaAs by MBE or MOCVD. The first monolayers spread flat as a strained wetting layer; beyond a couple of monolayers the mismatch strain is relieved by bunching into islands, the Stranski–Krastanov mode. The islands are a few nanometres tall and a few tens wide, imaged edge-on by STM and TEM and from above by AFM. Their sizes, shapes and positions vary; local strain, growth on dislocations, growth conditions or patterning can steer where they start.',
        example: { kind: 'demo', text: 'Deposit InAs half a monolayer at a time.' },
        checks: q('sk'),
      },
    ],
    review: q('gates', 'self', 'sk-dis', 's14-tem'),
  },
  {
    id: 'l8-dos', title: 'The density of states',
    intro: 'Count the allowed states in k-space and see how the result changes shape as you confine one, two and three directions.',
    steps: [
      {
        id: 'l8-kgrid', title: 'States as points', scene: DOS({ dof: 3, E: 40 }), sources: [T8(23), T8(24)],
        factIds: f('s23-def', 's23-dims', 's24-cell'),
        text: 'The density of states is the number of electron states per unit volume per unit energy, the derivative of the count with respect to energy divided by the volume. To count, note that standing waves in a box have k components that are whole multiples of π over each side, so every state owns a little cube of k-space of volume π³/V. All states up to energy E lie within a radius k = √(2mE/ħ²).',
        example: { kind: 'demo', text: 'Raise E: the sphere grows and swallows more points.' },
        checks: q('kspace'),
      },
      {
        id: 'l8-3d', title: 'Three dimensions', scene: DOS({ dof: 3, E: 80 }), sources: [T8(25)],
        factIds: f('s24-cell', 's25-count', 's25-dos'),
        text: 'Divide the sphere’s volume, 4πk³/3, by the volume per state. Double it for the two spin directions, and keep one eighth, because only positive k components are distinct standing waves. The count goes as k³ and so as E to the three halves; differentiating, the bulk density of states rises as the square root of the energy.',
        example: { kind: 'demo', text: 'Compare the counted points with the formula in the label.' },
        checks: q('n3', 'dos3'),
      },
      {
        id: 'l8-2d', title: 'A well: steps', scene: DOS({ dof: 3 }), sources: [T8(26), T8(27)],
        factIds: f('s23-dims', 's26-2d', 's27-2d'),
        text: 'In a well only two directions are free. The states fill a circle of area πk², each owning π²/A, with two spins and a quarter for positive components. The count is proportional to k², which is proportional to E, so its derivative is a constant: every subband adds a flat step. That means many states are available right at the edge, unlike bulk.',
        example: { kind: 'demo', text: 'Switch to 2D and look at the red staircase on the chart.' },
        checks: q('dos2'),
      },
      {
        id: 'l8-1d', title: 'A wire: spikes', scene: DOS({ dof: 2 }), sources: [T8(28), T8(29)],
        factIds: f('s28-1d', 's29-1d'),
        text: 'In a wire one direction is free. The states fill a line from −k to +k, each owning π/L, with two spins and a half for the ± redundancy, so the count is proportional to k and the density of states falls as E^(−½) above each subband edge. Done this way the prefactor is 1/π. The slide measures the line only from 0 to k yet still halves it, and its result is half the true value.',
        example: { kind: 'demo', text: 'Switch to 1D: the green curve spikes at every subband.' },
        checks: q('wire1d'),
      },
      {
        id: 'l8-0d', title: 'A dot: delta functions', scene: DOS({ dof: 1 }), sources: [T8(30), T8(31)],
        factIds: f('s30-0d', 's31-plot'),
        text: 'With every direction confined there is no k-space left to fill: states exist only at the dot’s discrete energies, each holding two electrons of opposite spin, so the density of states is a set of delta functions (written σ on the slide). Slide 31 overlays all four on one energy axis: the smooth bulk curve, the well’s staircase, the wire’s spikes and the dot’s isolated lines.',
        example: { kind: 'demo', text: 'Choose 0D and compare all four curves on the chart.' },
        checks: q('show0d'),
      },
    ],
    review: q('edge', 's28-1d', 's12-psi'),
  },
  {
    id: 'l8-lasers', title: 'Why quantum dots make better lasers',
    intro: 'Put the density of states to work: narrow lines, low thresholds and insensitivity to temperature.',
    steps: [
      {
        id: 'l8-why', title: 'Sharp levels', scene: DOS({ dof: 0 }), sources: [T8(32)],
        factIds: f('s32-narrow', 's32-separation', 's32-volume', 's32-uses', 's30-0d'),
        text: 'A dot’s states are delta functions, so identical dots emit at one energy. Its levels are far apart compared with thermal energy, so carriers in the ground state are hard to kick out by heat. And the active material is tiny, so few carriers are needed to invert it. Beyond lasers, dots are being explored for single-photon sources, infrared photodetectors (QDIPs) and solar cells.',
        example: { kind: 'demo', text: 'The amber lines on the chart are the dot’s levels.' },
        checks: q('narrow'),
      },
      {
        id: 'l8-laser', title: 'The QD laser', scene: FAB('laser', { T: 25 }), sources: [T8(33)],
        factIds: f('s33-laser', 's33-structure', 's32-volume'),
        text: 'Slide 33’s laser is grown on n⁺ GaAs: AlGaAs cladding, GaAs, a layer of dots in In₀.₄Ga₀.₆As, GaAs, and AlGaAs again, etched into a ridge about a millimetre long. Its advantages are the two the physics predicts: it starts lasing at a low current density and keeps operating stably.',
        example: { kind: 'demo', text: 'The panel plots output against current for the dot laser and a well laser.' },
        checks: q('threshold'),
      },
      {
        id: 'l8-hot', title: 'Temperature', scene: FAB('laser', { T: 25 }), sources: [T8(33), T8(32)],
        factIds: f('s33-curves', 's32-separation'),
        text: 'Heat a conventional well laser and its threshold climbs steeply, because carriers spill out of the lasing states. The dot laser’s curves on the slide barely move from −40 °C to +100 °C: the threshold and slope stay almost fixed, so it needs no cooler.',
        example: { kind: 'demo', text: 'Drag the temperature and compare the two thresholds.' },
        checks: q('hot'),
      },
    ],
    review: q('s32-uses', 'dos1', 's33-laser'),
  },
]
