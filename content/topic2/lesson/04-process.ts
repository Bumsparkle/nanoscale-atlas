import { act, calc, CELL, FAB, H, label, predict, recall, SECTION27 } from '../questions/_kit'
import { T2 } from '../../../src/sources'
import type { LessonSection } from '../../../src/learn/schema'

/** Sections 11–13: the gate stack, self-aligned diffusions, wiring. */
export const questions = [
  // 11 · gate stack
  calc('q-l11-layers', 37, ['s37-thickness'], 'Taking about 2.8 Å per atomic layer of oxide, how thick are 6 layers, in nm?', 1.68, 0.02, 'nm',
    [H('Multiply, then convert ångström to nanometres.')], '6 × 2.8 Å = 16.8 Å = 1.68 nm: just under 20 Å.', { scene: { layer: 'oxide' } }),
  label('q-l11-control', 37, ['s37-gox', 's37-thickness'], 'Click the layer whose thickness sets how strongly the gate controls the channel.', ['oxide-film'], { layer: 'oxide' },
    [H('The gate acts through a capacitor. Which layer is its dielectric?', 'oxide-poly')], 'The gate oxide: the thinner it is, the larger the gate capacitance and the stronger its control of the channel.'),
  predict('q-l11-grains', 37, ['s37-poly', 's37-cvd'], 'Silicon is about to be deposited from silane onto the amorphous gate oxide, which offers no crystal to copy. Predict its structure.', FAB('gate-ox'),
    ['many small grains: polysilicon', 'one single crystal', 'more amorphous oxide', 'aluminium'], 0,
    { view: 'fab', step: 'gate-poly' }, 'Crystals nucleate all over the oxide and grow into each other: polysilicon.',
    [H('Each tiny crystal starts wherever it can, with no template to line up with.')], 'Without a crystal underneath to align to, silicon nucleates in many places at once and forms grains: polysilicon.'),
  act('q-l11-length', 38, ['s38-pattern'], 'Step to the moment the channel length of both transistors is fixed for good.', FAB('gate-develop'),
    { kind: 'fab', steps: ['gate-etch'] }, { view: 'fab', step: 'gate-etch' },
    [H('The channel length is the width of something. When does that something get its final shape?')], 'The poly etch: once the poly is patterned, its width is the channel length of each transistor.'),

  // 12 · self-aligned
  label('q-l12-welltap', 39, ['s39-forms', 's39-expose'], 'This implant also makes the connection that will hold the n-well at VDD. Click it.', ['well-tap'], FAB('n-implant'),
    [H('Look inside the well, away from the pMOS.', 'nwell')], 'The n+ well tap: the n-diffusion forms the nMOS source and drain and the n-well contact.'),
  predict('q-l12-shift', 40, ['s40-selfaligned', 's40-pattern'], 'Suppose the poly mask had landed 1λ to the right of its intended place. Predict what happens to the nMOS channel after the n+ implant.', FAB('n+-strip'),
    ['it moves with the gate and keeps its length', 'it gets 1λ shorter', 'source and drain short together', 'the implant fills the channel'], 0,
    { view: 'fab', step: 'n-implant' }, 'Source and drain form on either side of wherever the gate is.',
    [H('What decides where the source and drain stop?', 'poly-gate')], 'The gate itself blocks the implant, so source and drain always end at its edges, wherever it is: the self-aligned process.'),
  recall('q-l12-metal', 40, ['s40-poly-better', 's41-history', 's42-strip'], 'A designer proposes aluminium instead of polysilicon for the gates in this flow. What goes wrong?', ['aluminium cannot be etched', 'the gates would not survive the hot steps that follow', 'aluminium is an insulator', 'nothing: it would work better'], 1,
    [H('List what happens to the wafer after the gates are made.')], 'Several hot steps follow the gate (diffusion, oxidation); aluminium would melt. Polysilicon survives them, which is what makes the self-aligned gate possible.'),
  act('q-l12-pplus', 43, ['s43-pdiff'], 'Step to where the pMOS source and drain are formed.', FAB('p+-strip'),
    { kind: 'fab', steps: ['p-implant'] }, { view: 'fab', step: 'p-implant' },
    [H('Repeat the n+ sequence with the other dopant type.')], 'The p+ implant: same steps as n+, with an acceptor.'),
  label('q-l12-tap', 43, ['s43-xsec'], 'Click the p+ region that is not part of any transistor.', ['substrate-tap'], SECTION27,
    [H('Not every heavily doped region is a source or drain. Look at the ends of the line.', 'metal-gnd')], 'The substrate tap at the far left: p+ for a good contact to the p substrate, wired to GND.'),

  // 13 · wiring
  label('q-l13-fox', 44, ['s44-fox', 's44-why'], 'Click the layer that stops the metal from touching every diffusion at once.', ['field-oxide'], FAB('fox'),
    [H('It is the thick layer just deposited.')], 'The thick field oxide: it insulates the wiring from the silicon everywhere except at the contact cuts.'),
  calc('q-l13-cuts', 44, ['s44-cuts'], 'How many contact cuts does this inverter need along its section line?', 6, 0.01, 'cuts',
    [H('Count every region that a wire must reach: both taps, and the source and drain of each transistor.')], 'Substrate tap, nMOS source, nMOS drain, pMOS drain, pMOS source, well tap: six.', { scene: { layer: 'cell', view: 'section', section: 'slide27' }, d: 1 }),
  act('q-l13-wires', 45, ['s45-pattern', 's45-sputter'], 'Step to the first moment GND, Y and VDD are separate wires.', FAB('al'),
    { kind: 'fab', steps: ['metal-etch'] }, { view: 'fab', step: 'metal-etch' },
    [H('Right after deposition the metal is one continuous sheet.')], 'The metal etch: the sputtered sheet is patterned into three wires.'),
]

