import { act, calc, FAB, H, label, LAYOUT, predict, recall, SECTION27 } from '../questions/_kit'
import { T2 } from '../../../src/sources'
import type { LessonSection } from '../../../src/learn/schema'

/** Sections 8–10: the cross-section, the first lithography cycle, the n-well. */
const ETCHES = ['n-well-etch', 'gate-etch', 'gate-etch-gox', 'n+-etch', 'p+-etch', 'contacts-etch', 'metal-etch']

export const questions = [
  // 8 · cross-section
  act('q-l08-remove', 24, ['s24-steps', 's24-litho'], 'Step the fab timeline to any step that removes material from the wafer.', FAB('n-well-spin'),
    { kind: 'fab', steps: ETCHES }, { view: 'fab', step: 'n-well-etch' },
    [H('Adding and removing alternate. Look for a step that clears something away through an opening.')], 'Any etch removes material, e.g. the HF oxide etch that opens the n-well window. Each step either deposits or etches.'),
  label('q-l08-pchannel', 25, ['s25-nwell', 's25-psub'], 'Click the region the pMOS channel forms in.', ['nwell'], SECTION27,
    [H('The pMOS needs an n-type body, but the wafer is p-type.', 'pmos-source')], 'The pMOS channel forms in the n-well: a p-type wafer cannot be the body of a p-channel device.'),
  label('q-l08-ydrain', 25, ['s25-wiring', 's25-legend', 's25-order'], 'In the cut, click the p+ region that is wired to the output Y.', ['pmos-drain'], SECTION27,
    [H('Y sits between the two transistors; the p+ regions belong to the pMOS on the right.', 'metal-y')], 'The pMOS drain: the p+ region nearer the middle, joined by the Y wire to the nMOS drain.'),
  label('q-l08-schottky', 26, ['s26-schottky', 's26-taps', 's26-ties'], 'If this region were only lightly doped, the ground connection to the substrate would behave like a diode. Click it.', ['substrate-tap'], SECTION27,
    [H('Find where the GND metal reaches down to the p-type body.', 'metal-gnd')], 'The p+ substrate tap. Heavy doping makes the metal contact ohmic; lightly doped silicon under metal forms a Schottky diode.'),
  act('q-l08-poly', 27, ['s27-masks'], 'In the Layout view, show only the mask that defines where the transistor gates are.', LAYOUT(),
    { kind: 'layers', layers: ['poly'] }, { layers: ['poly'] },
    [H('A gate exists wherever one particular layer crosses a diffusion.')], 'The polysilicon mask: wherever poly crosses diffusion, there is a gate.'),

  // 9 · masks, oxide, lithography
  calc('q-l09-cycles', 28, ['s28-six'], 'Each mask needs its own lithography cycle (spin, expose, develop, etch, strip). How many cycles does this inverter need?', 6, 0.01, 'cycles',
    [H('Count the masks in the Layout view.')], 'One cycle per mask: n-well, poly, n+, p+, contact, metal. Six.', { scene: LAYOUT(), d: 1 }),
  act('q-l09-protect', 30, ['s29-sequence', 's30-grow', 's29-start'], 'Step to the point where the blank wafer first gets a protective layer.', FAB('start'),
    { kind: 'fab', steps: ['nwell-ox'] }, { view: 'fab', step: 'nwell-ox' },
    [H('It happens in a furnace, before any resist.')], 'The first step grows SiO₂ over the bare wafer; later the n-well window is opened in it.'),
  calc('q-l09-cold', 30, ['s30-temp'], 'The oxidation furnace runs at the bottom of its normal range. What is that in kelvin?', 1173, 1, 'K',
    [H('Take the lower end of the oxidation range and add 273.')], 'The lower end is 900 °C; 900 + 273 = 1173 K.'),
  predict('q-l09-window', 32, ['s31-soften', 's32-expose', 's31-resist'], 'The resist has been exposed through the n-well mask. After developing, which areas will be open down to the oxide?', FAB('n-well-expose'),
    ['the areas under the mask’s clear windows', 'the areas under the mask’s chrome', 'the whole wafer', 'none: developing only hardens it'], 0,
    { view: 'fab', step: 'n-well-develop' }, 'The resist that saw light dissolves: the window matches the clear part of the mask.',
    [H('Which resist changed when the light hit it?', 'photoresist')], 'Positive resist softens where light reaches it. The clear windows let light through, so those areas dissolve in the developer.'),
  label('q-l09-hf', 33, ['s33-only', 's33-hf', 's32-strip'], 'Click the material HF would also have removed if the resist had not been covering it.', ['mask-oxide'], FAB('n-well-etch'),
    [H('HF attacks one material only; part of it is hidden under the resist.', 'photoresist')], 'The oxide outside the window. HF dissolves SiO₂ wherever it can reach it; the resist protects the rest.'),
  act('q-l09-safe', 34, ['s34-piranha', 's34-why'], 'Step to the last moment before the wafer can safely go into a hot furnace.', FAB('n-well-etch'),
    { kind: 'fab', steps: ['n-well-strip'] }, { view: 'fab', step: 'n-well-strip' },
    [H('Which layer on the wafer is an organic polymer?')], 'After the piranha strip: the resist is gone, so nothing will melt or burn in the furnace.'),

  // 10 · n-well
  predict('q-l10-depth', 35, ['s35-methods', 's35-implant', 's35-diffusion'], 'You need the arsenic to peak at a precisely set depth below the surface. Which setting would you adjust to control that depth most directly?', FAB('n-well-strip'),
    ['the energy of the ions', 'the furnace temperature', 'the time in the gas', 'the thickness of the resist'], 0,
    { view: 'fab', step: 'nwell-implant' }, 'An ion beam: its energy sets the depth and the beam current counts the ions.',
    [H('One method is driven by temperature and time; the other fires ions at a chosen energy.')], 'Implantation: ion energy sets the range and the dose is measured as charge. Diffusion profiles depend on temperature and time. That is why implantation is usual today.'),
  label('q-l10-blocked', 35, ['s35-block'], 'Click the region that would also have turned n-type if the oxide had not been there.', ['substrate'], FAB('nwell-implant'),
    [H('Where are the ions stopping now, and what is underneath?', 'mask-oxide')], 'The p substrate around the well. Ions stop in the oxide; without it they would enter all the silicon.'),
  act('q-l10-strip', 36, ['s36-strip', 's36-similar'], 'Step to where the wafer is bare again, with only the n-well to show for the first cycle.', FAB('nwell-implant'),
    { kind: 'fab', steps: ['nwell-strip-ox'] }, { view: 'fab', step: 'nwell-strip-ox' },
    [H('The oxide stencil has done its job. What removes oxide?')], 'The HF strip removes the remaining oxide: a bare wafer with an n-well.'),
]

