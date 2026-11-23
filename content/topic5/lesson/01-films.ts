import { T5 } from '../../../src/sources'
import type { LessonSectionSchema } from '../../../src/learn/schema'
import type { z } from 'zod'

/**
 * Chapter 4: Laying down films (Topic 5). Ten sections: what a film must
 * do, CVD and its gases, growth kinetics and the two regimes, LPCVD films,
 * plasmas and PECVD, evaporation and vacuum, then sputtering and newer methods.
 */
type S = z.input<typeof LessonSectionSchema>
const f = (...n: string[]) => n.map((x) => `t5-${x}`)
const q = (...n: string[]) => n.map((x) => `q-t5-${x}`)
export const questions: unknown[] = []

const CVD = (films: Record<string, unknown> = {}) => ({ layer: 'deposition' as const, tab: 'cvd', films: { T: 900, P: 760, Y: 0.01, ...films } })
const PL = (plasma: string) => ({ layer: 'deposition' as const, tab: 'plasma', films: { plasma } })
const PVD = (logP = -6, ebeam = false) => ({ layer: 'deposition' as const, tab: 'pvd', films: { logP, ebeam } })
const COV = (method: string, aspect = 2) => ({ layer: 'deposition' as const, tab: 'coverage', films: { method, aspect, Sc: 0.1 } })