export const sections: LessonSection[] = [
  {
    id: 'gate', title: 'The gate stack',
    intro: 'The thinnest and most critical layers in the device: an oxide a few atoms thick, and a polysilicon gate deposited from gas and patterned to set the channel length.',
    steps: [
      {
        id: 'gate-oxide', title: 'A gate oxide a few atoms thick', scene: { layer: 'oxide' }, sources: [T2(37)],
        factIds: ['s37-gox', 's37-thickness'],
        text: 'The gate acts on the channel through a capacitor, and a capacitor’s strength grows as its dielectric gets thinner. So the gate oxide is made as thin as it can be while still insulating: under 20 Å, just six or seven atomic layers of SiO₂. It must also be extremely clean, because any defect in so thin a layer can let current leak or break it down. Here a very thin layer is deposited right after the n-well.',
        example: { kind: 'worked', text: '20 Å is 2 nm. In the 3D cell the oxide is drawn 50 times thicker so you can see it at all; at true scale it would be thinner than the lines on screen.' },
        checks: ['q-l11-layers', 'q-l11-control'],
      },
      {
        id: 'gate-poly', title: 'Polysilicon from silane', scene: FAB('gate-ox'), sources: [T2(37)],
        factIds: ['s37-cvd', 's37-poly', 's37-doped'],
        text: 'The gate electrode is silicon deposited by chemical vapour deposition. The wafer sits in a furnace with silane gas, SiH₄, which breaks down on the hot surface and leaves silicon behind. Because it lands on oxide rather than on a crystal, it cannot grow as one ordered array; it forms many small crystals instead, called polysilicon. On its own that would conduct poorly, so it is heavily doped to make it a good conductor.',
        example: { kind: 'demo', text: 'Step through the deposition: the grainy texture on the new layer is the polysilicon’s crystal grains.' },
        checks: ['q-l11-grains'],
      },
      {
        id: 'gate-pattern', title: 'Patterning the gates', scene: FAB('gate-develop'), sources: [T2(38)],
        factIds: ['s38-pattern'],
        text: 'The polysilicon covers the whole wafer, so it is patterned with the same lithography cycle as the oxide: resist, expose through the poly mask, develop, etch. What remains is the gate line. Its width across each transistor will become the distance between source and drain, so this etch is the most precise step in the process.',
        example: { kind: 'demo', text: 'Compare the step before and after the poly etch: the sheet becomes a single U-shaped line crossing both transistors.' },
        checks: ['q-l11-length'],
      },
    ],
    review: ['q-s37-layers', 'q-s37-poly', 'q-s30-grow', 'q-s34-next'],
  },
  {
    id: 'diffusion', title: 'Self-aligned source and drain',
    intro: 'Why the gate is made before the source and drain: it becomes its own mask, so the transistors line up perfectly without any alignment at all.',
    steps: [
      {
        id: 'diffusion-windows', title: 'Opening the n+ windows', scene: FAB('n-ox'), sources: [T2(39)],
        factIds: ['s39-expose', 's39-forms'],
        text: 'The next cycle places n+ dopants. Oxide is grown over everything, then masking opens it where n+ should be diffused or implanted. The n+ mask opens two areas: one over the whole nMOS, and one small area inside the n-well. That small area is not a transistor; it becomes the contact that ties the well to its rail.',
        example: { kind: 'demo', text: 'Step through the n+ group: the window over the nMOS spans the gate, and the gate is still covered by its own poly.' },
        checks: ['q-l12-welltap'],
      },
      {
        id: 'diffusion-self-aligned', title: 'The gate is its own mask', scene: FAB('n+-strip'), sources: [T2(40), T2(41)],
        factIds: ['s40-pattern', 's40-selfaligned'],
        text: 'Inside the nMOS window the polysilicon gate is already in place, and it blocks the dopants just as the oxide does. The n+ regions form on either side of it and stop exactly at its edges. Source and drain line up with the gate automatically, with no need to align a second mask to it: this is the self-aligned process, and it is why the gate comes first.',
        example: { kind: 'demo', text: 'Watch the n+ implant: the ions that hit the poly stop in it, and the channel below stays p-type.' },
        checks: ['q-l12-shift'],
      },
      {
        id: 'diffusion-poly', title: 'Why the gate is polysilicon', scene: FAB('n-implant'), sources: [T2(40), T2(41), T2(42)],
        factIds: ['s40-poly-better', 's41-history', 's42-strip'],
        text: 'Making the gate first only works if it survives everything that follows, and several later steps are hot. That rules out metal, which would melt; polysilicon does not, so it is the better material for self-aligned gates. A note on names: dopants were once diffused in from gas, and today they are usually implanted, but the regions are still called diffusion. Stripping the oxide completes this patterning step.',
        example: { kind: 'demo', text: 'Scrub through the steps after the gate is formed and count the furnace glows the poly has to survive.' },
        checks: ['q-l12-metal'],
      },
      {
        id: 'diffusion-pplus', title: 'The p+ regions', scene: FAB('p+-strip'), sources: [T2(43)],
        factIds: ['s43-pdiff'],
        text: 'A similar series of steps forms the p+ regions: oxide, mask with the p+ pattern, implant an acceptor, strip. The p+ diffusion makes the pMOS source and drain, again self-aligned to the poly, and the substrate contact.',
        example: { kind: 'demo', text: 'Watch the colour of the ion beam change: warm for the acceptor this time.' },
        checks: ['q-l12-pplus'],
      },
      {
        id: 'diffusion-section', title: 'The cross-section so far', scene: SECTION27, sources: [T2(43)],
        factIds: ['s43-xsec'],
        text: 'Read the section along the dashed line now that both implants are done. From the left: a p+ region under GND, the nMOS’s two n+ regions either side of its gate, the pMOS’s two p+ regions in the well, and an n+ region under VDD. Six heavily doped regions: p+ n+ n+ p+ p+ n+.',
        example: { kind: 'demo', text: 'Locked on the dashed line, the callouts name each diffusion and its role.' },
        checks: ['q-l12-tap'],
      },
    ],
    review: ['q-s40-sa-r', 'q-s43-sub', 'q-s26-left', 'q-s37-nm'],
  },
  {
    id: 'wiring', title: 'Wiring the chip',
    intro: 'The devices are finished; now they must be connected: insulate everything, open contacts where wires must reach down, and pattern a metal layer into wires.',
    steps: [
      {
        id: 'wiring-insulate', title: 'Insulate everything first', scene: FAB('p-strip-ox'), sources: [T2(44)],
        factIds: ['s44-why', 's44-fox'],
        text: 'Now the devices must be wired together. Metal laid straight onto the wafer would connect every region it touched, so the chip is first covered with a thick field oxide. Only where a wire genuinely needs to reach the silicon will the oxide be opened.',
        example: { kind: 'demo', text: 'Step to the field oxide: one thick transparent layer buries the gates and diffusions alike.' },
        checks: ['q-l13-fox'],
      },
      {
        id: 'wiring-contacts', title: 'Contact cuts', scene: FAB('contacts-develop'), sources: [T2(44)],
        factIds: ['s44-cuts'],
        text: 'The contact mask marks the few places where metal must touch silicon, and the oxide is etched there to make contact cuts. Each cut lands on a heavily doped region, so the metal–silicon connection is a good ohmic contact rather than a diode.',
        example: { kind: 'demo', text: 'Step through the contact etch and count the holes that open along the section line.' },
        checks: ['q-l13-cuts'],
      },
      {
        id: 'wiring-metal', title: 'Metalization', scene: FAB('al'), sources: [T2(45)],
        factIds: ['s45-sputter', 's45-pattern'],
        text: 'Aluminium is sputtered over the whole wafer: atoms knocked off a target land everywhere, filling the contact cuts and covering the oxide. One last lithography cycle patterns it, removing the excess metal and leaving the wires: GND, the output Y and VDD.',
        example: { kind: 'demo', text: 'Play the last group of steps: the bright sheet arrives, then the resist pattern, then the metal is etched away between the wires.' },
        checks: ['q-l13-wires'],
      },
    ],
    review: ['q-s44-cuts-p', 'q-s45-how', 'q-s40-n', 'q-s15-table'],
  },
]
// keep CELL referenced for future steps that return to the finished cell
void CELL
