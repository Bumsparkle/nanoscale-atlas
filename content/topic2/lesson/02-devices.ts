import { act, calc, CELL, H, label, LOGIC, predict, recall } from '../questions/_kit'
import { T2 } from '../../../src/sources'
import type { LessonSection } from '../../../src/learn/schema'

/** Sections 4–7: the MOS transistor, pMOS and switches, the inverter, NAND and NOR. */
const FET = (device: 'nmos' | 'pmos', vg: number) => ({ layer: 'transistor' as const, device, vg })

export const questions = [
  // 4 · MOS
  label('q-l04-fast', 10, ['s10-nchannel', 's10-pchannel'], 'All else being equal, which transistor in this inverter can switch its output faster? Click one of its diffusions.', ['nmos-source', 'nmos-drain'], CELL,
    [H('Compare the carriers that form each channel.', 'poly-gate')], 'The nMOS: its channel carries electrons, which are more mobile than the holes in the pMOS channel. That is why p-channel technology was slow.'),
  label('q-l04-cap', 11, ['s11-capacitor', 's11-structure'], 'Click the part that stops any steady current flowing from the gate into the silicon.', ['gate-oxide'], CELL,
    [H('The gate stack is a capacitor; which layer is the dielectric?', 'poly-gate')], 'The gate oxide: SiO₂ is an excellent insulator, so the gate acts on the channel only through its electric field.'),
  predict('q-l04-off', 12, ['s12-low', 's12-body'], 'Drain at VDD, source and body at GND, and the gate at 0 V. Predict the drain current.', FET('nmos', 0),
    ['essentially zero', 'a large current from drain to source', 'a current from gate to drain', 'a current from body to drain'], 0,
    { vg: 0.15 }, 'Even with the gate nudged up, nothing flows: no channel has formed yet.',
    [H('Between n+ drain and p body there is a junction. Which way is it biased?', 'nmos-drain')], 'Source–body and drain–body are p-n junctions. With the drain high and the body at GND, the drain–body diode is reverse biased, so no current flows: OFF.'),
  act('q-l04-on', 12, ['s12-high', 's12-on'], 'Make current flow from source to drain in this transistor.', FET('nmos', 0), { kind: 'vg', device: 'nmos', on: true }, { vg: 1 },
    [H('Something has to bridge the two n+ regions through the p body.')], 'Raise the gate: positive charge on it pulls electrons to the surface until the channel inverts to n-type and joins source to drain.'),

  // 5 · pMOS, supply, switches
  label('q-l05-body', 13, ['s13-body', 's13-reversed'], 'This pMOS’s body has to sit at the highest voltage in the circuit. Click where that connection is made.', ['well-tap'], CELL,
    [H('The pMOS body is the n-well. Where does metal touch it?', 'nwell')], 'The n+ well tap under the VDD rail ties the n-well, the pMOS body, to VDD.'),
  calc('q-l05-energy', 13, ['s13-vdd-modern', 's13-vdd-why'], 'Switching energy scales with VDD² (beyond the lecture). By what factor does it fall when VDD drops from 2.5 V to 1.0 V?', 6.25, 0.01, '×',
    [H('Square the ratio of the two supply voltages.')], '(2.5 / 1.0)² = 6.25. A lower VDD saves power, and it also spares tiny transistors from high fields.'),
  calc('q-l05-both', 14, ['s14-nmos', 's14-pmos', 's14-switch'], 'An nMOS and a pMOS share the same gate signal g. Try g = 0, then g = 1. Adding up both cases, how many times does a transistor conduct?', 2, 0.01, 'times',
    [H('Look at what each one does at g = 0 and at g = 1.')], 'Once per case, so twice: at g = 0 the pMOS is closed and the nMOS open; at g = 1 the reverse. Exactly one conducts for any g.', { d: 1 }),

  // 6 · inverter
  label('q-l06-node', 15, ['s15-inv-schematic'], 'Click the node whose voltage the two transistors fight over: the one they both connect to.', ['metal-y'], LOGIC('inverter', 0),
    [H('One transistor connects it towards VDD, the other towards GND.', 'metal-vdd')], 'Y: the wire joining the pMOS drain and the nMOS drain.'),
  predict('q-l06-a1', 16, ['s16-a1', 's15-inv-table'], 'A is 0. Predict which rail the output wire lights up to when you set A = 1.', LOGIC('inverter', 0),
    ['the GND rail', 'the VDD rail', 'both rails', 'neither: Y floats'], 0,
    { inputs: { a: 1, b: 0 } }, 'The pull-down path lights: Y is tied to GND.',
    [H('A high gate closes which kind of switch?', 'nmos-source')], 'A = 1 closes the nMOS and opens the pMOS, so Y connects only to GND: Y = 0.'),
  act('q-l06-high', 17, ['s17-a0', 's17-one-on'], 'Put the inverter in the state where its output is tied to VDD.', LOGIC('inverter', 1),
    { kind: 'gate', gate: 'INV', y: 1 }, { inputs: { a: 0, b: 0 } },
    [H('Which input closes the pull-up switch?', 'pmos-source')], 'Set A = 0: the pMOS closes, the nMOS opens, and Y is pulled up to VDD.'),

  // 7 · NAND / NOR
  act('q-l07-bothp', 18, ['s18-schematic'], 'On the NAND, find the input where both pull-up transistors conduct.', LOGIC('nand', 1, 1),
    { kind: 'gate', gate: 'NAND', a: 0, b: 0 }, { inputs: { a: 0, b: 0 } },
    [H('Each pull-up pMOS conducts only while its own input is low.')], 'A = B = 0: both parallel pMOS are closed (and both series nMOS open).'),
  predict('q-l07-01', 20, ['s19-row00', 's20-row01'], 'The NAND has A = 0, B = 0. Predict the output when you raise B.', LOGIC('nand', 0, 0),
    ['Y = 1', 'Y = 0', 'Y floats'], 0,
    { inputs: { a: 0, b: 1 } }, 'Still 1: the A pMOS holds Y up, and the series pull-down is broken by the A nMOS.',
    [H('Is the series pull-down complete with only B high?')], 'One series switch open (A nMOS) is enough to block the pull-down; one parallel switch closed (A pMOS) is enough to pull up. Y = 1.'),
  act('q-l07-low', 22, ['s21-row10', 's22-row11', 's22-table'], 'Starting from A = 1, B = 0, make the NAND output 0.', LOGIC('nand', 1, 0),
    { kind: 'gate', gate: 'NAND', y: 0 }, { inputs: { a: 1, b: 1 } },
    [H('What is still stopping the series nMOS path from conducting?')], 'Raise B too: with A = B = 1 both series nMOS close and both pMOS open, the only row where NAND gives 0.'),
  act('q-l07-nor', 23, ['s23-table', 's23-schematic'], 'Starting from A = 0, B = 1, make the NOR output 1.', LOGIC('nor', 0, 1),
    { kind: 'gate', gate: 'NOR', y: 1 }, { inputs: { a: 0, b: 0 } },
    [H('In the NOR the pull-up switches are in series. What do they both need?')], 'Lower B: only A = B = 0 closes both series pMOS. Any 1 closes a parallel nMOS and pulls Y down.'),
  recall('q-l07-demorgan', 23, ['s23-symbol', 's18-symbol'], 'A gate is drawn as an AND with bubbles on both inputs and none on the output. Which gate is it?', ['NAND', 'NOR', 'OR', 'inverter'], 1,
    [H('Write the output as an expression in the inverted inputs, then apply De Morgan.')], '(NOT A) AND (NOT B) = NOT (A OR B): a NOR.'),
]

