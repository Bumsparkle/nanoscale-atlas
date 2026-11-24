import { kit, ST } from '../../kit'
import { T4 } from '../../../src/sources'
import type { Scene } from '../../../src/learn/schema'

/** Topic 4 questions that use the model: the cleanroom, wet bench, redox ladder, gettering cross-section and yield model. */
const { act, predict, label, calc, gen } = kit('t4', T4)

const ROOM = (clean: Record<string, unknown> = {}): Scene => ({ layer: 'cleanroom', tab: 'room', clean })
const BENCH = (rca = 0): Scene => ({ layer: 'cleanroom', tab: 'wetbench', clean: { rca } })
const REDOX = (metal: string, solution: string): Scene => ({ layer: 'cleanroom', tab: 'redox', clean: { metal, solution } })
const GET = (cycle = 0, getter = 0): Scene => ({ layer: 'wafer', tab: 'gettering', clean: { cycle, getter } })
const YIELD = (D0 = 0.5, A = 1, C = 2): Scene => ({ layer: 'wafer', tab: 'yield', clean: { D0, A, C } })
const OFF = { person: false, book: false, gloves: false }

export default [
  // the clean factory (slides 2–7)
  act('cls10', ['s02-spec', 's07-class'], 'Set the room to the class that allows fewer than 10 particles ≥ 0.5 µm per cubic foot.', ROOM({ cls: 1000 }),
    ST('cleanroom', 'room', [{ path: 'clean.cls', eq: 10 }]), { clean: { cls: 10 } }, 'The class number is the count.'),
  act('cls1000', ['s07-class'], 'Set the room to class 1000.', ROOM({ cls: 10 }),
    ST('cleanroom', 'room', [{ path: 'clean.cls', eq: 1000 }]), { clean: { cls: 1000 } }, 'Watch the 1 ft³ box fill.'),
  label('chase', ['s02-diagram', 's06-plant'], 'Click the path the air takes back up to the fans, outside the clean bay.', ['service-chase'], ROOM(), 'It is beside the bay, not in the ceiling.'),
  label('hepa', ['s06-ceiling', 's06-recirc'], 'Click the filters that clean the recirculated air.', ['hepa-filter'], ROOM(), 'Air falls from them.'),
  label('fans', ['s06-ceiling'], 'Click the fans that push the air through the filters.', ['rah'], ROOM(), 'Above the filters.'),
  label('bay', ['s04-yellow'], 'Click the yellow-lit work area where the wafer sits on its chuck.', ['process-bay'], ROOM(), 'The lithography tool.'),
  act('book', ['s06-sources'], 'Switch on the paper book as a particle source.', ROOM({ sources: OFF }),
    ST('cleanroom', 'room', [{ path: 'clean.sources.book', eq: true }]), { clean: { sources: { ...OFF, book: true } } }, 'Slide 6 names books and gloves.', { obj: 'contam-book' }),
  act('gloves-src', ['s06-sources'], 'Switch on the gloves as a particle source.', ROOM({ sources: OFF }),
    ST('cleanroom', 'room', [{ path: 'clean.sources.gloves', eq: true }]), { clean: { sources: { ...OFF, gloves: true } } }, 'Gloves can contaminate too.', { obj: 'contam-gloves' }),
  label('clothing', ['s06-clothing'], 'Click what has to be worn to keep the classification.', ['operator'], ROOM(), 'Look at the people.'),
  predict('chem', ['s06-chemicals'], 'The bay is class 100 but the DI water is ordinary tap-grade. Predict the effect on the wafers.', ROOM({ cls: 1000 }),
    ['they are contaminated anyway: chemicals, gases and water must be electronic grade', 'none: only air matters', 'the wafers get cleaner', 'the class rises to 10'], 0, { clean: { cls: 100 } },
    'Filtered air is not enough: electronic-grade chemicals, gases and DI water are used too.', 'Everything that touches the wafer counts.'),
  calc('graph', ['s07-graph'], 'Class lines fall roughly as d⁻²·². How many particles ≥ 1 µm per ft³ does a class 1000 room allow, to the nearest 10?', 220, 10, 'per ft³',
    'Scale 1000 by (0.5/1)^2.2.', '1000 × (0.5/1)^2.2 = 1000 × 0.218 ≈ 220 per ft³ (the slope is beyond the lecture: FED-STD-209E).'),
  predict('settle', ['s07-methods', 's07-behaviour'], 'A person walks in without a suit. Predict what keeps their particles off the wafers.', ROOM({ sources: OFF }),
    ['the downward HEPA air sweeps them to the floor, but suits and protocols are still needed', 'nothing at all', 'the particles dissolve', 'gravity alone, instantly'], 0, { clean: { sources: { ...OFF, person: true } } },
    'Filtered recirculated air carries particles down and out, but bunny suits, filtered chemicals and protocols are all needed.', 'Slide 7 lists four measures.', { obj: 'operator' }),

  // gowning (slide 8)
  predict('wash', ['s08-wash', 's08-mouth', 's08-shoes'], 'You have just eaten lunch outside. Predict the pre-entry routine.', ROOM({ sources: OFF }),
    ['wash face and hands, rinse mouth or drink water, no smoking, clean shoes', 'go straight in', 'put on perfume', 'just change shoes'], 0, { clean: { sources: { ...OFF, person: true } } },
    'Everything you bring in sheds: wash, rinse, no smoking, no mud.', 'Slide 8, pre-entry.'),
  predict('order', ['s08-gloves-first', 's08-suit', 's08-vinyl'], 'Predict the right order of gowning.', ROOM({ sources: OFF }),
    ['latex gloves, suit with mask and overshoes, vinyl gloves over the latex', 'suit, then latex gloves only', 'vinyl gloves, then latex gloves over them', 'mask only'], 0, { clean: { sources: { ...OFF, gloves: true } } },
    'Gloves before the suit; vinyl over latex once suited.', 'Slide 8, entry.', { obj: 'operator' }),
  predict('sneeze', ['s08-cough', 's08-face'], 'An operator at the litho tool needs to sneeze. Predict what they should do.', ROOM({ sources: OFF }),
    ['go to the service area and face the floor, without touching their face', 'sneeze into a glove at the tool', 'lift the mask', 'sneeze over the floor grille'], 0, { clean: { sources: { ...OFF, person: true } } },
    'Service area, face to floor; never touch your face with gloves or tweezers.', 'Slide 8, inside.', { obj: 'operator' }),

  // three tiers (slides 9–10, 21)
  act('tier2', ['s09-tiers', 's21-levels'], 'Go to the second tier of contamination control.', ROOM(),
    ST('cleanroom', 'wetbench', []), { tab: 'wetbench' }, 'Level 2.'),
  act('tier3', ['s12-metal', 's21-levels'], 'Go to the third tier: where metal ions are trapped away from the devices.', ROOM(),
    ST('wafer', 'gettering', []), { layer: 'wafer', tab: 'gettering' }, 'Level 3.'),
  label('contam', ['s09-contaminants'], 'Click the surface carrying particles, an organic film, metals and alkali ions.', ['bench-wafer'], BENCH(0), 'The close-up beside the bench.'),
  calc('defect', ['s09-table'], 'By how many times did the critical defect size shrink from 1998 (125 nm) to 2018 (45 nm)?', 2.78, 0.03, '×', 'Divide.', '125 / 45 = 2.78.'),
  predict('front', ['s10-front'], 'The next step is a 1000 °C oxidation. Predict the cleaning beforehand.', ROOM(),
    ['resist strip, then the full RCA clean', 'a quick post-metal clean', 'none', 'only a DI rinse'], 0, { tab: 'wetbench', clean: { rca: 0 } },
    'High-temperature steps drive contaminants in, so the front end uses the RCA clean.', 'Front end vs back end.'),
  predict('back', ['s10-back'], 'The wafer now has aluminium wiring. Predict how its resist is stripped.', BENCH(0),
    ['O₂ plasma or organic strippers that do not attack metals', 'hot piranha', 'SC-2', 'HF'], 0, { clean: { rca: 1 } },
    'Back-end cleaning avoids acids that attack metal.', 'Piranha would eat the Al.'),

  // RCA (slides 10–11, 18)
  act('piranha', ['s11-piranha', 's18-organics'], 'Put the wafer through the step that strips the photoresist.', BENCH(0),
    ST('cleanroom', 'wetbench', [{ path: 'clean.rca', eq: 1 }]), { clean: { rca: 1 } }, 'The hot H₂SO₄/H₂O₂ tank.', { obj: 'tank-piranha' }),
  act('hf', ['s11-hf', 's11-rinse'], 'Take the wafer through the HF dip and its rinse.', BENCH(1),
    ST('cleanroom', 'wetbench', [{ path: 'clean.rca', min: 3 }]), { clean: { rca: 3 } }, 'Two more steps.', { obj: 'tank-hf' }),
  predict('sc1', ['s10-sc1', 's11-sc1'], 'The wafer goes into SC-1 (NH₄OH/H₂O₂/H₂O, 80 °C). Predict what it removes.', BENCH(3),
    ['organics, particles and most metals', 'only the oxide', 'nothing', 'the silicon'], 0, { clean: { rca: 4 } },
    'SC-1 oxidises organics and the Si surface and complexes metals; particles come off too.', 'It contains H₂O₂ and ammonia.', { obj: 'tank-sc1' }),
  predict('sc2', ['s10-sc2', 's11-sc2'], 'After SC-1 some ions remain. Predict what SC-2 (HCl/H₂O₂/H₂O) removes.', BENCH(5),
    ['alkali ions and metal cations insoluble in SC-1', 'photoresist', 'particles only', 'the native oxide'], 0, { clean: { rca: 6 } },
    'SC-2 removes alkali ions and cations such as Al³⁺, Fe³⁺, Mg²⁺.', 'HCl dissolves what ammonia cannot.', { obj: 'tank-sc2' }),
  act('rca-all', ['s11-order', 's18-rca'], 'Run the whole RCA sequence.', BENCH(0),
    ST('cleanroom', 'wetbench', [{ path: 'clean.rca', eq: 7 }]), { clean: { rca: 7 } }, 'Seven tanks.', { obj: 'wet-bench' }),
  calc('mega', ['s10-sonic', 's18-particles'], 'Megasonic cleaning runs near 1 MHz. How many times higher is that than the top of the ultrasonic range (50 kHz)?', 20, 0.1, '×', 'Divide.', '1 000 000 / 50 000 = 20. (20–50 kHz is ultrasonic; the slide attaches it to megasonic.)'),
  calc('nh3', ['s10-nh4oh'], 'SC-1 at its weakest is 0.05:1:5 (NH₄OH:H₂O₂:H₂O). What percentage of the mixture is NH₄OH?', 0.83, 0.02, '%', 'Divide by the sum of the parts.', '0.05 / 6.05 = 0.83 %: little ammonia, to limit roughening.'),

  // redox (slides 18–19)
  calc('e5', ['s18-eq5'], 'How many electrons does Si + 2H₂O ⇌ SiO₂ + 4H⁺ + ne⁻ release (n)?', 4, 0.01, 'e⁻', 'Balance charge: 4H⁺ on the right.', 'The left side is neutral and 4H⁺ carries +4, so n = 4.'),
  calc('e6', ['s18-eq6'], 'Fe ⇌ Fe³⁺ + ze⁻. What is z?', 3, 0.01, '', 'Charge of the ion.', 'Fe³⁺ carries +3, so three electrons: z = 3.'),
  act('plate', ['s18-plate'], 'Show a metal that plates out on the wafer in plain DI water.', REDOX('Mn', 'h2o2'),
    ST('cleanroom', 'redox', [{ path: 'clean.solution', eq: 'water' }, { path: 'clean.metal', eq: 'Cu' }]), { clean: { metal: 'Cu', solution: 'water' } }, 'Copper, in water.'),
  act('good', ['s18-good', 's19-rca'], 'Make gold dissolve off the wafer.', REDOX('Au', 'water'),
    ST('cleanroom', 'redox', [{ path: 'clean.metal', eq: 'Au' }, { path: 'clean.solution', eq: 'h2o2' }]), { clean: { solution: 'h2o2' } }, 'Add the RCA oxidant.'),
  predict('o3', ['s19-strongest'], 'Gold sits low on the ladder (−1.42 V). Predict what ozone (−2.07 V) does to it.', REDOX('Au', 'water'),
    ['dissolves it: O₃ is below Au in the table', 'nothing', 'plates more gold', 'turns it into Si'], 0, { clean: { solution: 'o3' } },
    'The strongest oxidants are at the bottom and drive the metal reactions above them to the right.', 'Compare positions.'),
  calc('dv', ['s19-table'], 'What is the potential difference between Fe³⁺/Fe (0.17 V) and H₂O₂/H₂O (−1.77 V), in V?', 1.94, 0.01, 'V', 'Subtract.', '0.17 − (−1.77) = 1.94 V.'),
  calc('o2', ['s19-o2'], 'In 2H₂O ⇌ O₂ + 4H⁺ + ne⁻, what must n be for the charge to balance?', 4, 0.01, 'e⁻', 'Left side is neutral.', '4H⁺ carries +4, so n = 4. (Slide 19 writes 2e⁻.)'),

  // gettering (slides 12–14, 20)
  label('psg', ['s12-alkali'], 'Click the layer that getters Na⁺ and K⁺.', ['psg-layer'], GET(), 'It is on top of the devices.'),
  label('backside', ['s12-names'], 'Click the extrinsic gettering region.', ['backside-region'], GET(), 'Extrinsic = backside.'),
  label('ig-trap', ['s20-ig'], 'After gettering, click where most of the metal atoms ended up in intrinsic gettering.', ['oxide-precipitate'], GET(3, 3), 'Not the backside: inside the bulk.'),
  calc('dz', ['s13-zones'], 'A 15 µm denuded zone on a 725 µm wafer is what percentage of its thickness?', 2.07, 0.03, '%', 'Divide and multiply by 100.', '15/725 × 100 = 2.07 %.'),
  label('ig', ['s14-traps'], 'Click a trap site of intrinsic gettering.', ['oxide-precipitate'], GET(3, 0), 'Inside the bulk.'),
  act('cycle', ['s14-cycle', 's14-cz'], 'Run the CZ wafer through the whole temperature cycle that forms the precipitates.', GET(0, 0),
    ST('wafer', 'gettering', [{ path: 'clean.cycle', eq: 3 }]), { clean: { cycle: 3 } }, 'Outdiffusion, nucleation, precipitation.', { obj: 'ig-region' }),
  act('getter', ['s20-steps'], 'With precipitates in place, take a metal atom through all three gettering steps.', GET(3, 0),
    ST('wafer', 'gettering', [{ path: 'clean.getter', eq: 3 }, { path: 'clean.cycle', eq: 3 }]), { clean: { getter: 3 } }, 'Mobile, migrate, trapped.', { obj: 'metal-atom' }),
  predict('kick', ['s20-kickout'], 'A gold atom sits on a lattice site near a device. Predict the first gettering step.', GET(3, 0),
    ['it is kicked out to an interstitial site: Au_s + I ⇌ Au_i', 'it evaporates', 'it is implanted deeper', 'it becomes a precipitate'], 0, { clean: { getter: 1 } },
    'Kick-out makes it mobile.', 'Slide 20 equation.', { obj: 'metal-atom' }),

  // yield (slides 15–17)
  calc('dist', ['s15-distribution'], 'With N(dp) = k·dp⁻³, how many times more 0.1 µm particles are there than 0.2 µm ones?', 8, 0.05, '×', '(0.2/0.1)³.', 'N(0.1)/N(0.2) = (0.2/0.1)³ = 2³ = 8.'),
  calc('loss', ['s15-loss'], 'A fab loses 20 % of its die. About how many percentage points of that are due to particles?', 15, 0.5, '%', 'About 75 % of yield loss.', '0.75 × 20 = 15 percentage points.'),
  predict('size', ['s15-size'], 'Which particles do the most damage?', YIELD(0.5, 1, 2),
    ['about 0.1–0.3 µm: large ones settle, small ones coagulate', 'only those over 10 µm', 'only those under 10 nm', 'all equally'], 0, { clean: { seed: 2 } },
    'Particles of about the feature size, 0.1–0.3 µm, are the most troublesome.', 'Slide 15.', { obj: 'killer-particle' }),
  gen('poisson-gen', ['s15-poisson'], 'Poisson model: chip area Ac = {A} cm², defect density D0 = {D0} cm⁻². What is the yield, in %?', 'poisson',
    { A: [1, 2, 0.5, 4, 1.5, 3], D0: [0.5, 0.2, 1, 0.1, 0.4, 0.3] }, 'Y = exp(−Ac·D0).', { obj: 'die-grid' }),
  gen('nb-gen', ['s16-nb', 's16-c'], 'Negative binomial: Ac = {A} cm², D0 = {D0} cm⁻², clustering C = {C}. What is the yield, in %?', 'negbin',
    { A: [10, 2, 4, 1, 6, 8], D0: [1, 0.5, 0.3, 1, 0.2, 0.1], C: [2, 2, 10, 3, 2, 5] }, 'Y = 1/(1 + Ac·D0/C)^C.', { obj: 'die-grid' }),
  predict('cluster', ['s16-cluster', 's15-assume'], 'Same D0 and chip area: predict what more clustering (C from 20 down to 1) does to the yield.', YIELD(0.8, 2, 20),
    ['it rises: defects pile onto fewer die', 'it falls', 'no change', 'it becomes zero'], 0, { clean: { C: 1 } },
    'Clustered defects leave more die clean; Poisson (random, independent) underpredicts.', 'Low C means strong clustering.', { obj: 'die-grid' }),
  act('small', ['s17-small'], 'With 16 cm² chips, lower the defect density until the negative-binomial yield (C = 2) passes 85 %.', YIELD(1, 16, 2),
    ST('wafer', 'yield', [{ path: 'clean.D0', max: 0.02 }, { path: 'clean.A', min: 15.9 }]), { clean: { D0: 0.01 } }, 'About 0.01 cm⁻².', { obj: 'die-grid' }),
  act('area', ['s16-depend'], 'Keep D0 fixed and make the chips four times larger: watch the yield fall.', YIELD(0.5, 1, 2),
    ST('wafer', 'yield', [{ path: 'clean.A', min: 3.9 }]), { clean: { A: 4 } }, 'Drag the chip area.', { obj: 'die-grid' }),
]