export const sections: S[] = [
  {
    id: 'f-films', title: 'What a film must do',
    intro: 'Every chip is a stack of thin layers laid on the wafer: insulators, conductors and semiconductors. Topic 5 is about how they are put down.',
    steps: [
      {
        id: 'f-need', title: 'A good film', scene: COV('cvd'), sources: [T5(1), T5(2), T5(34)],
        factIds: f('s01-topic', 's02-req', 's02-planar', 's34-stress'),
        text: 'Thin film deposition adds material instead of converting the wafer, as oxidation does. A useful film has the right composition and very little contamination, the electrical, optical or mechanical properties it was chosen for, and an even thickness from the centre of a wafer to its edge and from one wafer to the next. It must stick, it must not be under too much stress, and it must cover steps. Some films are also meant to flatten what lies beneath: planarisation may be absent, local, or global across the whole wafer. Any layer unlike the wafer pulls or pushes on it as it cools.',
        checks: q('stress'),
      },
      {
        id: 'f-cover', title: 'Steps and trenches', scene: COV('evaporation'), sources: [T5(2)],
        factIds: f('s02-coverage'),
        text: 'Real wafers are not flat. By the time metal is laid down there are steps, contact holes and trenches. Step coverage asks how much of the film reaches the vertical walls and the bottom compared with the flat top. Uniform coverage follows the shape exactly; poor coverage thins at the step, where a wire then has a weak, high-resistance neck. Filling a gap is harder still: the film can close over the top before the inside is full, trapping a void, or it can leave a seam where the two walls meet.',
        example: { kind: 'demo', text: 'Change the method in the panel and watch how much film reaches the walls of the trench.' },
        checks: q('conformal'),
      },
      {
        id: 'f-types', title: 'Three families', scene: COV('cvd'), sources: [T5(3), T5(4)],
        factIds: f('s03-types', 's03-spin', 's03-pvd-cycle', 's04-energy'),
        text: 'All deposition turns a source, which may be a gas, a liquid or a solid, into a solid film by supplying energy, either physically or chemically. There are three main families. In spin-on coating a liquid is put in the middle of the wafer, the wafer is whirled so the liquid spreads into a thin even sheet, and the sheet is baked. In chemical vapour deposition gases react to leave a solid behind. In physical vapour deposition the material itself is turned into vapour, carried across, and condensed again on the wafer.',
        checks: q('types'),
      },
      {
        id: 'f-menu', title: 'The film menu', scene: CVD({ P: 0.5, T: 620 }), sources: [T5(52), T5(53)],
        factIds: f('s52-table', 's53-table'),
        text: 'The last two slides of the topic are a menu: each film a process uses, the method that makes it and the temperature it needs. Epitaxial silicon is grown hot, above a thousand degrees. Polycrystalline silicon, oxides and nitrides come from low-pressure CVD in furnaces. Tungsten plugs come from tungsten hexafluoride; titanium silicide forms from titanium laid on silicon and annealed; titanium nitride barriers and aluminium wiring are sputtered. Keep this table in mind: the rest of the chapter explains why each film is made the way it is.',
        checks: q('menu'),
      },
    ],
    review: q('req', 's03-pvd-cycle', 's02-coverage'),
  },
  {
    id: 'f-cvd', title: 'Chemical vapour deposition',
    intro: 'Most films in a fab are grown from gases. The tube in front of you is a CVD reactor: gas in at one end, hot wafers in the middle.',
    steps: [
      {
        id: 'f-cvd-what', title: 'Gas in, solid out', scene: CVD(), sources: [T5(5), T5(6)],
        factIds: f('s05-cvd', 's05-examples', 's06-diagram'),
        text: 'In CVD the elements the film needs arrive as molecules in the gas. A carrier gas, at high or low pressure, sweeps these precursors over the heated wafers. Near and on the hot surface they break apart into fragments; the fragments that land join the growing solid, and the leftovers leave as volatile by-products. The method is versatile: it makes insulators such as oxide and nitride, metals such as tungsten, aluminium, copper and titanium, and semiconductors, from polysilicon to single-crystal silicon and gallium arsenide.',
        example: { kind: 'demo', text: 'Orbit the tube: the tracers show the gas sweeping over the wafers.' },
        checks: q('gasflow'),
      },
      {
        id: 'f-sources', title: 'Choosing a source', scene: CVD(), sources: [T5(5), T5(7)],
        factIds: f('s05-mo', 's07-source', 's07-examples'),
        text: 'Not every element will travel as a gas. Gallium, aluminium and copper barely evaporate at all, so chemists bolt them to small organic groups such as methyl or ethyl, which do. A good source sits quietly in its cylinder at room temperature and falls apart readily at the growth temperature; it is very pure and leaves nothing behind in the lines to spoil the next run. The common ones include hydrides of arsenic, phosphorus and silicon, and the methyl and ethyl compounds of gallium, aluminium and zinc.',
        checks: q('source'),
      },
      {
        id: 'f-reactors', title: 'Four kinds of CVD', scene: CVD({ P: 760 }), sources: [T5(11)],
        factIds: f('s11-apcvd', 's11-lpcvd', 's11-mocvd'),
        text: 'Atmospheric-pressure CVD is simple, quick and cheap to run, but its films vary more across the wafer and pick up more impurity; it is mostly used for thick oxides. Pumping the tube down to a fraction of a torr, up to about twenty, slows growth a little but gives films that are far more even and clean, which is why polysilicon and the dielectrics are grown that way. Metal-organic CVD can grow almost anything, but its sources are poisonous, costly and expensive to dispose of. The fourth, plasma-enhanced, has its own section later.',
        example: { kind: 'demo', text: 'Use the APCVD and LPCVD buttons: the wafers switch from a tilted susceptor to a vertical boat.' },
        checks: q('lpcvd'),
      },
      {
        id: 'f-systems', title: 'Inside the reactors', scene: CVD({ P: 760 }), sources: [T5(12), T5(13), T5(24), T5(27)],
        factIds: f('s12-systems', 's13-mocvd-sys', 's24-furnace', 's27-gas'),
        text: 'An atmospheric reactor for silicon is a quartz chamber with coils wound round it. The coils heat a graphite block inductively; the wafers lie on it, and hydrogen, hydrogen chloride and dopant gases flow past. An MOCVD reactor feeds its gases through a showerhead onto a spinning platter over a three-zone heater, with cooled walls and optical probes watching the growth. Hydrogen bubbles through the liquid metal organics and mass-flow controllers meter every line. A vertical LPCVD furnace stacks wafers in a quartz tube with three heated zones, gas entering at the bottom and pumps pulling it out.',
        checks: q('susceptor'),
      },
    ],
    review: q('ga-src', 'apcvd', 's02-planar'),
  },
  {
    id: 'f-safety', title: 'Handling the gases',
    intro: 'The gases that make semiconductors are among the most dangerous chemicals in industry. Slides 7–10 put safety before everything else.',
    steps: [
      {
        id: 'f-hazard', title: 'Why the sources are dangerous', scene: { ...CVD(), look: 'cvd-flow' }, sources: [T5(8)],
        factIds: f('s08-organic', 's08-hazards'),
        text: 'CVD gases are dangerous in several ways at once. Many are poisonous. Some are corrosive enough to eat stainless-steel lines. Many burn, some explode, and some catch fire on their own the moment they meet air. Metal organics add a particular risk to people: organic molecules soak readily through skin and tissue, and once inside, the weak link between the metal and its organic groups gives way, leaving the metal in the body, which has no way of dealing with it.',
        checks: q('skin'),
      },
      {
        id: 'f-limits', title: 'Exposure limits', scene: CVD(), sources: [T5(9)],
        factIds: f('s09-arsine', 's09-phosphine', 's09-tbas', 's09-terms'),
        text: 'Three numbers describe how poisonous a gas is. LC50 is the concentration that kills half of those exposed. IDLH is the level that is immediately dangerous to life or health. TLV, the threshold limit value, is what a worker may breathe day after day. Arsine, kept in cylinders at 15 bar, has an LC50 of 5–50 ppm, an IDLH of 2 ppm and a TLV of just 50 ppb. Phosphine, stored at forty bar, is a little less deadly: LC50 11–50 ppm, IDLH 7 ppm, TLV 300 ppb. Tertiarybutylarsine, a liquid, is far gentler, with an LC50 of 70 ppm and a TLV of 500 ppb.',
        checks: q('ash3'),
      },
      {
        id: 'f-table', title: 'The rest of the gas cabinet', scene: CVD(), sources: [T5(9), T5(10)],
        factIds: f('s09-others', 's10-table'),
        text: 'The other hazards are as serious. Metal organics flare up in air and give off toxic smoke. Hydrogen, the usual carrier, can explode. The exhaust carries large amounts of unreacted toxic gas and must be scrubbed, and the dust and oxides of gallium arsenide and indium phosphide are themselves toxic. Slide 10 tabulates the common gases: silane and phosphine burst into flame by themselves, arsine has the lowest limit of all, ammonia is corrosive with a much higher limit, and argon is harmless except that it can suffocate.',
        checks: q('leak'),
      },
    ],
    review: q('ph3', 'tbas', 'mocvd'),
  },
  {
    id: 'f-kinetics', title: 'How fast a film grows',
    intro: 'Why does a film grow at the rate it does? Slides 14–18 build a simple model from two fluxes in series.',
    steps: [
      {
        id: 'f-mech', title: 'Seven steps', scene: { ...CVD(), look: 'cvd-flow' }, sources: [T5(14), T5(16)],
        factIds: f('s14-mech', 's14-limits', 's16-steps'),
        text: 'A reactant has a long way to go. The main gas stream carries it along the reactor; it diffuses across the slow layer of gas next to the wafer; it sticks; it moves about, reacts, and becomes part of the film; the waste molecules let go; they diffuse back out through the slow layer; and the main stream carries them away. Whichever of these is slowest sets the rate. For vapour-phase and liquid-phase epitaxy it is thermodynamics, for MOVPE gas diffusion, and for MBE the surface kinetics.',
        checks: q('steps7'),
      },
      {
        id: 'f-arr', title: 'Hot and cold', scene: CVD({ T: 1150 }), sources: [T5(15)],
        factIds: f('s15-arrhenius', 's15-regimes'),
        text: 'A chemical reaction speeds up with temperature in the Arrhenius way: R = R0·exp(−Ea/kT), with the activation energy Ea in electronvolts and T in kelvin. So there are two regimes. When the wafer is hot the surface consumes reactant faster than the gas can bring it, and the supply sets the pace. When it is cool the reaction itself is sluggish, plenty of reactant waits at the surface, and the chemistry sets the pace.',
        example: { kind: 'demo', text: 'Drag the temperature slider and watch the regime label above the wafers.' },
        checks: q('cool', 'arr'),
      },
      {
        id: 'f-flux', title: 'Two fluxes in series', scene: CVD(), sources: [T5(17)],
        factIds: f('s17-f1', 's17-f2', 's17-cs'),
        text: 'Call the reactant concentration in the main gas CG and right at the surface CS. Reactant crosses the boundary layer in proportion to the difference, F1 = hG(CG − CS), where hG is the gas-phase mass-transfer coefficient in cm/s. The surface uses it up in proportion to what is there, F2 = kS·CS, with kS the reaction rate constant. In steady state nothing piles up, so F1 = F2; solve for CS and it depends only on CG and the ratio of the two coefficients.',
        checks: q('cs'),
      },
      {
        id: 'f-rate', title: 'The growth rate', scene: CVD(), sources: [T5(18)],
        factIds: f('s18-v', 's18-limits'),
        text: 'Divide the flux by the number of atoms per unit volume of film, N1 (5.0 × 10²² cm⁻³ for silicon), and you get the velocity of the surface: v = [kS·hG/(kS + hG)]·(CT/N1)·Y, where CT counts all gas molecules per cm³ and Y is the fraction that are reactant. The bracket behaves like two resistances in series: whichever coefficient is much smaller takes over, leaving v ≈ (CT/N1)·kS·Y when the surface is slow, or the same with hG when the gas is slow.',
        checks: q('v'),
      },
    ],
    review: q('limits', 's09-terms', 's15-arrhenius'),
  },
  {
    id: 'f-regimes', title: 'Two regimes and low pressure',
    intro: 'The two coefficients behave very differently with temperature, and that decides how reactors are built and why pumping them down helps.',
    steps: [
      {
        id: 'f-hot', title: 'Reading the Arrhenius plot', scene: CVD({ T: 1000 }), sources: [T5(19), T5(20)],
        factIds: f('s19-graph', 's20-sensitive'),
        text: 'kS is Arrhenius, k0·exp(−Ea/kT), with Ea about 1.6 eV for single-crystal silicon, so on a plot of log rate against 1/T it is a steep straight line. hG hardly changes with temperature, a flat line. The growth rate follows whichever is lower: the steep line at low temperature, the flat one at high. That has a practical meaning. Where kS rules, a few degrees of non-uniformity give a different thickness. Where hG rules, temperature hardly matters but the flow of gas and the shape of the chamber do.',
        example: { kind: 'demo', text: 'The chart in the panel draws both terms and the net curve; the dot is your setting.' },
        checks: q('hot'),
      },
      {
        id: 'f-bl', title: 'The boundary layer', scene: { ...CVD({ T: 1150 }), look: 'cvd-wafers' }, sources: [T5(20)],
        factIds: f('s20-epi', 's20-hg', 's20-tilt'),
        text: 'hG = DG/δS: the gas diffusivity divided by the thickness of the stagnant layer the reactant must cross. That layer thickens as the gas travels along a flat plate. Silicon epitaxy runs hot to get a perfect crystal, which puts it in the hG regime, so the gas must be steered carefully over every wafer: it is grown in horizontal reactors. Tilting the graphite block narrows the channel downstream, the gas speeds up, and the layer stays thin all the way along.',
        checks: q('tilt'),
      },
      {
        id: 'f-sources-t', title: 'Different sources, different temperatures', scene: CVD(), sources: [T5(20), T5(21)],
        factIds: f('s20-graph', 's21-autodoping'),
        text: 'Slide 20 plots the growth rate of polysilicon from four silicon sources on the same axes. Each rises steeply, then flattens as it becomes transport-limited, but they are shifted along the temperature axis: the more chlorine a source carries, the hotter it must be. Slide 21 adds a warning for epitaxy on a heavily doped wafer: dopant leaks into the new layer, by solid-state diffusion out of the wafer, giving an erfc near the interface, and through the gas, giving an exponential tail. Chapter 5 returns to this.',
        checks: q('silane'),
      },
      {
        id: 'f-lowp', title: 'Why pump it down', scene: CVD({ T: 1000, P: 760 }), sources: [T5(22)],
        factIds: f('s22-why', 's22-hg100', 's22-graph'),
        text: 'Atmospheric CVD is caught between two problems. Run it hot and it is transport-limited, so it needs a horizontal reactor that takes only a few wafers at a time. Run it cool and it is slow. Lowering the pressure breaks the deadlock. The gas diffusivity rises as 1/P, about 760 times from one atmosphere to one torr, while the stagnant layer only thickens about seven times. So hG climbs a hundredfold, the transport term moves far above the reaction term, and the reaction-controlled region extends to much higher temperatures.',
        example: { kind: 'demo', text: 'At 1000 °C, slide the pressure down and watch the regime label and the green hG line on the chart.' },
        checks: q('lowp'),
      },
    ],
    review: q('epi', 's17-cs', 's20-hg'),
  },
  {
    id: 'f-lpcvd', title: 'LPCVD films',
    intro: 'Low-pressure furnaces make most of the films in the front end of a CMOS process. Slides 23–27 go through them.',
    steps: [
      {
        id: 'f-poly', title: 'Polysilicon', scene: CVD({ P: 0.5, T: 900 }), sources: [T5(23)],
        factIds: f('s23-uses', 's23-poly', 's23-limits'),
        text: 'LPCVD makes the polysilicon for gates, thick oxides between interconnect levels, doped oxides that flatten the surface, nitrides and other dielectrics, and some metals. Polysilicon comes from silane, either pure or diluted to 20–30 % in an inert gas, at a fraction of a torr. Its temperature window is narrow. Too cool and deposition crawls. Too hot and silicon starts to form in the gas itself, raining particles onto the wafers, and the film no longer clings well.',
        checks: q('poly'),
      },
      {
        id: 'f-nitride', title: 'Nitride and the process menu', scene: CVD({ P: 0.1, T: 600 }), sources: [T5(24)],
        factIds: f('s24-reactions', 's24-conditions'),
        text: 'Slide 24 lists the reactions behind three steps in a process menu: dry oxidation turns silicon into oxide, silane breaks into silicon and hydrogen, and silane with ammonia gives silicon nitride and a lot of hydrogen. A nitride recipe in the menu runs with gas flows of tens to hundreds of sccm, at about 600 °C, and at a pressure of a tenth of a torr. Balance the nitride reaction yourself: three silicons and four nitrogens make one Si₃N₄.',
        checks: q('h2'),
      },
      {
        id: 'f-oxides', title: 'CVD oxides', scene: CVD({ P: 0.5, T: 700 }), sources: [T5(25)],
        factIds: f('s25-undoped', 's25-oxides'),
        text: 'Undoped CVD oxide insulates one level of metal from the next, masks the wafer against implants and diffusion, and thickens the field oxide where devices must withstand high voltage. Several chemistries make it. Silane and oxygen react at 350–500 °C but leave hydrogen-containing impurities. Dichlorosilane with nitrous oxide needs about 900 °C and leaves chlorine. Tetraethyl orthosilicate, TEOS, decomposes at 650–750 °C, and adding ozone brings that down to around 400 °C.',
        checks: q('teos'),
      },
      {
        id: 'f-doped', title: 'Doped oxides and nitrides', scene: CVD({ P: 0.5, T: 800 }), sources: [T5(25)],
        factIds: f('s25-doped', 's25-nitrides'),
        text: 'Oxide doped with phosphorus serves as the final passivation, traps mobile ions as a gettering layer, and has a lower softening point: between 950 and 1100 °C it flows and rounds off sharp steps. The phosphorus comes from phosphine burned with oxygen, 4PH₃ + 5O₂ → 2P₂O₅ + 6H₂. CVD nitride seals the chip against moisture and sodium, isolates devices, and as oxynitride stores charge in flash memory. It grows from silane or dichlorosilane with ammonia at 700–900 °C.',
        checks: q('reflow'),
      },
      {
        id: 'f-movpe', title: 'MOVPE', scene: CVD(), sources: [T5(26)],
        factIds: f('s26-movpe'),
        text: 'For compound semiconductors, metal-organic vapour phase epitaxy brings the group III element as a metal organic and the group V element as a hydride, or as another organic. Only the platter under the wafers is heated; the chamber walls are kept cool. The growth is diffusion-limited, which is why the reactors spin the wafer and use showerheads to keep the gas supply even.',
        checks: q('cold-wall'),
      },
    ],
    review: q('hot-end', 'nit-cond', 's22-hg100'),
  },
  {
    id: 'f-plasma', title: 'Plasmas',
    intro: 'A plasma can do with electrons what a furnace does with heat. The chamber now shows a glow discharge between two plates.',
    steps: [
      {
        id: 'f-pecvd', title: 'Plasma-enhanced CVD', scene: PL('dc'), sources: [T5(11), T5(29)],
        factIds: f('s11-pecvd', 's29-pecvd', 's29-radicals'),
        text: 'In plasma-enhanced CVD radio-frequency power at 13.56 MHz between two electrodes tears the gas into electrons, ions, neutral fragments, excited molecules and free radicals: a glowing, electrically neutral soup. Free radicals such as SiH₃, SiO or F carry no charge but have unsatisfied bonds, so they react at once. With the fragments already made and ions hammering the surface, films form at temperatures where thermal CVD would hardly start, so PECVD suits the back end of a process. The price is some damage from the plasma.',
        example: { kind: 'demo', text: 'Switch between the modes in the panel: PECVD, DC, RF and magnetron.' },
        checks: q('pecvd'),
      },
      {
        id: 'f-inside', title: 'Inside the glow', scene: PL('pecvd'), sources: [T5(30)],
        factIds: f('s30-ion', 's30-electrons', 's30-glow', 's30-ionise'),
        text: 'Only a tiny fraction of the gas is ionised, typically one part in ten thousand. The electrons, light and quick, take energy from the field and average 1–10 eV, while the gas stays near room temperature, about 25 meV. Ionising an atom usually needs more than 8 eV, 13.6 eV for hydrogen, so only the fastest electrons manage it. Many more collisions merely excite a molecule, which then emits light as it relaxes: the glow. Others split molecules into radicals, which can outnumber the charged particles many times over.',
        checks: q('eratio'),
      },
      {
        id: 'f-react', title: 'Plasma reactions and their uses', scene: PL('pecvd'), sources: [T5(31), T5(32), T5(33)],
        factIds: f('s31-reactions', 's31-sheath', 's32-params', 's33-uses'),
        text: 'An energetic electron can split a molecule, knock an electron out of an atom, or lift it to an excited state; an ion can recapture an electron, and an excited atom relaxes by giving off a photon. Near each electrode a thin dark layer, the sheath, holds most of the voltage. Ions entering it are accelerated straight at the surface. Engineers tune the plasma by its frequency, power, magnetic field, gas chemistry, flow, geometry and pressure, and use it to deposit films, to clean the chamber of build-up, and to etch and clean wafers dry.',
        checks: q('sheath'),
      },
    ],
    review: q('radical', 'neutral', 's24-reactions'),
  },
  {
    id: 'f-pecvd-use', title: 'PECVD in practice',
    intro: 'PECVD trades film quality for a cool wafer. Slides 34–37 show when that trade is worth making.',
    steps: [
      {
        id: 'f-temps', title: 'Cooler, but rougher', scene: PL('pecvd'), sources: [T5(34)],
        factIds: f('s34-temps', 's34-stoich'),
        text: 'Compare the temperatures. LPCVD nitride needs about 850 °C; PECVD nitride forms at 200–400 °C. Oxide from nitrous oxide: 800 °C against 200–400 °C. TEOS oxide: 720 °C against 350 °C. The plasma films grow quickly, but they are not the exact compounds, written SiNₓ and SiOₓ instead, and they are full of tiny voids and hydrogen, with a lower density. An anneal in oxygen or ammonia densifies them, but needs the high temperature PECVD was chosen to avoid.',
        checks: q('pecvd-temp'),
      },
      {
        id: 'f-when', title: 'When to use it', scene: PL('pecvd'), sources: [T5(35), T5(36)],
        factIds: f('s35-hdp', 's36-when'),
        text: 'A plasma is the answer whenever the wafer must stay under roughly 400 °C, and lower still for gallium arsenide. That includes a wafer that already carries metals that diffuse quickly, like copper, and dielectric laid over aluminium, which forms a eutectic with silicon at 577 °C. High-density-plasma CVD goes further: a remote microwave plasma at 2.45 GHz, concentrated by magnetic coils, supplies the radicals, while a separate 13.56 MHz bias on the wafer sputters as it deposits, filling narrow gaps from the bottom up.',
        checks: q('cu'),
      },
      {
        id: 'f-w', title: 'Pressure, tungsten and nitride', scene: PL('pecvd'), sources: [T5(36), T5(37)],
        factIds: f('s36-remote', 's37-w', 's37-nitride'),
        text: 'Early PECVD ran above 1 Torr, where gas molecules collide often and arrive from all directions, helping coverage. Modern remote-plasma tools run near 0.1 Torr and are more directional. Tungsten has two recipes. Tungsten hexafluoride reacts with bare silicon at about 300 °C, eating a little of it, so tungsten appears only where silicon is exposed. With silane at 400–450 °C it coats everything. PECVD nitride comes from silane and ammonia at 200–400 °C; the dichlorosilane route printed beside it on slide 37 is really a thermal LPCVD reaction at 700–800 °C.',
        checks: q('w'),
      },
    ],
    review: q('remote', 'chamber', 's34-stress'),
  },
  {
    id: 'f-evap', title: 'Evaporation and vacuum',
    intro: 'Physical vapour deposition boils the film material itself. The bell jar shows the simplest version.',
    steps: [
      {
        id: 'f-thermal', title: 'Thermal evaporation', scene: PVD(-3), sources: [T5(38), T5(41)],
        factIds: f('s38-evap', 's41-vapour'),
        text: 'A piece of metal sits in a tungsten boat or coil. A large current heats the tungsten until the metal melts and boils off, so the metal must melt well below tungsten does. The chamber is pumped hard, below 10⁻⁵ Torr, so the vapour crosses to the wafer without hitting gas on the way, spreading out from what is in effect a single point. Vapour pressure climbs steeply with temperature: sodium goes near 300 °C, aluminium, indium, silver and gallium around 1000 °C, but molybdenum and tungsten need about 2000 °C.',
        example: { kind: 'demo', text: 'Slide the pressure up and down: above the threshold the vapour rays scatter.' },
        checks: q('vac'),
      },
      {
        id: 'f-ebeam', title: 'Electron-beam evaporation', scene: PVD(-6, false), sources: [T5(39)],
        factIds: f('s39-ebeam', 's39-table'),
        text: 'For metals that a tungsten boat cannot melt, electrons from a hot filament are bent round by a magnet onto the source, which sits in a water-cooled copper hearth. Only a small spot melts, so the source contaminates itself least: this gives the purest films and handles high-melting metals, and like all evaporation it suits lift-off. But the beam generates X-rays that can damage devices, alloys are hard to evaporate evenly, and step coverage is poor. A heated filament is simpler, but limited to low-melting metals.',
        checks: q('ebeam'),
      },
      {
        id: 'f-vacuum', title: 'How empty is empty', scene: PVD(-6), sources: [T5(40)],
        factIds: f('s40-gauges', 's40-table'),
        text: 'No single gauge covers the range. A manometer reads from atmosphere down to about 1 torr; a thermocouple gauge from 1 to 10⁻³ torr, the range of mechanical pumps; an ionisation gauge from 10⁻³ to 10⁻⁹ torr. Slide 40’s table shows what the numbers mean. At 760 Torr there are 2 × 10²⁵ molecules per m³, a molecule travels 7 × 10⁻⁸ m between collisions, and a clean surface is covered in a nanosecond. The mean free path and the time to collect a monolayer both grow in proportion to 1/P.',
        example: { kind: 'demo', text: 'The table in the panel highlights the row nearest your pressure.' },
        checks: q('mfp', 'mlt'),
      },
      {
        id: 'f-line', title: 'Straight lines', scene: COV('sputter'), sources: [T5(42)],
        factIds: f('s42-point', 's42-sc'),
        text: 'Evaporation has dropped out of present-day silicon technology for one reason: geometry. The atoms fly from one small spot along straight lines and arrive nearly perpendicular to the wafer, so anything standing up casts a shadow, and contact holes are filled badly. The sticking coefficient, Sc = F_reacted/F_incident, measures the fraction of arriving atoms that stay. If it is below one, some bounce and may land on a wall, which helps a little, but not much.',
        checks: q('evap-side'),
      },
    ],
    review: q('gauge', 'vapour', 's36-when'),
  },
  {
    id: 'f-sputter', title: 'Sputtering and beyond',
    intro: 'Sputtering is the workhorse PVD method today. The chamber’s DC, RF and magnetron modes show its variants.',
    steps: [
      {
        id: 'f-target', title: 'Knocking atoms off', scene: PL('dc'), sources: [T5(44)],
        factIds: f('s44-sputter', 's44-voltage'),
        text: 'Argon ions from a plasma are driven into a plate of the film material, and each impact chips atoms off it; they fly across and coat the wafer. Because the source is a large plate instead of a point, atoms arrive from many angles and walls can be coated. The material just has to be made into a plate. Across the discharge, the plasma itself sits a little positive and nearly all the voltage falls in the dark space right in front of the cathode.',
        checks: q('target'),
      },
      {
        id: 'f-dcrf', title: 'DC, RF and reactive', scene: PL('dc'), sources: [T5(45), T5(46), T5(47)],
        factIds: f('s45-dc', 's46-rf', 's47-reactive'),
        text: 'In DC sputtering the plate is held at −100 to −300 V and the argon ions fall into it. That works for aluminium, tungsten, titanium and silicides, but a plate that does not conduct collects the arriving positive charge until no more ions are attracted. Alternating the voltage at radio frequency gets round that, but large RF supplies are expensive and the self-bias heats insulating plates, so it is rare in production. Adding nitrogen or oxygen to the argon makes compounds instead: a titanium plate in a nitrogen plasma deposits titanium nitride.',
        checks: q('insul'),
      },
      {
        id: 'f-mag', title: 'Magnetrons', scene: PL('dc'), sources: [T5(48)],
        factIds: f('s48-magnetron'),
        text: 'Most electrons in a plain discharge escape before ionising much. Put a magnetic field across the face of the plate and they spiral, trapped close to it, colliding with argon over and over. More ions are made exactly where they are useful, so the sputter rate rises, and the plasma survives at pressures down to about 10⁻³ Torr, where fewer collisions scatter the sputtered atoms on their way to the wafer.',
        example: { kind: 'demo', text: 'Choose the magnetron mode: the ring of magnets behind the plate lights up the ring of erosion in front of it.' },
        checks: q('magnet'),
      },
      {
        id: 'f-compare', title: 'Comparing the methods', scene: COV('cvd'), sources: [T5(49)],
        factIds: f('s49-compare'),
        text: 'Slide 49 lines the methods up over the same trench. CVD and spin-on reach every surface because their material arrives from the gas or flows as a liquid. Evaporation lands only on the surfaces that face the source. Sputtering sits in between: walls are coated, but more material piles up on the upper corners than gets past them, the opening narrows as it grows, and a deep trench can close over with an empty pocket inside.',
        checks: q('overhang'),
      },
      {
        id: 'f-new', title: 'Lasers and single layers', scene: COV('cvd', 5), sources: [T5(50), T5(51)],
        factIds: f('s50-pld', 's51-ald'),
        text: 'Two newer methods finish the topic. In pulsed laser deposition short pulses of light blast a plume of material off a target, which condenses on the substrate. It is simple, clean and fast, copies the target’s composition faithfully, and leaves few defects, but it covers only small areas. Atomic layer deposition, first used for ZnS, feeds its gases one pulse at a time; each reaction stops by itself when the surface is covered, so every pulse adds exactly one layer, scales to large areas and coats deep, narrow pores.',
        checks: q('ald'),
      },
    ],
    review: q('tin', 's40-gauges', 's44-voltage'),
  },
]
