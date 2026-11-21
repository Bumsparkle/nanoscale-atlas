import { act, calc, CELL, H, LAYOUT, recall } from '../questions/_kit'
import { T2 } from '../../../src/sources'
import type { LessonSection } from '../../../src/learn/schema'

/** Sections 14–15: layout and λ, design rules. Do questions edit the real masks. */
export const questions = [
  // 14 · layout and λ
  recall('q-l14-cost', 46, ['s46-mindim', 's46-masks'], 'Two mask sets implement the same inverter; one has smaller minimum dimensions. Which inverter is cheaper to make, and why?', ['the larger one: its masks are easier to make', 'the smaller one: each wafer yields more chips', 'they cost the same: the masks are the same shape', 'the larger one: it has fewer transistors'], 1,
    [H('Each wafer costs roughly the same to process, whatever is printed on it.')], 'Smaller minimum dimensions make smaller transistors and cells, so more fit on a wafer of fixed cost; they are also faster and use less power.'),
  calc('q-l14-lambda', 46, ['s46-lambda', 's46-f'], 'In a 0.35 µm process, what is λ?', 0.175, 0.001, 'µm',
    [H('The rules are written in units of half the feature size.')], 'λ = f/2 = 0.35/2 = 0.175 µm.'),
  act('q-l14-pl3', 46, ['s46-lambda', 's46-example', 's46-f'], 'Make the pMOS channel 3λ long without breaking any design rule.', LAYOUT(true),
    { kind: 'layoutClean', pmosL: 3 }, { edits: [{ mask: 'poly', index: 1, side: 'x1', value: 36 }] },
    [H('The channel length is the poly width across the diffusion.', 'mask-poly')], 'Widen the pMOS poly leg from 2λ to 3λ (x = 35 → 36): L = 3λ = 0.9 µm, and every rule still holds.', { d: 2 }),
  calc('q-l14-scale', 46, ['s46-improve'], 'Starting from 0.6 µm, what is the feature size after two 30 % improvements?', 0.294, 0.002, 'µm',
    [H('Each improvement multiplies the size by the same factor.')], '0.6 × 0.7 × 0.7 = 0.294 µm. At about one improvement every three years, that is roughly six years.'),
  calc('q-l14-area', 48, ['s48-min', 's48-um', 's48-spec'], 'In the f = 0.6 µm process, what is the gate area of the minimum (4λ / 2λ) transistor?', 0.72, 0.005, 'µm²',
    [H('Convert both dimensions to µm, then multiply.')], '4λ = 1.2 µm and 2λ = 0.6 µm, so the gate area is 1.2 × 0.6 = 0.72 µm².'),
  act('q-l14-p8', 48, ['s48-sizing', 's48-layout'], 'Edit the layout so the pMOS is twice as wide as the nMOS (W = 8λ) with every design rule still met.', LAYOUT(true),
    { kind: 'layoutClean', pmosW: 8 }, { edits: [{ mask: 'nwell', index: 0, side: 'y1', value: 14 }, { mask: 'pplus', index: 1, side: 'y1', value: 8 }] },
    [H('Widening the p+ diffusion brings it closer to the edge of the well. What else must move?', 'mask-nwell')], 'Raise the top of the p+ diffusion to y = 8 (W = 8λ), and move the n-well edge up to y = 14 so the diffusion stays 6λ inside it. The gate still overhangs by 4λ.', { d: 3 }),

  // 15 · design rules
  act('q-l15-short', 47, ['s47-ext', 's47-poly', 's47-conservative'], 'Edit the layout so that a small misalignment of the poly mask could connect the nMOS source straight to its drain.', LAYOUT(true),
    { kind: 'layoutViolation', rule: 'poly.gateExtension' }, { edits: [{ mask: 'poly', index: 0, side: 'y0', value: -1 }] },
    [H('A gate must reach fully across its diffusion, with some to spare.', 'mask-poly')], 'Pull the bottom end of the nMOS gate up to within 1λ of the diffusion: the 2λ gate extension rule now fails, and a slight shift could leave a gap for the source and drain to meet.'),
  calc('q-l15-bus', 47, ['s47-m1', 's47-m2'], 'Three metal1 wires run side by side at minimum width and minimum spacing. How wide is the bundle, in λ?', 20, 0.01, 'λ',
    [H('Count three widths and the gaps between them.')], '3 × 4λ + 2 × 4λ = 20λ.'),
  act('q-l15-thin', 47, ['s47-m1', 's47-diff'], 'Edit the output wire Y until the rules reject it for being too narrow.', LAYOUT(true),
    { kind: 'layoutViolation', rule: 'metal1.width' }, { edits: [{ mask: 'metal', index: 2, side: 'y1', value: 3 }] },
    [H('Drag one of the long edges of the middle wire.', 'mask-metal')], 'Narrowing the Y wire to 3λ breaks the 4λ metal1 width rule (and leaves its contacts poorly covered).'),
  calc('q-l15-well', 47, ['s47-well-out', 's47-well-in'], 'The nMOS diffusion ends at x = 16λ. What is the smallest x the n-well’s left edge may have?', 22, 0.01, 'λ',
    [H('Diffusion outside the well must keep a fixed distance from its edge.')], 'Diffusion outside the well must stay 6λ away: 16λ + 6λ = 22λ, exactly where the edge is drawn.'),
  act('q-l15-cut', 47, ['s47-cdiff', 's47-cpoly', 's47-via'], 'Move the pMOS drain contact so the diffusion no longer surrounds it properly.', LAYOUT(true),
    { kind: 'layoutViolation', rule: 'contact.diffSurround' }, { edits: [{ mask: 'contact', index: 3, side: 'x0', value: 27 }] },
    [H('The contact sits 1λ inside the p+ diffusion. Push one of its edges outwards.', 'mask-pplus')], 'Dragging the left edge of the pMOS drain contact out past the diffusion breaks the 1λ surround (and the contact’s fixed 2λ size).'),
  recall('q-l15-longer', 49, ['s49-masks', 's49-stack', 's49-switches'], 'Which single change to the masks gives the nMOS a longer channel?', ['widen the nMOS poly leg', 'widen the n+ diffusion', 'move the contacts apart', 'thicken the metal'], 0,
    [H('The channel length is the distance between source and drain. What sets that distance?')], 'Widening the poly leg: source and drain are self-aligned to the gate, so the poly width is the channel length.'),
]