export const sections: LessonSection[] = [
  {
    id: 'mos', title: 'The MOS transistor',
    intro: 'How a metal–oxide–semiconductor capacitor becomes a switch: why it is off with the gate low, and how a high gate inverts a channel that joins source to drain.',
    steps: [
      {
        id: 'mos-cmos', title: 'Why CMOS won', scene: CELL, sources: [T2(10)],
        factIds: ['s10-pchannel', 's10-nchannel', 's10-cmos'],
        text: 'A MOS transistor’s speed depends on how easily its carriers move through the channel. The first and simplest technology used p-channel devices, which carry holes; holes are sluggish, so those circuits were slow. Electrons move more easily, so n-channel devices switch faster. Complementary MOS uses both kinds together. The pairing is what makes modern logic practical: in every logic state one device of each pair is off, so very little current flows when nothing is switching. That is why CMOS is the prevalent technology today.',
        example: { kind: 'demo', text: 'In the cell, the nMOS sits on the left in the p substrate and the pMOS on the right in the n-well: the complementary pair, built side by side.' },
        checks: ['q-l04-fast'],
      },
      {
        id: 'mos-capacitor', title: 'Gate, oxide, body: a capacitor', scene: { layer: 'transistor', device: 'nmos', vg: 0 }, sources: [T2(11)],
        factIds: ['s11-terminals', 's11-capacitor', 's11-mos-name', 's11-structure', 's11-symbol'],
        text: 'An nMOS has four terminals: gate, source, drain and body. Its heart is a stack of three layers: the gate, a thin layer of silicon dioxide, and the body. The gate and body both conduct and the oxide is an excellent insulator, so the stack is a capacitor: charge placed on the gate pulls opposite charge to the silicon surface without any current crossing. It is still called metal–oxide–semiconductor although the gate is now polysilicon. Source and drain are n+ regions either side of the gate.',
        example: { kind: 'demo', text: 'In the cut-away, find the thin hatched layer under the poly gate: that is the oxide, drawn 50 times thicker than it really is so you can see it.' },
        checks: ['q-l04-cap'],
      },
      {
        id: 'mos-off', title: 'Off: two diodes back to back', scene: { layer: 'transistor', device: 'nmos', vg: 0 }, sources: [T2(12)],
        factIds: ['s12-body', 's12-low'],
        text: 'From source to drain the silicon reads n+, p, n+: two p-n junctions facing in opposite directions. The body is usually tied to ground, the lowest voltage in the circuit, so neither junction can be forward biased. With the gate low, the p-type body under it is at low voltage too and there is nothing to bridge the two junctions: whichever way you try to push current between source and drain, one of the diodes blocks it. The transistor is OFF.',
        example: { kind: 'demo', text: 'Leave VG at 0 V: no carriers move between the n+ regions, and the state badge reads OFF.' },
        checks: ['q-l04-off'],
      },
      {
        id: 'mos-on', title: 'On: inverting the channel', scene: { layer: 'transistor', device: 'nmos', vg: 0 }, sources: [T2(12)],
        factIds: ['s12-high', 's12-on'],
        text: 'Raise the gate and the capacitor charges: positive charge on the gate repels holes from the silicon surface under it and attracts electrons. At a high enough gate voltage the surface holds more electrons than holes, so a thin layer of the p-type body behaves as n-type. It has been inverted. That inversion layer is an n-type path joining the n+ source to the n+ drain, so current can now flow from source through the channel to drain. The transistor is ON.',
        example: { kind: 'demo', text: 'Drag VG up slowly. Nothing happens at first; past about half of VDD a blue sheet appears under the gate and carriers start to stream (the exact turn-on point is illustrative).' },
        checks: ['q-l04-on'],
      },
    ],
    review: ['q-s12-off', 'q-s10-cmos', 'q-s05-v', 'q-s09-fwd'],
  },
  {
    id: 'pmos', title: 'pMOS, supply voltage and switches',
    intro: 'The pMOS is the nMOS mirrored; the supply voltage has fallen for good reasons; and for logic, both transistors can be treated as switches.',
    steps: [
      {
        id: 'pmos-mirror', title: 'The pMOS: everything flips', scene: { layer: 'transistor', device: 'pmos', vg: 1 }, sources: [T2(13)],
        factIds: ['s13-reversed', 's13-body', 's13-on-off', 's13-circle', 's13-structure'],
        text: 'The pMOS reverses both the doping and the voltages. Its source and drain are p+ regions in an n-type body, and that body is tied to the high supply, VDD, so its junctions can never be forward biased. To form a p-type channel the gate must pull holes to the surface, which means taking the gate low, below the body. So a low gate turns the pMOS on and a high gate turns it off. The circle drawn on the pMOS symbol’s gate marks exactly that inverted behaviour.',
        example: { kind: 'demo', text: 'Here VG starts at VDD and the pMOS is OFF. Drag it down and an orange hole channel forms under the gate.' },
        checks: ['q-l05-body'],
      },
      {
        id: 'pmos-supply', title: 'Why VDD keeps falling', scene: { layer: 'cell', view: 'explore', look: 'metal-vdd' }, sources: [T2(13)],
        factIds: ['s13-gnd', 's13-vdd-1980', 's13-vdd-modern', 's13-vdd-why'],
        text: 'GND is the 0 V reference and VDD is the supply. In the 1980s VDD was 5 V. As transistors shrank, their oxides got thinner and their channels shorter, and the same voltage across a smaller distance means a stronger field, enough to damage them. So VDD has come down step by step: 3.3, 2.5, 1.8, 1.5, 1.2 and now 1.0 V and below. Lower VDD also saves power. Beyond the lecture: the energy to switch a node is proportional to CV², so voltage is the most powerful lever.',
        example: { kind: 'worked', text: 'From 3.3 V to 1.8 V, the switching energy ratio is (1.8/3.3)² ≈ 0.30: the same circuit uses less than a third of the energy per switch.' },
        checks: ['q-l05-energy'],
      },
      {
        id: 'pmos-switches', title: 'Transistors as switches', scene: { layer: 'cell', view: 'logic', bench: { tab: 'switch', g: 0 } }, sources: [T2(14)],
        factIds: ['s14-switch', 's14-nmos', 's14-pmos'],
        text: 'For logic you can forget the analogue details and treat each transistor as an electrically controlled switch: the gate voltage decides whether the path from source to drain is open or closed. An nMOS is closed when its gate is 1 and open when it is 0. A pMOS is the opposite: closed at 0 and open at 1. That opposition is the whole trick of CMOS, as the next section shows.',
        example: { kind: 'demo', text: 'Toggle g on the Switches tab and watch the two switch symbols move in opposite directions.' },
        checks: ['q-l05-both'],
      },
    ],
    review: ['q-s13-off', 'q-s12-on-r', 'q-s13-rails', 'q-s14-n'],
  },
  {
    id: 'inverter', title: 'The CMOS inverter',
    intro: 'Two opposite switches between the rails make an inverter. Trace both inputs, and see why the output is always driven and yet almost no current flows.',
    steps: [
      {
        id: 'inverter-circuit', title: 'Two switches, one output', scene: LOGIC('inverter', 0), sources: [T2(15)],
        factIds: ['s15-inv-schematic', 's15-vdd', 's15-symbol'],
        text: 'Connect a pMOS from the supply VDD down to an output node Y, and an nMOS from Y down to GND, and drive both gates from the same input A. The pMOS can pull Y up, the nMOS can pull it down, and because one closes when the other opens, only one ever wins. The circuit is drawn as a triangle with a small circle on its output: the circle means inversion.',
        example: { kind: 'demo', text: 'Follow the cell from left to right: GND rail, nMOS, the middle wire, pMOS, VDD rail. The poly line crossing both transistors is A.' },
        checks: ['q-l06-node'],
      },
      {
        id: 'inverter-a1', title: 'A = 1', scene: LOGIC('inverter', 0), sources: [T2(15), T2(16)],
        factIds: ['s16-a1', 's15-inv-table'],
        text: 'Work through it as switches. With A high, the nMOS gate is 1, so the nMOS is closed; the pMOS gate is also 1, so the pMOS is open. Y now has a closed path to GND and no path to VDD, so it sits at 0. A high input gives a low output, the first line of the truth table.',
        example: { kind: 'worked', text: 'Write the two switch states for each input, then follow the closed switch from Y: that rail is the output. This is how every CMOS gate is analysed.' },
        checks: ['q-l06-a1'],
      },
      {
        id: 'inverter-a0', title: 'A = 0, and why it costs no power', scene: LOGIC('inverter', 1), sources: [T2(17)],
        factIds: ['s17-a0', 's17-one-on'],
        text: 'Now take A low. The pMOS gate is 0, so it closes; the nMOS opens. Y connects to VDD only and sits at 1. In both states exactly one transistor is on and the other is off, so Y is always driven to one rail and never both. That also means there is never a direct path from VDD to GND while the input is steady. Beyond the lecture: this is why a CMOS gate draws almost no current except while it switches.',
        example: { kind: 'demo', text: 'Toggle A and watch the lit path jump from one rail to the other; the middle wire is lit in both states.' },
        checks: ['q-l06-high'],
      },
    ],
    review: ['q-s15-out', 'q-s14-n-r', 'q-s13-body', 'q-s17-path'],
  },
  {
    id: 'gates', title: 'NAND and NOR',
    intro: 'Combine switches in series and in parallel to build two-input gates, walk their truth tables, and read their symbols with De Morgan’s laws.',
    steps: [
      {
        id: 'gates-networks', title: 'Series and parallel', scene: LOGIC('nand', 1, 1), sources: [T2(18)],
        factIds: ['s18-schematic'],
        text: 'Switches in series conduct only if all of them are closed: an AND of their controls. Switches in parallel conduct if any one is closed: an OR. A NAND puts two nMOS in series between Y and GND and two pMOS in parallel between VDD and Y. The networks are complementary: whenever the series path conducts, the parallel one is open, and vice versa. So, as in the inverter, Y is always driven by exactly one network.',
        example: { kind: 'demo', text: 'On the NAND tab the dashed box marks whichever network is conducting. Toggle A and B and watch it switch between top and bottom.' },
        checks: ['q-l07-bothp'],
      },
      {
        id: 'gates-nand-low-a', title: 'NAND with A = 0', scene: LOGIC('nand', 0, 0), sources: [T2(19), T2(20)],
        factIds: ['s19-row00', 's20-row01'],
        text: 'Walk the truth table one row at a time. With both inputs at 0, both pMOS are closed and both nMOS open, so Y = 1. Raising only B closes the B nMOS and opens the B pMOS. But the A nMOS is still open, and the pull-down is a series path: one open switch is enough to block it. Meanwhile the A pMOS is still closed, and one closed parallel switch is enough to pull up.',
        example: { kind: 'worked', text: 'For each row, ask two questions: is every series switch closed? Is any parallel switch closed? The answers tell you which rail Y sits on.' },
        checks: ['q-l07-01'],
      },
      {
        id: 'gates-nand-high-a', title: 'NAND with A = 1, and the table', scene: LOGIC('nand', 1, 0), sources: [T2(21), T2(22)],
        factIds: ['s21-row10', 's22-row11', 's22-table'],
        text: 'With A = 1 and B = 0 the picture mirrors the last case: the B nMOS breaks the pull-down and the B pMOS holds Y up. Only when both inputs are 1 do both series nMOS close while both parallel pMOS open, giving the single row where Y = 0. That is NAND: NOT (A AND B).',
        example: { kind: 'demo', text: 'Step A and B through all four combinations on the bench and fill in the truth table as you go before reading it.' },
        checks: ['q-l07-low'],
      },
      {
        id: 'gates-nor', title: 'The NOR gate', scene: LOGIC('nor', 0, 1), sources: [T2(23)],
        factIds: ['s23-table', 's23-schematic'],
        text: 'Swap the networks and you get NOR. Now the two pMOS are in series between VDD and Y, and the two nMOS are in parallel between Y and GND. The pull-up conducts only if both pMOS are closed, so only when A = B = 0. Any input at 1 closes one of the parallel nMOS and pulls Y down. NOR is NOT (A OR B).',
        example: { kind: 'worked', text: 'Compare with NAND: NAND has one row giving 0; NOR has one row giving 1. The series network decides which.' },
        checks: ['q-l07-nor'],
      },
      {
        id: 'gates-symbols', title: 'Reading the symbols', scene: LOGIC('nand', 0, 0), sources: [T2(18), T2(23)],
        factIds: ['s18-symbol', 's23-symbol'],
        text: 'A bubble on a gate symbol means inversion, and De Morgan’s laws let you move bubbles through a gate by swapping AND for OR. NOT (A AND B) equals (NOT A) OR (NOT B). So the NAND symbol, an AND shape with a bubble on its output, can equally be drawn as an OR shape with bubbles on both inputs. The same rule applies to every gate: push the bubbles to the other side and change the shape.',
        example: { kind: 'worked', text: 'Check one row: A = 1, B = 0. NOT (1 AND 0) = NOT 0 = 1, and (NOT 1) OR (NOT 0) = 0 OR 1 = 1. Both forms agree.' },
        checks: ['q-l07-demorgan'],
      },
    ],
    review: ['q-s23-01', 'q-s20-01-r', 'q-s16-a1', 'q-s22-rows'],
  },
]
