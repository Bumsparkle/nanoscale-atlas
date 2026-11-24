import { act, calc, H, JUNCTION, label, predict, recall } from '../questions/_kit'
import { T2 } from '../../../src/sources'
import type { LessonSection } from '../../../src/learn/schema'

/** Sections 1–3: silicon, the p-n junction, junction electrostatics and bands. */
const LAT = (structure: 'crystal' | 'poly' | 'amorphous' = 'crystal', dopant: 'none' | 'P' | 'B' = 'none') => ({ layer: 'lattice' as const, lattice: { structure, dopant } })

export const questions = [
  // 1 · silicon
  label('q-l01-rows', 2, ['s02-ic'], 'Find the part of this die where the circuit you are about to study is repeated thousands of times. Click it.', ['cell-rows'], { layer: 'die' },
    [H('Look for regular striped rows rather than the big blocks.', 'die')], 'The rows of standard cells near the beacon are the inverter layout stepped side by side: many transistors integrated on one chip.'),
  act('q-l01-traps', 3, ['s03-poly-grains', 's03-poly-traps'], 'Set the lattice to the form in which a carrier moves freely inside each ordered region but gets caught where two regions meet.', LAT('crystal'),
    { kind: 'lattice', structure: 'poly' }, LAT('poly'),
    [H('One structure is ordered in patches, with patches meeting at an angle.', 'lattice-cell')], 'Polysilicon: each grain is a small crystal, but the bonds broken where grains meet act as traps, so it conducts only moderately well.'),
  calc('q-l01-bonds', 4, ['s04-four-bonds', 's04-group-iv'], 'In a large perfect silicon crystal every covalent bond is shared between two atoms. On average, how many bonds does that make per atom?', 2, 0.01, 'bonds per atom',
    [H('Each atom takes part in four bonds, but each bond is counted by both of its atoms.', 'lattice-cell')], 'Each atom has four bonds and each bond belongs to two atoms, so there are 4 / 2 = 2 bonds per atom.', { scene: LAT('crystal') }),
  act('q-l01-holes', 5, ['s05-group-iii', 's05-dopants'], 'Make this crystal conduct with positive carriers.', LAT('crystal'),
    { kind: 'lattice', dopant: 'B' }, LAT('crystal', 'B'),
    [H('A positive carrier is a missing electron. Which neighbouring group in the periodic table is one electron short of silicon?')], 'Boron (group III) has three valence electrons, one fewer than a full set of bonds needs. The gap, a hole, moves through the crystal like a positive charge: p-type.'),

  // 2 · junction
  predict('q-l02-reverse', 6, ['s06-one-way', 's06-iv'], 'The junction is already reverse-biased at −1 V. Predict what happens to the current when you double the reverse voltage.', JUNCTION(-1),
    ['it stays almost zero', 'it doubles', 'it quadruples', 'it reverses direction'], 0,
    JUNCTION(-2), 'The barrier just grows; almost nothing crosses either way.',
    [H('What does a larger reverse voltage do to the barrier the majority carriers face?')], 'Reverse bias raises the barrier further, so majority carriers still cannot cross. Only the tiny generation current flows: the flat reverse branch of the diode curve.'),
  recall('q-l02-left', 7, ['s07-p-region', 's07-depleted'], 'A hole leaves the p side and recombines with an electron on the n side. What does it leave behind on the p side?', ['a mobile electron', 'a fixed, negatively charged acceptor ion', 'a fixed, positively charged donor ion', 'nothing: the p side stays neutral'], 1,
    [H('The acceptor atom gave up its hole. What charge does it have now, and can it move?')], 'The acceptor (e.g. B) accepted an electron to make the hole; once the hole leaves, the ion is negative and fixed in the lattice. These uncovered ions are the depletion region’s charge.'),
  predict('q-l02-push', 7, ['s07-field', 's07-diagram'], 'A hole from the p side wanders into the depletion region. Predict which way the built-in field pushes it.', JUNCTION(0.2),
    ['back towards the p side', 'on into the n side', 'along the junction', 'there is no force on it'], 0,
    JUNCTION(0), 'The field points from the positive ions (n side) to the negative ions (p side), so a positive hole is pushed back to p.',
    [H('Which side holds the positive uncovered ions? A field points away from positive charge.')], 'The field runs from the n side to the p side. A hole is positive, so it is pushed with the field, back to the p side. That opposes diffusion until the two balance.'),

  // 3 · electrostatics and bands
  calc('q-l03-wn', 8, ['s08-neutrality'], 'Nd = 5 × 10¹⁶ cm⁻³, Na = 1 × 10¹⁶ cm⁻³ and Wp = 0.25 µm. How far does the depletion region reach into the n side, Wn?', 0.05, 0.001, 'µm',
    [H('The uncovered charge on the two sides must be equal.')], 'NaWp = NdWn ⇒ Wn = NaWp/Nd = (10¹⁶ × 0.25)/(5 × 10¹⁶) = 0.05 µm. The heavily doped side holds the thin part.', { scene: JUNCTION(0) }),
  act('q-l03-wide-n', 8, ['s08-neutrality', 's08-charge'], 'At zero bias, set the doping so the depletion region reaches further into the n side than the p side.', JUNCTION(0, 0.3),
    { kind: 'junction', regime: 'zero', wpOverWn: '<1' }, { bench: { tab: 'junction', v: 0, ratio: 4 } },
    [H('The side that reaches further must hold its charge more thinly spread.')], 'Wn > Wp needs Nd < Na, so raise Na/Nd above 1: the n side is lightly doped and has to deplete further to uncover the same charge.'),
  calc('q-l03-peak', 8, ['s08-gauss', 's08-boundary', 's08-diagram'], 'Na = 10²² m⁻³, Wp = 0.1 µm and εr = 11.7 (ε0 = 8.854 × 10⁻¹² F/m). What is the peak field E0 = eNaWp/(εrε0)?', 1.547e6, 0.01e6, 'V/m',
    [H('Integrate the constant charge density across the p-side layer, starting from zero field at its edge.')], 'E0 = eNaWp/(εrε0) = 1.602 × 10⁻¹⁹ × 10²² × 10⁻⁷ / (11.7 × 8.854 × 10⁻¹²) = 1.602 × 10⁻⁴ / 1.036 × 10⁻¹⁰ ≈ 1.55 × 10⁶ V/m.', { scene: JUNCTION(0), d: 3 }),
  act('q-l03-12', 9, ['s09-reverse', 's09-barrier'], 'With V0 = 0.7 V, set a bias that makes the barrier 1.2 eV.', JUNCTION(0),
    { kind: 'junction', regime: 'reverse', minWidth: 1.28, maxWidth: 1.34 }, { bench: { tab: 'junction', v: -0.5 } },
    [H('Which kind of bias adds to the built-in barrier, and by how much here?')], 'A reverse bias adds to V0: e(0.7 + Vr) = 1.2 eV ⇒ Vr = 0.5 V, i.e. set −0.5 V.'),
  calc('q-l03-fwd', 9, ['s09-forward', 's09-open'], 'A junction with V0 = 0.75 V is forward-biased by 0.45 V. What barrier do the majority carriers face?', 0.3, 0.005, 'eV',
    [H('Forward bias drops across the depletion region and works against the built-in potential.')], 'e(V0 − V) = e(0.75 − 0.45) = 0.3 eV. A much lower barrier, so a large forward current flows.'),
  predict('q-l03-light', 9, ['s09-photo', 's09-thermal'], 'The junction sits at −2 V in the dark. Predict what happens to the current when light falls on the depletion region.', JUNCTION(-2),
    ['it falls to zero', 'it rises: light generates extra carrier pairs that the field sweeps out', 'it reverses into a forward current', 'nothing: light cannot cross the oxide'], 1,
    JUNCTION(-2.4), 'Extra pairs made in the depletion region are swept apart by the field: a photocurrent adds to the small reverse current.',
    [H('Think about what already causes the small reverse current, and whether light can do the same.')], 'Under reverse bias the field sweeps out any pair generated in the depletion region. Heat makes a few; light makes many more, so the reverse current rises. That is a photodiode.'),
]

