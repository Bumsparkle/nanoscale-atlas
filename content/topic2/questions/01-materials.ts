import { act, calc, CELL, H, label, predict, recall, short } from './_kit'

/** Slides 1–5: introduction, silicon structures, the lattice, dopants. */
const LATTICE = (structure: 'crystal' | 'poly' | 'amorphous' = 'crystal', dopant: 'none' | 'P' | 'B' = 'none') => ({ layer: 'lattice' as const, lattice: { structure, dopant } })
const OXIDE = { layer: 'oxide' as const }

export default [
  recall('q-s01-topic', 1, ['s01-topic'], 'ELEC0031 Topic 2 is titled…', ['Introduction to CMOS VLSI Design', 'Semiconductor Lasers', 'Thin-Film Deposition', 'Quantum Transport'], 0,
    [H('Think about what this whole atlas is built around: one logic gate made of complementary transistors.')],
    'Topic 2 is "Introduction to CMOS VLSI Design".'),

  recall('q-s02-ic', 2, ['s02-ic'], 'An integrated circuit is…', ['a single transistor on a wafer', 'many transistors on one chip', 'a circuit board of discrete parts', 'a wafer before it is diced'], 1,
    [H('Zoom out to the die: what does one chip carry?', 'die')], 'Integrated circuits have many transistors on one chip.', { obj: 'die' }),
  short('q-s02-ulsi', 2, ['s02-ulsi'], 'What does ULSI stand for?', ['ultra large scale integration', 'ultra-large-scale integration'],
    [H('U, L and S describe the size of the integration.')], 'ULSI = Ultra Large Scale Integration.'),
  short('q-s02-cmos', 2, ['s02-cmos'], 'What does CMOS stand for?', ['complementary metal oxide semiconductor', 'complementary metal-oxide-semiconductor'],
    [H('The C refers to pairing nMOS with pMOS; MOS is the gate–oxide–silicon stack.')], 'CMOS = Complementary Metal Oxide Semiconductor.'),
  recall('q-s02-props', 2, ['s02-cmos-props'], 'CMOS transistors are described as…', ['slow, expensive, low power', 'fast, cheap, high power', 'fast, cheap, low power', 'slow, cheap, high power'], 2,
    [H('Why would every modern chip use them?')], 'Fast, cheap, low-power transistors.'),
  recall('q-s02-plan', 2, ['s02-plan'], 'Which is NOT one of the parts of building a simple CMOS chip listed in the introduction?', ['the CMOS transistor', 'building logic gates from transistors', 'transistor layout and fabrication', 'packaging and wire bonding'], 3,
    [H('The three parts go device → logic → making it.')], 'The introduction lists the CMOS transistor, logic gates from transistors, and layout and fabrication. Packaging is not covered.'),

  // slide 3
  act('q-s03-amorphous', 3, ['s03-amorphous-order', 's03-diagram'], 'Switch the lattice to the structure with no recognizable long-range order.', LATTICE('crystal'),
    { kind: 'lattice', structure: 'amorphous' }, LATTICE('amorphous'),
    [H('Use the structure control. Which of the three structures looks like a random network?', 'lattice-cell')], 'Amorphous Si has no recognizable long-range order: the left-hand sketch of the three, a random network.', { obj: 'lattice-cell' }),
  recall('q-s03-amorphous-props', 3, ['s03-amorphous-defects', 's03-amorphous-conductor'], 'Amorphous silicon has…', ['very few defects and is a good conductor', 'many dangling bonds and is a poor conductor', 'grain boundaries and is an "average" conductor', 'perfect symmetry and no traps'], 1,
    [H('Switch the lattice to amorphous and watch which bonds survive.', 'lattice-cell')], 'Many dangling bonds, defects, voids and traps, so a poor charge conductor.', { obj: 'lattice-cell' }),
  act('q-s03-poly', 3, ['s03-poly-grains'], 'Show silicon made of randomly oriented grains.', LATTICE('crystal'), { kind: 'lattice', structure: 'poly' }, LATTICE('poly'),
    [H('One of the three structures is built from ordered segments that do not line up with each other.', 'lattice-cell')], 'Poly-Si: segments (grains) randomly oriented to each other.', { obj: 'lattice-cell' }),
  recall('q-s03-poly-size', 3, ['s03-poly-size'], 'Poly-Si grains range in size from…', ['1 Å to 10 Å', 'micron to nm', 'mm to µm', 'always exactly 5 nm'], 1,
    [H('The range spans about three orders of magnitude.')], 'Grains range from micron to nm size.', { obj: 'oxide-poly' }),
  label('q-s03-poly-size-l', 3, ['s03-poly-size', 's03-poly-grains'], 'In the gate stack, click the material built from grains between micron and nm in size.', ['oxide-poly'], OXIDE,
    [H('Three materials are stacked here: a crystal, an amorphous film and one more.', 'oxide-substrate')], 'The polysilicon gate (top) is made of randomly oriented grains, micron to nm in size.', { obj: 'oxide-poly' }),
  recall('q-s03-poly-traps', 3, ['s03-poly-traps'], 'Why is poly-Si only an "average" conductor?', ['it has no free carriers at all', 'traps and defects at the grain boundaries', 'it is an insulator like SiO₂', 'its atoms have five valence electrons'], 1,
    [H('Look where two grains meet in the poly lattice.', 'lattice-cell')], 'Traps and defects at the grain boundaries.'),
  label('q-s03-crystal', 3, ['s03-crystal-order', 's03-crystal-defects'], 'Click the totally ordered array of atoms with very few defects.', ['oxide-substrate'], OXIDE,
    [H('Not the disordered film, not the grains.', 'oxide-film')], 'The body under the gate is single-crystal Si: totally ordered, very few defects and traps.', { obj: 'oxide-substrate' }),
  recall('q-s03-crystal-cond', 3, ['s03-crystal-conductor'], 'Single-crystal Si is a good conductor…', ['always', 'never', 'if free electrons are present', 'only above 1200 °C'], 2,
    [H('Pure Si has no free carriers. What changes that?')], 'Good conductor if free electrons are present, e.g. after doping.'),

  // slide 4
  label('q-s04-substrate', 4, ['s04-substrate'], 'Click the silicon substrate the transistors are built on.', ['substrate'], CELL,
    [H('It is the bulk underneath everything else.', 'field-oxide')], 'Transistors are built on the silicon substrate, here the p-type wafer.', { obj: 'substrate' }),
  short('q-s04-group', 4, ['s04-group-iv'], 'How many electrons does a silicon atom have to share?', ['4', 'four'],
    [H('Silicon is in group IV.', 'lattice-cell')], 'Silicon is group IV: 4 electrons to share.', { obj: 'lattice-cell' }),
  calc('q-s04-bonds', 4, ['s04-four-bonds', 's04-group-iv'], 'Count the highlighted bonds on the centre atom: how many nearest neighbours does each Si atom bond to?', 4, 0.01, 'bonds',
    [H('Count the amber bonds on the centre atom.', 'lattice-cell')], 'Each Si shares its 4 electrons in 4 covalent bonds with its four nearest neighbours.', { scene: { layer: 'lattice', lattice: { structure: 'crystal', dopant: 'none' } }, obj: 'lattice-cell', d: 1 }),
  recall('q-s04-diagram', 4, ['s04-diagram'], 'What does the 2D sketch of the silicon lattice show?', ['electrons moving through a wire', 'silicon atoms sharing electrons in covalent bonds', 'ions implanted into a wafer', 'the energy band diagram'], 1,
    [H('The labels point at "silicon atoms" and "electrons in covalent bonds".')], 'Silicon atoms sharing electrons in covalent bonds; the 3D sketch is the cubic cell.'),

  // slide 5
  recall('q-s05-pure', 5, ['s05-pure', 's05-semiconductor'], 'Pure silicon conducts poorly because…', ['it has no free carriers', 'it is a metal', 'it has too many free electrons', 'its bonds are broken'], 0,
    [H('Every electron in the pure lattice is tied up in a bond.', 'lattice-cell')], 'Silicon is a semiconductor; pure Si has no free carriers and conducts poorly.'),
  predict('q-s05-p', 5, ['s05-group-v', 's05-dopants'], 'A phosphorus atom (group V) replaces one silicon atom. Predict what happens.', { layer: 'lattice', lattice: { structure: 'crystal', dopant: 'none' } },
    ['a hole forms: p-type', 'nothing: the lattice is unchanged', 'a spare electron is freed: n-type', 'all four bonds break'], 2,
    { lattice: { structure: 'crystal', dopant: 'P' } }, 'The fifth electron is not needed for bonding; it wanders off as a free carrier: n-type.',
    [H('Phosphorus has one more electron than it needs for four bonds.', 'lattice-cell')], 'Group V gives an extra electron, so n-type; adding dopants increases conductivity.', { obj: 'lattice-dopant' }),
  act('q-s05-v', 5, ['s05-group-v'], 'Add the dopant that makes silicon n-type.', { layer: 'lattice', lattice: { structure: 'crystal', dopant: 'none' } },
    { kind: 'lattice', dopant: 'P' }, { lattice: { structure: 'crystal', dopant: 'P' } },
    [H('n-type means an extra electron. Which group has one more than silicon?')], 'Phosphorus (group V) gives an extra electron: n-type.', { obj: 'lattice-dopant', d: 1 }),
  act('q-s05-iii', 5, ['s05-group-iii'], 'Add the dopant that leaves a hole.', { layer: 'lattice', lattice: { structure: 'crystal', dopant: 'none' } },
    { kind: 'lattice', dopant: 'B' }, { lattice: { structure: 'crystal', dopant: 'B' } },
    [H('A hole is a missing electron. Which group has one fewer than silicon?')], 'Boron (group III) is missing an electron, leaving a hole: p-type.', { obj: 'lattice-dopant', d: 1 }),
  recall('q-s05-pairs', 5, ['s05-group-iii', 's05-group-v'], 'Which pair are both p-type dopants?', ['P and As', 'B and P', 'B and Al', 'As and Al'], 2,
    [H('p-type needs a missing electron: group III.')], 'B and Al are group III (p-type); P and As are group V (n-type).'),
  recall('q-s05-dopants', 5, ['s05-dopants'], 'What does adding dopants do to silicon?', ['reduces its conductivity', 'increases its conductivity', 'turns it into an insulator', 'melts it'], 1,
    [H('Dopants bring free carriers.')], 'Adding dopants increases the conductivity.'),
]