export const sections: LessonSection[] = [
  {
    id: 'cross-section', title: 'From circuit to silicon',
    intro: 'How the inverter sits in the wafer: one body for each transistor, the legend that names every region, the taps that hold the bodies at the rails, and the masks that define it all.',
    steps: [
      {
        id: 'cross-section-wafer', title: 'Building on a wafer', scene: FAB('start'), sources: [T2(24)],
        factIds: ['s24-wafer', 's24-litho', 's24-steps', 's24-views'],
        text: 'CMOS transistors are made on a silicon wafer, hundreds of chips at a time. Lithography works like a printing press: a mask is printed onto every die, so each step treats all of them identically. Each step either adds a layer (growing, depositing) or takes some away (etching). It is hard to see what is going on from one view, so fabrication is easiest to follow both from above, as masks, and in cross-section, as layers.',
        example: { kind: 'demo', text: 'Scrub the timeline slowly. The step card names each step; notice how adding and removing alternate.' },
        checks: ['q-l08-remove'],
      },
      {
        id: 'cross-section-bodies', title: 'One body for each transistor', scene: SECTION27, sources: [T2(25)],
        factIds: ['s25-psub', 's25-nwell'],
        text: 'Each transistor needs a body of the opposite type to its source and drain. The nMOS has n+ source and drain, so it needs a p-type body, and the p-type wafer itself provides one. The pMOS has p+ source and drain, so it needs an n-type body, and the wafer cannot be both. The answer is to convert a patch of the wafer to n-type, an n-well, and build the pMOS inside it.',
        example: { kind: 'demo', text: 'The cut shows the pale n-well on the right, sunk into the p substrate. The pMOS sits entirely inside it.' },
        checks: ['q-l08-pchannel'],
      },
      {
        id: 'cross-section-reading', title: 'Reading the cut', scene: SECTION27, sources: [T2(25)],
        factIds: ['s25-order', 's25-legend', 's25-wiring'],
        text: 'Read the cross-section with the lecture’s legend: SiO₂, n+ and p+ diffusion, polysilicon, n well, p substrate and metal1, each in its own grey or hatch. From left to right you meet the nMOS, its two n+ regions in the p substrate, then the pMOS with its two p+ regions in the n well. The input A is the polysilicon over both channels. The output Y is a metal wire joining the two inner diffusions, the drains. GND reaches the nMOS source and VDD the pMOS source.',
        example: { kind: 'demo', text: 'Compare the callouts with the legend panel: every region in the cut has a legend entry, and the callouts add each region’s role.' },
        checks: ['q-l08-ydrain'],
      },
      {
        id: 'cross-section-taps', title: 'Taps, and why metal needs heavy doping', scene: SECTION27, sources: [T2(26)],
        factIds: ['s26-ties', 's26-schottky', 's26-taps', 's26-xsec'],
        text: 'Both bodies must be held at a rail: the p substrate at GND and the n-well at VDD, so no junction is ever forward biased. Touching metal straight onto lightly doped silicon does not work: it forms a rectifying metal–semiconductor junction, a Schottky diode, rather than a plain connection. So each connection lands on a small, heavily doped region of the same type as the body: a p+ tap in the substrate and an n+ tap in the well. Along the line the doping now reads p+, n+ n+, p+ p+, n+.',
        example: { kind: 'demo', text: 'Find the two outermost diffusions in the cut: each sits under a rail, not under a transistor.' },
        checks: ['q-l08-schottky'],
      },
      {
        id: 'cross-section-masks', title: 'The mask set and the section line', scene: { layer: 'cell', view: 'section', section: null }, sources: [T2(27)],
        factIds: ['s27-masks', 's27-line', 's27-order'],
        text: 'The cross-section is only a view: what actually defines the transistors and wires is a set of masks, each a top-down drawing of where one layer goes. The cut you have been reading is taken along a dashed line drawn through the mask set so that it passes through both transistors and both taps: substrate tap, nMOS, pMOS and well tap, with GND on the left and VDD on the right.',
        example: { kind: 'demo', text: 'Drag across the cell to sweep the section plane, then press 1 to snap it back onto the dashed line.' },
        checks: ['q-l08-poly'],
      },
    ],
    review: ['q-s25-order', 'q-s26-taps', 'q-s23-y1', 'q-s11-cap'],
  },
  {
    id: 'lithography', title: 'Oxide and lithography: the first cycle',
    intro: 'The cycle that patterns every layer, followed once in full: grow an oxide, coat it with resist, expose, develop, etch, strip.',
    steps: [
      {
        id: 'lithography-masks', title: 'Six masks, six cycles', scene: LAYOUT(), sources: [T2(28)],
        factIds: ['s28-six'],
        text: 'The inverter is defined by six masks: n-well, polysilicon, n+ diffusion, p+ diffusion, contact and metal. Each mask is printed by one lithography cycle, and the order follows the structure from the bottom up: the well goes in first because everything else is built in or on top of it.',
        example: { kind: 'demo', text: 'Toggle the masks in the Layout view one at a time and imagine each as a separate glass plate printed onto the same wafer.' },
        checks: ['q-l09-cycles'],
      },
      {
        id: 'lithography-oxide', title: 'A protective oxide', scene: FAB('start'), sources: [T2(29), T2(30)],
        factIds: ['s29-start', 's29-first', 's29-sequence', 's30-grow', 's30-temp'],
        text: 'Fabrication starts from a blank p-type wafer and builds upward, and the first structure is the n-well. To dope only where the well should go, the rest of the wafer needs a cover that dopants cannot pass. Silicon dioxide is ideal, and it can be grown from the wafer itself: in an oxidation furnace at 900–1200 °C, with steam (H₂O) or dry oxygen, the silicon surface oxidises. The plan for the well is then: cover with oxide, open it where the well goes, dope through the opening, strip the oxide.',
        example: { kind: 'worked', text: 'Converting temperatures: 1000 °C is 1000 + 273 = 1273 K. Oxygen has to diffuse through the oxide already grown, which is why such heat is needed (beyond the lecture).' },
        checks: ['q-l09-protect', 'q-l09-cold'],
      },
      {
        id: 'lithography-resist', title: 'Photoresist: a stencil written by light', scene: FAB('n-well-spin'), sources: [T2(31), T2(32)],
        factIds: ['s31-spin', 's31-resist', 's31-soften', 's32-expose'],
        text: 'To open the oxide in just one place you need a temporary stencil. Photoresist is a light-sensitive organic polymer, spun on so it covers the wafer evenly. Where light falls on it, this resist softens. Shine ultraviolet light through the n-well mask, a glass plate with an opaque pattern on it, and the pattern is copied into the resist. The work is done under yellow light, which leaves the resist alone.',
        example: { kind: 'demo', text: 'Step to the exposure: the mask plate hovers over the wafer, light passes through its clear part, and the resist beneath turns paler.' },
        checks: ['q-l09-window'],
      },
      {
        id: 'lithography-etch', title: 'Develop and etch', scene: FAB('n-well-develop'), sources: [T2(32), T2(33)],
        factIds: ['s32-strip', 's33-hf', 's33-danger', 's33-only'],
        text: 'Developing strips off the exposed photoresist, leaving bare oxide where the window should be and resist everywhere else. Then hydrofluoric acid, HF, etches the oxide. HF dissolves SiO₂ readily but does not attack the resist or the silicon, so it only cuts through where the resist has gone. The selectivity is the point. HF is also dangerous to people: it seeps through skin and attacks bone, so it is handled with great care.',
        example: { kind: 'demo', text: 'Compare the develop and etch steps: the outline of the opening does not move, it just goes one layer deeper.' },
        checks: ['q-l09-hf'],
      },
      {
        id: 'lithography-strip', title: 'Strip the resist', scene: FAB('n-well-etch'), sources: [T2(34)],
        factIds: ['s34-piranha', 's34-why'],
        text: 'The remaining photoresist has done its job and must go before the next step. That step is hot, and an organic polymer would melt and contaminate the furnace. The resist is stripped with piranha etch, a mixture of acids that oxidises organic material completely. Beyond the lecture: piranha is sulphuric acid with hydrogen peroxide. What remains is the oxide stencil with its window.',
        example: { kind: 'demo', text: 'Step through the strip: the amber layer disappears and the oxide with its opening is all that is left.' },
        checks: ['q-l09-safe'],
      },
    ],
    review: ['q-s28-contact', 'q-s30-kelvin', 'q-s25-legend', 'q-s17-a0'],
  },
  {
    id: 'well', title: 'Forming the n-well',
    intro: 'Getting the dopant into the right place: two ways to put arsenic into silicon, how the oxide stencil stops it, and the reset that ends every cycle.',
    steps: [
      {
        id: 'well-methods', title: 'Diffusion or implantation', scene: FAB('n-well-strip'), sources: [T2(35)],
        factIds: ['s35-methods', 's35-diffusion', 's35-implant'],
        text: 'There are two ways to get arsenic into the exposed silicon. In diffusion the wafer sits in a furnace with arsenic gas and is heated until As atoms diffuse into the surface; the depth and amount depend on temperature and time. In ion implantation the wafer is blasted with a beam of As ions accelerated to a chosen energy, which sets how deep they go, and the beam current counts exactly how many arrive. The second gives finer control.',
        example: { kind: 'demo', text: 'Step to the n-well formation and watch the ion rain: each streak is an ion; where it stops depends on what it hits.' },
        checks: ['q-l10-depth'],
      },
      {
        id: 'well-block', title: 'The oxide stencil', scene: FAB('nwell-implant'), sources: [T2(35)],
        factIds: ['s35-block'],
        text: 'The oxide left from the last cycle now does its job. Arsenic ions that hit the oxide stop inside it and never reach the silicon; only the ions that land in the window enter the wafer. The well therefore forms exactly where the mask said, and nowhere else. The same idea, a layer that blocks dopants, returns several times later in the process.',
        example: { kind: 'demo', text: 'Look at where the ions end: those over the oxide stop at its top surface; those in the window sink into the silicon.' },
        checks: ['q-l10-blocked'],
      },
      {
        id: 'well-strip', title: 'Strip, and repeat', scene: FAB('nwell-implant'), sources: [T2(36)],
        factIds: ['s36-strip', 's36-similar'],
        text: 'With the well in place, the oxide stencil is no longer needed, so HF strips it off and the wafer is bare again, now with an n-well. That completes the first full cycle: oxide, resist, expose, develop, etch, strip resist, dope, strip oxide. Every later layer is patterned with a similar series of steps, so once you understand this one, the rest of the process reads the same way.',
        example: { kind: 'demo', text: 'Scrub back and forth across the n-well group on the timeline: eight steps, one new region.' },
        checks: ['q-l10-strip'],
      },
    ],
    review: ['q-s35-diff', 'q-s33-acid', 'q-s29-implant'],
  },
]