export const sections: LessonSection[] = [
  {
    id: 'lambda', title: 'Layout and λ',
    intro: 'How a chip is specified by its masks, why design rules are written in λ, and what the minimum transistor looks like, including a wording trap in the lecture.',
    steps: [
      {
        id: 'lambda-masks', title: 'A chip is a set of masks', scene: LAYOUT(), sources: [T2(46)],
        factIds: ['s46-masks', 's46-mindim'],
        text: 'Everything about a chip is specified by its set of masks. Their minimum dimensions set the size of each transistor, and transistor size drives everything else: smaller transistors switch faster and use less power, and more of them fit on a wafer whose processing cost is roughly fixed. Layout is the work of drawing those masks.',
        example: { kind: 'demo', text: 'Hover any edge in the Layout view: each one is constrained by at least one rule about how small or close it may be.' },
        checks: ['q-l14-cost'],
      },
      {
        id: 'lambda-f', title: 'Feature size and λ', scene: LAYOUT(true), sources: [T2(46)],
        factIds: ['s46-f', 's46-lambda', 's46-example'],
        text: 'The feature size f is the distance between source and drain, which is set by the minimum width of polysilicon. Processes are named by it. To keep one set of design rules useful across processes, the rules are written in a normalised unit, λ = f/2. A layout drawn in λ can then be scaled to a new process by changing a single number: for example λ = 0.3 µm in a 0.6 µm process.',
        example: { kind: 'worked', text: 'A 4λ metal wire in a 0.6 µm process: 4 × 0.3 = 1.2 µm. The same layout in a 0.5 µm process: 4 × 0.25 = 1.0 µm.' },
        checks: ['q-l14-lambda', 'q-l14-pl3'],
      },
      {
        id: 'lambda-scaling', title: 'Scaling', scene: LAYOUT(), sources: [T2(46)],
        factIds: ['s46-improve'],
        text: 'Feature size improves by about 30 % every three years or so. That steady shrink is why normalising rules to λ is worth the trouble: the same design can follow the process downwards, and the gains in speed, cost and power compound.',
        example: { kind: 'worked', text: 'One 30 % step from 1.0 µm gives 1.0 × 0.7 = 0.7 µm. Area scales with the square: 0.7² ≈ 0.49, about half the area for the same circuit.' },
        checks: ['q-l14-scale'],
      },
      {
        id: 'lambda-minimum', title: 'The minimum transistor', scene: LAYOUT(), sources: [T2(46), T2(48)],
        factIds: ['s48-spec', 's48-min', 's48-um'],
        text: 'The smallest transistor the rules allow is 4λ / 2λ, sometimes called 1 unit: in the 0.6 µm process, 1.2 µm and 0.6 µm. Which is the length? The channel length is the source-to-drain distance, the poly width, which is 2λ = 0.6 µm; the width is the diffusion under the gate, 4λ = 1.2 µm. Beware: the lecture writes the ratio as "Length / Width" and calls the device "0.6 µm wide, 1.2 µm long", the opposite way round. The drawn layout, and the definition of f, give L = 0.6 µm and W = 1.2 µm.',
        example: { kind: 'demo', text: 'Read the callouts above the gates in the Layout view: W/L = 4λ / 2λ for both transistors.' },
        checks: ['q-l14-area'],
      },
      {
        id: 'lambda-sizing', title: 'Sizing the pMOS', scene: LAYOUT(true), sources: [T2(10), T2(48)],
        factIds: ['s48-sizing', 's48-layout'],
        text: 'The lecture’s own inverter layout runs vertically, with VDD along the top, GND along the bottom, A entering on the left and Y leaving on the right. It does not use two minimum transistors: the pMOS is 8/2, two units, beside a 4/2 nMOS of one unit. Holes are less mobile than electrons, so a pMOS of the same size conducts less; making it twice as wide evens out the pull-up and pull-down strengths.',
        example: { kind: 'worked', text: 'Widening a diffusion inside the n-well moves it towards the well’s edge, so the well must grow with it to keep its 6λ margin. Edits interact.' },
        checks: ['q-l14-p8'],
      },
    ],
    review: ['q-s46-ex', 'q-s48-l', 'q-s28-diff', 'q-s45-wires'],
  },
  {
    id: 'rules', title: 'Design rules',
    intro: 'Why every edge in a layout has a minimum size or spacing, what the simplified rules are, and how to see each one fail on the real masks.',
    steps: [
      {
        id: 'rules-why', title: 'Rules protect against imperfect printing', scene: LAYOUT(true), sources: [T2(47)],
        factIds: ['s47-conservative', 's47-poly', 's47-ext'],
        text: 'Masks never print exactly as drawn: layers shift slightly relative to each other and edges etch a little wider or narrower. Design rules leave margins for that. The lecture’s simplified rules are deliberately conservative, a safe set to start with. Polysilicon must be at least 2λ wide and 3λ from other poly. A gate must also overhang the diffusion it crosses by 2λ: if it stopped exactly at the edge, a slight shift would leave a gap where source and drain could meet.',
        example: { kind: 'demo', text: 'Hover the bottom end of a poly leg: the tooltip shows the 2λ overhang rule and marks it as met exactly at the minimum.' },
        checks: ['q-l15-short'],
      },
      {
        id: 'rules-wires', title: 'Diffusion and metal', scene: LAYOUT(true), sources: [T2(47)],
        factIds: ['s47-diff', 's47-m1', 's47-m2'],
        text: 'Diffusion regions must be at least 4λ wide and 4λ apart. Metal1, the wiring layer, follows the same 4λ width and 4λ spacing, and so does metal2, the next wiring layer up (not needed for an inverter). Wider-than-minimum wires are always allowed; narrower ones risk breaking, and closer ones risk shorting.',
        example: { kind: 'worked', text: 'Two minimum metal1 wires side by side take 4λ + 4λ + 4λ = 12λ: two widths and one gap. The pitch, centre to centre, is 8λ.' },
        checks: ['q-l15-bus', 'q-l15-thin'],
      },
      {
        id: 'rules-wells', title: 'Wells and contacts', scene: LAYOUT(true), sources: [T2(47)],
        factIds: ['s47-well-in', 's47-well-out', 's47-cdiff', 's47-cpoly', 's47-via'],
        text: 'The n-well edge is poorly defined after the dopant spreads, so diffusion must keep 6λ clear of it on both sides: 6λ inside for the pMOS regions, 6λ outside for the nMOS ones. Contacts are 2λ squares, and the metal above and the diffusion below must each surround a contact by 1λ so that the cut always lands completely on both. Vias between metal1 and metal2 must be 3λ apart.',
        example: { kind: 'worked', text: 'A contact with a 1λ surround needs a diffusion at least 1 + 2 + 1 = 4λ wide, which is exactly the minimum diffusion width.' },
        checks: ['q-l15-well', 'q-l15-cut'],
      },
      {
        id: 'rules-summary', title: 'From atoms to layout', scene: CELL, sources: [T2(49)],
        factIds: ['s49-stack', 's49-switches', 's49-masks'],
        text: 'Pulling it together: a MOS transistor is a stack of gate, oxide and silicon that behaves as an electrically controlled switch. Logic gates are built from those switches, complementary networks of nMOS and pMOS. And the whole circuit is specified by drawing masks that obey the design rules. That is enough to design the schematic and the layout of a simple chip.',
        example: { kind: 'demo', text: 'Switch between Section, Fab and Layout on the finished cell: three views of the same six masks.' },
        checks: ['q-l15-longer'],
      },
    ],
    review: ['q-s47-m1-c', 'q-s47-cd', 'q-s46-lambda', 'q-s12-high'],
  },
]