export const sections: LessonSection[] = [
  {
    id: 'silicon', title: 'Silicon: from chip to crystal',
    intro: 'Why chips are made of silicon transistors, why the arrangement of the atoms decides how well silicon conducts, and how a few impurity atoms make it conduct on purpose.',
    steps: [
      {
        id: 'silicon-chips', title: 'Many transistors on one chip', scene: { layer: 'die' }, sources: [T2(1), T2(2)],
        factIds: ['s02-ic', 's02-ulsi', 's02-cmos', 's02-cmos-props'],
        text: 'An integrated circuit puts every transistor and every wire of a circuit onto one piece of silicon. The wires become microns long instead of centimetres, so signals are fast, and thousands of identical circuits are printed at once, so each one is cheap. Today that means ultra large scale integration (ULSI): billions of devices per chip. The device used almost everywhere is CMOS, complementary metal oxide semiconductor: an n-type and a p-type transistor working as a pair, which is fast, cheap and draws very little power. This lesson follows one CMOS circuit, the inverter, from the transistor, to logic, to how it is laid out and made.',
        example: { kind: 'demo', text: 'The pulsing ring on the die marks one inverter. Zoom towards it and the plain blocks resolve into rows of the same cell, stamped side by side.' },
        checks: ['q-l01-rows'],
      },
      {
        id: 'silicon-order', title: 'Order decides how well silicon conducts', scene: LAT('crystal'), sources: [T2(3)],
        factIds: ['s03-amorphous-order', 's03-amorphous-defects', 's03-amorphous-conductor', 's03-poly-grains', 's03-poly-size', 's03-poly-traps', 's03-crystal-order', 's03-crystal-defects', 's03-crystal-conductor', 's03-diagram'],
        text: 'A free electron moves well only through a regular lattice; every broken or strained bond can capture it. So the same silicon atoms conduct very differently depending on how they are arranged. Single-crystal silicon is one perfectly ordered array with very few defects: given free electrons, it conducts well. Amorphous silicon has no long-range order at all, with dangling bonds, voids and traps throughout, so it is a poor conductor. Polysilicon sits in between: it is made of grains, each a small crystal from microns down to nanometres across, packed at random orientations, and the traps cluster at the grain boundaries.',
        example: { kind: 'demo', text: 'Switch the structure control between the three forms. Watch which bonds survive: in one form they snap only along a line, in another they snap everywhere.' },
        checks: ['q-l01-traps'],
      },
      {
        id: 'silicon-bonds', title: 'Group IV: every electron in a bond', scene: { ...LAT('crystal'), look: 'lattice-cell' }, sources: [T2(4)],
        factIds: ['s04-substrate', 's04-group-iv', 's04-four-bonds', 's04-diagram'],
        text: 'Transistors are built on a silicon substrate, and silicon’s chemistry explains why pure silicon barely conducts. Silicon is in group IV: each atom has four valence electrons to share. In the crystal it shares one with each of its four nearest neighbours, so every bond holds a pair of electrons and every electron is tied up in a bond. With none left over to move, there is nothing to carry current. The lattice is a cubic cell in which each atom sits at the centre of a tetrahedron of neighbours.',
        example: { kind: 'worked', text: 'Count the amber bonds on the centre atom: four. Each holds a pair of electrons, one from each partner, so the centre atom effectively sees eight: a full, stable shell.' },
        checks: ['q-l01-bonds'],
      },
      {
        id: 'silicon-dopants', title: 'Dopants make carriers on purpose', scene: LAT('crystal'), sources: [T2(5)],
        factIds: ['s05-semiconductor', 's05-pure', 's05-dopants', 's05-group-v', 's05-group-iii'],
        text: 'Silicon is a semiconductor: pure, it has no free carriers, but a tiny number of impurity atoms change that completely. Put a group V atom such as phosphorus or arsenic in place of one silicon: four of its five electrons complete the bonds and the fifth is only loosely held, so at room temperature it wanders off as a free electron. The material is n-type. A group III atom such as boron or aluminium has only three, so one bond is left an electron short; neighbouring electrons hop into that gap, and the gap, a hole, moves the other way. That material is p-type.',
        example: { kind: 'demo', text: 'Pick P in the dopant control: the fifth electron circles the donor, then drifts away. Then pick B and follow the ring that marks the hole.' },
        checks: ['q-l01-holes'],
      },
    ],
    review: ['q-s03-poly-size-l', 'q-s05-pairs', 'q-s04-substrate'],
  },
  {
    id: 'junction', title: 'The p-n junction',
    intro: 'Why joining p- and n-type silicon makes a one-way valve: diffusion empties a region at the junction, and the charge it leaves behind sets up a field that holds the rest back.',
    steps: [
      {
        id: 'junction-diode', title: 'A one-way valve', scene: JUNCTION(0), sources: [T2(6)],
        factIds: ['s06-diode', 's06-one-way', 's06-iv', 's06-nplus'],
        text: 'Join p-type and n-type silicon and you get a diode: current flows easily one way and hardly at all the other. The reason is a barrier that the junction builds for itself. Push in the forward direction and the barrier shrinks, so majority carriers pour across. Push the other way and it grows. In a practical diode the n region sits on a heavily doped n+ layer, so the metal back contact makes a low-resistance connection and the junction, not the contact, sets the behaviour.',
        example: { kind: 'demo', text: 'Drag the bias slider through zero. The band diagram’s barrier rises and falls, and the depletion band in the strip above narrows as you go forward.' },
        checks: ['q-l02-reverse'],
      },
      {
        id: 'junction-depletion', title: 'Diffusion empties the junction', scene: JUNCTION(0), sources: [T2(7)],
        factIds: ['s07-n-region', 's07-p-region', 's07-diffusion', 's07-depleted', 's07-depletion'],
        text: 'Before contact, the p side is full of holes held near fixed acceptor ions and the n side is full of electrons near fixed donor ions; each side is neutral. Bring them together and the huge difference in concentration drives holes across into the n side and electrons into the p side, where they recombine. The mobile carriers leave, but the ions that gave them up cannot move. Near the junction both sides are now stripped of free carriers: this is the depletion region, also called the space charge layer, because its fixed ions are no longer cancelled.',
        example: { kind: 'demo', text: 'Look at the strip on the junction bench: the minus and plus signs are the uncovered ions, and they exist only inside the pale depleted band.' },
        checks: ['q-l02-left'],
      },
      {
        id: 'junction-field', title: 'The built-in field', scene: JUNCTION(0), sources: [T2(7)],
        factIds: ['s07-field', 's07-diagram'],
        text: 'The uncovered donor ions on the n side are positive and the acceptor ions on the p side are negative. That separated charge produces an electric field across the junction, pointing from the positive ions to the negative ones, so from the n side towards the p side. The field drives carriers in the direction opposite to their diffusion. Diffusion keeps trying to spread carriers out, the field keeps sweeping them back, and the depletion region grows until the two exactly balance. In the lecture drawing the field sits at the metallurgical junction between B⁻ ions and As⁺ ions.',
        example: { kind: 'demo', text: 'The green E(z) trace on the bench is the size of that field: zero in the neutral regions and largest at the junction itself.' },
        checks: ['q-l02-push'],
      },
    ],
    review: ['q-s07-field-p', 'q-s05-iii', 'q-s06-nplus', 'q-s03-crystal'],
  },
  {
    id: 'electrostatics', title: 'Inside the junction: charge, field and bands',
    intro: 'Turn the picture into numbers: how the doping sets the widths, how Gauss’s law gives the field, and how bias moves the energy barrier on the band diagram.',
    steps: [
      {
        id: 'electrostatics-balance', title: 'Charge balance sets the widths', scene: JUNCTION(0, 1), sources: [T2(8)],
        factIds: ['s08-charge', 's08-neutrality', 's08-symbols'],
        text: 'Every hole that crossed left a negative ion behind and every electron left a positive one, so the depletion region as a whole carries no net charge. The p layer holds charge density −eNa over a width Wp, and the n layer +eNd over Wn, where Na and Nd are the acceptor and donor densities per unit volume. Equal and opposite total charge means NaWp = NdWn. The consequence is counter-intuitive: the lightly doped side has to deplete further to uncover the same charge, so it holds the wider part of the region.',
        example: { kind: 'worked', text: 'Na = 1 × 10¹⁶ cm⁻³ and Nd = 4 × 10¹⁶ cm⁻³ with Wp = 0.4 µm: Wn = NaWp/Nd = 0.4/4 = 0.1 µm. Four times the doping, a quarter of the width.' },
        checks: ['q-l03-wn', 'q-l03-wide-n'],
      },
      {
        id: 'electrostatics-field', title: 'From charge to field', scene: JUNCTION(0), sources: [T2(8)],
        factIds: ['s08-gauss', 's08-boundary', 's08-diagram'],
        text: 'Gauss’s law links charge to field: dE/dz = ρ/(εrε0), with εr the relative permittivity and ε0 that of free space. Inside each depleted layer ρ is constant, so the field changes linearly. Outside the region the material is neutral and carries no field, which fixes the boundary conditions E(−Wp) = E(Wn) = 0. Starting from zero at one edge, the field grows steadily through the charged layer, reaches its largest magnitude E0 at the junction and falls back to zero at the other edge: a triangle. The step in ρ becomes a triangle in E.',
        example: { kind: 'worked', text: 'Integrating across the p layer: |E0| = eNaWp/(εrε0). With Na = 10²² m⁻³, Wp = 0.2 µm and εr = 11.7 that gives about 3.1 × 10⁶ V/m.' },
        checks: ['q-l03-peak'],
      },
      {
        id: 'electrostatics-bias', title: 'Bias moves the barrier', scene: JUNCTION(0), sources: [T2(9)],
        factIds: ['s09-open', 's09-barrier', 's09-forward', 's09-reverse', 's09-diagram'],
        text: 'At equilibrium no net current flows, so the Fermi level must be flat through both sides; to line up, the bands bend across the junction by eV0, the built-in or junction potential. That bend is the barrier majority carriers must climb. An applied voltage drops almost entirely across the depletion region, the part with no free carriers and so the highest resistance. A forward bias V subtracts from it, giving e(V0 − V), and a large current flows. A reverse bias Vr adds to it, giving e(V0 + Vr). On the diagram the two Fermi levels split apart by the applied voltage.',
        example: { kind: 'worked', text: 'V0 = 0.7 V with 0.2 V forward: the barrier is e(0.7 − 0.2) = 0.5 eV. The same junction at 1 V reverse: e(0.7 + 1) = 1.7 eV.' },
        checks: ['q-l03-12', 'q-l03-fwd'],
      },
      {
        id: 'electrostatics-generation', title: 'The current a reverse-biased junction still carries', scene: JUNCTION(-2), sources: [T2(9)],
        factIds: ['s09-thermal', 's09-photo'],
        text: 'Under reverse bias the barrier blocks majority carriers almost completely, yet a small current still flows. It comes from inside the depletion region itself: thermal energy occasionally breaks a bond and creates an electron–hole pair there, and the strong field immediately sweeps the electron to the n side and the hole to the p side. Because it depends on generation, not on the barrier, this current hardly changes with the reverse voltage. Anything else that makes pairs inside that region adds to it.',
        example: { kind: 'demo', text: 'Watch the reverse branch: as you push further negative the barrier grows, but the generated current the bench reports stays tiny and flat.' },
        checks: ['q-l03-light'],
      },
    ],
    review: ['q-s09-rev', 'q-s08-neutral', 'q-s07-depl', 'q-s06-iv'],
  },
]
