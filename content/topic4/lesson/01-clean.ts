import { T4 } from '../../../src/sources'
import type { LessonSectionSchema } from '../../../src/learn/schema'
import type { z } from 'zod'

/**
 * Chapter 3: Keeping it clean (Topic 4). Seven sections along the three
 * tiers: the clean factory, wafer cleaning, gettering, then yield.
 */
type S = z.input<typeof LessonSectionSchema>
const f = (...n: string[]) => n.map((x) => `t4-${x}`)
const q = (...n: string[]) => n.map((x) => `q-t4-${x}`)
export const questions: unknown[] = []
const ROOM = { layer: 'cleanroom' as const, tab: 'room', clean: { cls: 100, sources: { person: false, book: false, gloves: false } } }

export const sections: S[] = [
  {
    id: 'k-factory', title: 'The clean factory',
    intro: 'Level 1 of contamination control is the building: a room whose air is filtered and steered so particles never settle on a wafer.',
    steps: [
      {
        id: 'k-room', title: 'What a cleanroom is', scene: ROOM, sources: [T4(1), T4(2), T4(4)],
        factIds: f('s01-topic', 's02-level1', 's02-def', 's02-air', 's02-uses', 's02-spec', 's04-yellow'),
        text: 'Topic 4 is about keeping wafers clean, and the first defence is the factory itself. A cleanroom is a space where pollutants are kept low, used for manufacturing and research, and the thing it controls above all is its air. It is rated by counting the particles in a volume of air at a stated size. The lithography bays glow amber because the resist would be exposed by ordinary white light.',
        example: { kind: 'demo', text: 'Orbit the bay: the specks drifting down are tracers following the air.' },
        checks: q('bay'),
      },
      {
        id: 'k-air', title: 'Where the air goes', scene: ROOM, sources: [T4(2), T4(6)],
        factIds: f('s02-diagram', 's06-recirc', 's06-ceiling', 's06-plant', 's06-hepa'),
        text: 'Fresh air from a make-up handler is mixed into a much larger loop. Fans above the ceiling push it down through a ceiling of high-efficiency particulate filters, straight down through the bay, out through a perforated floor, and back up a chase beside the bay to the fans again. The air is recirculated continuously. Pumps, ducts and other machinery live outside the clean space, in the plant room.',
        checks: q('chase'),
      },
      {
        id: 'k-class', title: 'Cleanroom classes', scene: { ...ROOM, clean: { ...ROOM.clean, cls: 100 } }, sources: [T4(7)],
        factIds: f('s07-class', 's07-graph'),
        text: 'The class number is a count. Take one cubic foot of air and count the particles at least half a micron across: a room of a given class may hold fewer than that many. Plotted against particle size on log scales each class is a straight line, falling steeply because small particles are far more common than large ones.',
        example: { kind: 'demo', text: 'Change the class: the amber 1 ft³ box redraws one dot per allowed particle.' },
        checks: q('cls1000', 'graph'),
      },
      {
        id: 'k-particles', title: 'How particles behave', scene: ROOM, sources: [T4(7)],
        factIds: f('s07-behaviour', 's07-deposit', 's07-methods'),
        text: 'Tiny particles float for a long time and stick together into bigger ones; big ones fall quickly. They reach a surface either by random thermal jostling, if small, or by settling under gravity, if large. So the factory fights them four ways at once: filtered, recirculated air; special suits for the people; filtered chemicals and gases; and strict working protocols.',
        checks: q('settle'),
      },
    ],
    review: q('hepa', 'cls10', 's06-hepa'),
  },
  {
    id: 'k-people', title: 'People in the cleanroom',
    intro: 'People are the dirtiest thing in a cleanroom. Gowning and behaviour rules (slide 8) keep what they shed off the wafers.',
    steps: [
      {
        id: 'k-sources', title: 'What contaminates', scene: ROOM, sources: [T4(6)],
        factIds: f('s06-clothing', 's06-sources', 's06-chemicals'),
        text: 'Even with perfect air, things carried in shed particles: skin, hair, clothes, paper fibres and the gloves themselves. That is why special clothing is required to keep a room at its class, and why ordinary paper is banned. Everything else that touches the wafer must be just as clean: the chemicals and gases are electronic grade and the water is deionised.',
        example: { kind: 'demo', text: 'Switch the sources on in the panel: red specks fall from them towards the floor.' },
        checks: q('book'),
      },
      {
        id: 'k-pre', title: 'Before you go in', scene: ROOM, sources: [T4(8)],
        factIds: f('s08-wash', 's08-mouth', 's08-shoes'),
        text: 'Preparation starts outside the gowning room. Skin carries oils and flakes, and the mouth carries droplets and, after a meal or a cigarette, much more. So you clean what you can before you put anything on, and you do not walk dirt in on your feet.',
        checks: q('wash'),
      },
      {
        id: 'k-gown', title: 'Gowning', scene: ROOM, sources: [T4(8)],
        factIds: f('s08-gloves-first', 's08-suit', 's08-vinyl'),
        text: 'Hands are covered first, so that bare skin never touches the outside of the suit. Then the bunny suit goes on, with its mask and overshoes, handled so that it never touches the floor. A second pair of gloves goes over the first. The air shower at the door, in many fabs, blows off what is left.',
        checks: q('order'),
      },
      {
        id: 'k-inside', title: 'Inside', scene: ROOM, sources: [T4(8)],
        factIds: f('s08-face', 's08-cough'),
        text: 'Inside, a gloved hand that touches skin is no longer clean, and neither are the tweezers it holds. Sudden bursts from the nose and mouth are the worst sources of all, so they are never released in the bay: there is a service area for that, and you turn your face down.',
        checks: q('sneeze'),
      },
    ],
    review: q('clothing', 'chem', 'gloves-src', 's07-deposit'),
  },
  {
    id: 'k-tiers', title: 'Three tiers, and what dirt is',
    intro: 'Factories control contamination at three levels. Before cleaning wafers, know what you are removing and when.',
    steps: [
      {
        id: 'k-three', title: 'Three tiers', scene: ROOM, sources: [T4(9), T4(21)],
        factIds: f('s09-tiers', 's09-level2', 's21-three', 's21-levels', 's21-economic'),
        text: 'Contamination is fought at three levels. The building keeps particles out of the air and the chemicals pure. The wafers are then washed with chemistry chosen to dissolve what lands on them. Finally, metal atoms that still get in are pulled away from the transistors and locked up deep in the wafer. These unglamorous steps decide how many working chips a factory makes, and so whether it makes money.',
        checks: q('tier2'),
      },
      {
        id: 'k-dirt', title: 'Kinds of contamination', scene: { layer: 'cleanroom', tab: 'wetbench', clean: { rca: 0 } }, sources: [T4(9), T4(18)],
        factIds: f('s09-contaminants', 's09-figure', 's18-remove'),
        text: 'Four kinds of dirt reach a wafer: loose specks, thin films of organic material (photoresist is the commonest), heavy-metal atoms such as iron, gold and copper, and the light, mobile ions of sodium and potassium. Each needs a different treatment, which is why cleaning is a sequence of baths rather than one.',
        example: { kind: 'demo', text: 'The close-up beside the bench shows all four, plus a thin native oxide.' },
        checks: q('contam'),
      },
      {
        id: 'k-roadmap', title: 'Smaller features, smaller killers', scene: { layer: 'cleanroom', tab: 'wetbench', clean: { rca: 0 } }, sources: [T4(9)],
        factIds: f('s09-table'),
        text: 'Slide 9’s table follows the industry from 1998 to 2018. As the node shrank, the smallest defect that can kill a circuit shrank with it, and the number of particles allowed on a new wafer fell several-fold, while the iron allowed in the bulk stayed about the same.',
        checks: q('defect'),
      },
      {
        id: 'k-when', title: 'Front end and back end', scene: { layer: 'cleanroom', tab: 'wetbench', clean: { rca: 0 } }, sources: [T4(10)],
        factIds: f('s10-front', 's10-back'),
        text: 'Not every clean is the same. Before a furnace step, anything on the surface would be driven into the silicon, so the cleaning must be thorough. Once metal lines are on the wafer, strong acids would dissolve them, and the remaining steps run cool, so a gentler clean is used that leaves the metal alone.',
        checks: q('front'),
      },
    ],
    review: q('back', 's09-figure', 's02-level1'),
  },
  {
    id: 'k-rca', title: 'The RCA clean',
    intro: 'The standard wet clean: four chemical baths and three rinses, each removing a different kind of contamination.',
    steps: [
      {
        id: 'k-piranha', title: 'Strip the organics', scene: { layer: 'cleanroom', tab: 'wetbench', clean: { rca: 0 } }, sources: [T4(11), T4(18)],
        factIds: f('s11-piranha', 's18-organics', 's11-standard'),
        related: ['lithography-strip'],
        text: 'The RCA clean is the industry’s standard recipe for removing organics, heavy metals and alkali ions. Organic films come off first, because they would shield everything underneath from the later baths. A hot mix of sulphuric acid and hydrogen peroxide oxidises them away completely; an oxygen plasma does the same job dry.',
        example: { kind: 'demo', text: 'Press start: the carrier drops into the first tank and the brown film disappears.' },
        checks: q('piranha'),
      },
      {
        id: 'k-hf', title: 'Dip and rinse', scene: { layer: 'cleanroom', tab: 'wetbench', clean: { rca: 1 } }, sources: [T4(11)],
        factIds: f('s11-hf', 's11-rinse'),
        related: ['lithography-etch'],
        text: 'Next, very dilute hydrofluoric acid at room temperature dissolves the thin chemical oxide, taking with it any contaminants trapped in it, and leaves a bare silicon surface capped with hydrogen. After this and each later chemical bath the wafer is rinsed in deionised water.',
        checks: q('hf'),
      },
      {
        id: 'k-sc1', title: 'Standard clean 1', scene: { layer: 'cleanroom', tab: 'wetbench', clean: { rca: 3 } }, sources: [T4(10), T4(11), T4(18)],
        factIds: f('s10-sc1', 's10-nh4oh', 's11-sc1', 's10-sonic', 's18-particles'),
        text: 'The first standard clean is water, hydrogen peroxide and a little ammonia, around 80–90 °C. The peroxide oxidises the surface and any organic traces, and the ammonia holds many metals in solution as complexes. Too much ammonia roughens the silicon, so it is kept to a small fraction. Agitation with sound waves shakes loose particles at the same time, at ultrasonic or, today, much higher megasonic frequencies.',
        checks: q('sc1', 'mega'),
      },
      {
        id: 'k-sc2', title: 'Standard clean 2', scene: { layer: 'cleanroom', tab: 'wetbench', clean: { rca: 5 } }, sources: [T4(10), T4(11), T4(18)],
        factIds: f('s10-sc2', 's11-sc2', 's11-order', 's18-rca'),
        text: 'Some ions do not dissolve in an alkaline bath. The second standard clean swaps ammonia for hydrochloric acid, again with peroxide and water at 80–90 °C, and takes those last ions off. A final rinse ends the sequence; a last dilute acid dip can be added if a bare surface is wanted. (Slide 10 writes magnesium as Mg³⁺; it forms Mg²⁺.)',
        checks: q('sc2'),
      },
    ],
    review: q('rca-all', 'nh3', 's11-standard', 's09-contaminants'),
  },
  {
    id: 'k-redox', title: 'Why peroxide cleans',
    intro: 'Whether a metal leaves the wafer or plates onto it is a competition between two reactions. Slide 19’s table decides the winner.',
    steps: [
      {
        id: 'k-eq', title: 'Two competing reactions', scene: { layer: 'cleanroom', tab: 'redox', clean: { metal: 'Fe', solution: 'water' } }, sources: [T4(18)],
        factIds: f('s18-eq5', 's18-eq6', 's18-dominate'),
        text: 'In water, silicon can give up electrons by turning into oxide, and a metal atom can give up electrons by turning into a dissolved ion. Both reactions can run either way, and they share the same pool of electrons. Whichever has the stronger drive pushes the other backwards.',
        checks: q('e5'),
      },
      {
        id: 'k-plate', title: 'Plating out', scene: { layer: 'cleanroom', tab: 'redox', clean: { metal: 'Mn', solution: 'water' } }, sources: [T4(18)],
        factIds: f('s18-plate', 's18-good'),
        text: 'In plain water the silicon usually wins: it oxidises, and the electrons it releases reduce dissolved metal ions back to metal, which deposits on the wafer surface. That is exactly the wrong outcome. A good cleaning solution must reverse it, keeping the metal as a soluble ion that washes away.',
        example: { kind: 'demo', text: 'Pick a metal on the ladder and switch the solution: the result line tells you which reaction wins.' },
        checks: q('plate'),
      },
      {
        id: 'k-ladder', title: 'The ladder of potentials', scene: { layer: 'cleanroom', tab: 'redox', clean: { metal: 'Cu', solution: 'water' } }, sources: [T4(19)],
        factIds: f('s19-table', 's19-strongest', 's19-o2'),
        text: 'Slide 19 ranks couples by standard oxidation potential, from manganese at +1.05 V down to ozone at −2.07 V. A couple lower in the list takes electrons from any couple above it, so the bottom entries are the strongest oxidants. (In the slide’s table the oxygen–water couple is written with too few electrons: count the charge.)',
        checks: q('o3', 'dv'),
      },
      {
        id: 'k-peroxide', title: 'The RCA trick', scene: { layer: 'cleanroom', tab: 'redox', clean: { metal: 'Au', solution: 'water' } }, sources: [T4(19)],
        factIds: f('s19-rca', 's18-good'),
        text: 'Every bath of the RCA clean after the first contains hydrogen peroxide. Its couple sits below every metal on the ladder, gold included, so it grabs their electrons and pushes them into solution, while the silicon is oxidised into a thin, protective oxide.',
        checks: q('good'),
      },
    ],
    review: q('o2', 'e6', 's18-dominate', 's11-sc1'),
  },
  {
    id: 'k-getter', title: 'Gettering',
    intro: 'Level 3: metal and alkali ions that get past cleaning are moved away from the transistors and trapped where they do no harm.',
    steps: [
      {
        id: 'k-get-what', title: 'What gettering does', scene: { layer: 'wafer', tab: 'gettering', clean: { cycle: 0, getter: 0 } }, sources: [T4(12)],
        factIds: f('s12-level3', 's12-alkali', 's12-metal', 's12-names', 's12-table'),
        text: 'The periodic table on slide 12 sorts the culprits: light alkali ions from group I, and transition metals that create deep levels in the gap. Alkali ions are caught by glass or nitride layers on the front of the wafer. Metals are caught by traps either at the back of the wafer or inside its bulk; the two are called extrinsic and intrinsic gettering.',
        checks: q('psg'),
      },
      {
        id: 'k-get-wafer', title: 'The gettering wafer', scene: { layer: 'wafer', tab: 'gettering', clean: { cycle: 3, getter: 0 } }, sources: [T4(13)],
        factIds: f('s13-psg', 's13-psg-bad', 's13-zones', 's13-relies', 's13-graph'),
        text: 'The cross-section has layers: a phosphosilicate glass on top that catches sodium and potassium (but whose dipoles disturb fields and which soaks up water that corrodes aluminium), the devices just below the surface, a clean layer free of traps, a thick bulk full of traps, and a damaged back surface. It works because metal atoms diffuse astonishingly fast in silicon, far faster than dopants, and collect where the crystal is disturbed.',
        checks: q('dz'),
      },
      {
        id: 'k-get-ig', title: 'Making the traps', scene: { layer: 'wafer', tab: 'gettering', clean: { cycle: 0, getter: 0 } }, sources: [T4(14)],
        factIds: f('s14-traps', 's14-cz', 's14-cycle', 's14-precipitate'),
        related: [],
        text: 'Czochralski silicon carries plenty of dissolved oxygen from its crucible. A three-stage heat treatment at the very start of processing turns it into traps: a hot stage drives oxygen out of the surface layer, a cool stage lets tiny oxide nuclei form in the bulk, and a middle stage grows them into precipitates surrounded by strained crystal.',
        example: { kind: 'demo', text: 'Step the temperature cycle: the white precipitates appear only below the clean surface layer.' },
        checks: q('cycle'),
      },
      {
        id: 'k-get-steps', title: 'Three steps to a trap', scene: { layer: 'wafer', tab: 'gettering', clean: { cycle: 3, getter: 0 } }, sources: [T4(20)],
        factIds: f('s20-steps', 's20-kickout', 's20-fast', 's20-trap', 's20-ig'),
        text: 'A gold atom on a lattice site barely moves. First a self-interstitial knocks it off its site into the gaps between atoms. There it moves very fast. Finally it reaches a place it prefers: damaged crystal, a heavily doped n-type region, a phosphorus atom to pair with, or the strained crystal around an oxide precipitate.',
        checks: q('getter'),
      },
    ],
    review: q('backside', 'kick', 'ig', 's19-rca'),
  },
  {
    id: 'k-yield', title: 'Particles and yield',
    intro: 'Everything in this chapter ends in one number: the fraction of die on a wafer that work.',
    steps: [
      {
        id: 'k-y-particles', title: 'Killer particles', scene: { layer: 'wafer', tab: 'yield', clean: { D0: 0.5, A: 1, C: 2 } }, sources: [T4(15)],
        factIds: f('s15-loss', 's15-models', 's15-size', 's15-distribution'),
        text: 'Particles about as large as the circuit features account for most lost chips in a modern fab. Yield models therefore start from the measured density and size of defects. The number of particles climbs steeply as size falls, but only those big enough to bridge or break a feature kill a die, so one size band does most of the damage.',
        checks: q('size', 'dist'),
      },
      {
        id: 'k-y-poisson', title: 'The Poisson model', scene: { layer: 'wafer', tab: 'yield', clean: { D0: 0.5, A: 1, C: 20 } }, sources: [T4(15)],
        factIds: f('s15-poisson', 's15-assume'),
        text: 'If killer defects land at random and independently, with D0 per square centimetre, a die of critical area Ac collects on average Ac·D0 of them, and the chance it collects none follows Poisson statistics. Real defects are not that independent, and this simple model usually predicts fewer good die than a fab actually gets.',
        example: { kind: 'worked', text: 'Ac = 2 cm², D0 = 0.25 cm⁻²: on average 0.5 defects per die, so the Poisson yield is exp(−0.5) ≈ 61 %.' },
        checks: q('poisson-gen'),
      },
      {
        id: 'k-y-nb', title: 'Clustering', scene: { layer: 'wafer', tab: 'yield', clean: { D0: 0.5, A: 1, C: 2 } }, sources: [T4(16)],
        factIds: f('s16-nb', 's16-c', 's16-depend', 's16-graph', 's16-cluster'),
        text: 'Defects come in clumps. A clustering factor C describes how uneven their spread is: small C means strong clustering. Clustered defects pile up on a few die and spare the others, so for the same density more die survive. The negative binomial model captures this; as C grows without limit it becomes Poisson again. Either way, yield falls as density and die area rise.',
        example: { kind: 'demo', text: 'Drag C down: red die bunch together and the counted yield follows the amber curve, not the pink one.' },
        checks: q('nb-gen', 'area'),
      },
      {
        id: 'k-y-trend', title: 'Bigger chips, cleaner fabs', scene: { layer: 'wafer', tab: 'yield', clean: { D0: 1, A: 16, C: 2 } }, sources: [T4(17), T4(21)],
        factIds: f('s17-graph', 's17-small', 's17-each', 's21-bottom'),
        text: 'Chips have grown towards 40 × 40 mm. On slide 17’s curves, at one defect per cm² such a chip almost never works; only a density a hundred times lower keeps most of them. Every process step adds defects, so every step is monitored, because a bad die costs as much to make as a good one.',
        checks: q('small'),
      },
    ],
    review: q('cluster', 'loss', 's17-each', 's20-kickout'),
  },
]
