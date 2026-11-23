import { kit, ST } from '../../kit'
import { T6 } from '../../../src/sources'
import type { Scene } from '../../../src/learn/schema'

/** Topic 6 questions that use the model: the growing surface, the barrel reactor, the MBE chamber and the smart-cut wafer. */
const { act, predict, label, calc, gen } = kit('t6', T6)

const MODES = (mode = 'fvdm', coverage = 1.5): Scene => ({ layer: 'surface', tab: 'modes', epi: { mode, coverage } })
const STRAIN = (film = 'InAs', substrate = 'GaAs', thick = 1): Scene => ({ layer: 'surface', tab: 'strain', epi: { film, substrate, thick } })
const SIEPI = (epi: Record<string, unknown> = {}): Scene => ({ layer: 'deposition', tab: 'siepi', epi: { T: 1100, rate: 1, sub: 'As', seal: false, rp: false, ...epi } })
const MBE = (epi: Record<string, unknown> = {}): Scene => ({ layer: 'mbe', epi: { shutter: true, logGa: -3.5, ...epi } })
const SOI = (soi = 0): Scene => ({ layer: 'wafer', tab: 'soi', epi: { soi } })

export default [
  // what epitaxy is (slides 2–4, 7–9)
  predict('bipolar', ['s03-uses'], 'A bipolar transistor needs a lightly doped collector over a heavily doped buried layer. Predict how the lightly doped region is made.', SIEPI(),
    ['an n epitaxial layer grown over the n⁺ buried layer', 'by implanting the substrate', 'by thermal oxidation', 'by spin-on doping'], 0, { ...SIEPI(), look: 'epi-layer' },
    'Epi layers sit over buried layers in bipolar and CMOS.', 'Slide 3.', { obj: 'epi-layer' }),
  act('homo', ['s04-homo'], 'Change the substrate so the film grows by homoepitaxy.', STRAIN('GaAs', 'Si', 5),
    ST('surface', 'strain', [{ path: 'epi.substrate', eq: 'GaAs' }, { path: 'epi.film', eq: 'GaAs' }]), { epi: { substrate: 'GaAs' } }, 'Same material above and below.', { obj: 'surface-film' }),
  predict('sos', ['s04-hetero', 's04-def'], 'Silicon is grown on sapphire and its lattice continues the sapphire’s. Predict the word for this.', STRAIN('Ge', 'Si', 1),
    ['heteroepitaxy: a crystalline film on a different crystalline substrate', 'homoepitaxy', 'polycrystalline deposition', 'amorphous growth'], 0, { ...STRAIN('Ge', 'Si', 1), look: 'surface-film' },
    '“Arranged upon”; hetero = different.', 'Two materials.'),
  predict('stages', ['s08-stages', 's07-steps'], 'An atom lands on a flat terrace. Predict what it does next.', MODES('fvdm', 0.3),
    ['diffuses across the terrace until it nucleates an island or attaches to one or a step', 'stays exactly where it lands', 'always evaporates', 'burrows into the substrate'], 0, MODES('fvdm', 0.6),
    'Deposition, diffusion, nucleation, attachment, detachment, edge diffusion, step attachment.', 'Watch the blue adatom.', { obj: 'adatom' }),
  act('sk', ['s09-modes'], 'Switch to the growth mode used to make self-assembled quantum dots: a wetting layer, then islands.', MODES('fvdm', 2),
    ST('surface', 'modes', [{ path: 'epi.mode', eq: 'sk' }]), { epi: { mode: 'sk' } }, 'Two names.', { obj: 'surface-film' }),
  predict('vw', ['s09-modes'], 'The film atoms bond more strongly to each other than to the substrate. Predict the growth mode.', MODES('fvdm', 1),
    ['Volmer–Weber: islands from the start', 'Frank–van der Merwe', 'Stranski–Krastanov', 'perfect layer by layer'], 0, MODES('vw', 1),
    'Islands, wetting then islands, layer by layer.', 'They clump.', { obj: 'surface-film' }),

  // mismatch (slides 4–6, 15–16)
  act('relax', ['s05-modes', 's05-mismatch'], 'Thicken the InAs film on GaAs until it can no longer stay strained and relaxes with misfit dislocations.', STRAIN('InAs', 'GaAs', 1),
    ST('surface', 'strain', [{ path: 'epi.thick', min: 6 }, { path: 'epi.film', eq: 'InAs' }]), { epi: { thick: 15 } }, 'Past the critical thickness.', { obj: 'misfit' }),
  act('match-gaas', ['s06-matched'], 'Click a binary on the chart that is lattice-matched to the GaAs substrate.', STRAIN('InAs', 'GaAs', 5),
    ST('surface', 'strain', [{ path: 'epi.film', eq: 'AlAs' }, { path: 'epi.substrate', eq: 'GaAs' }]), { epi: { film: 'AlAs' } }, 'Straight above GaAs on the chart.', { obj: 'surface-film' }),
  gen('mis', ['s06-chart'], 'A film with lattice constant {af} Å is grown on a substrate of {as} Å. What is the mismatch f, in %?', 'mismatch',
    { af: [6.06, 5.66, 5.87, 6.1], as: [5.65, 5.43] }, 'f = (a_film − a_sub)/a_sub.'),
  predict('strained-si', ['s15-sige', 's16-strained'], 'Silicon is grown thin on a relaxed SiGe layer. Predict the effect on an NMOS transistor in it.', STRAIN('Si', 'Ge', 1),
    ['faster: the stretched Si has higher electron mobility', 'slower: strain always hurts', 'no change', 'it stops conducting'], 0, { ...STRAIN('Si', 'Ge', 1), look: 'surface-film' },
    'Ge content strains the Si lattice and raises electron mobility; Intel used strained Si at 0.05 µm gates.', 'Strain engineering.'),
  calc('mob', ['s15-mobility'], 'Using slide 15’s chart, roughly how many times higher is the electron mobility of InSb than Si at 300 K?', 57, 6, '×',
    'Read both off the chart.', 'InSb ≈ 80 000, Si ≈ 1 400 cm²/V·s: 80 000/1 400 ≈ 57.'),

  // silicon epitaxy (slides 10–14)
  label('barrel', ['s11-reactor', 's11-conditions'], 'Click the faceted susceptor of the barrel epi reactor.', ['barrel'], SIEPI(), 'Lamps heat it.'),
  predict('tcs', ['s11-tcs', 's10-gases'], 'Trichlorosilane and hydrogen flow over a hot wafer. Predict the by-product.', SIEPI(),
    ['HCl: HSiCl₃ + H₂ → Si + 3HCl', 'H₂O', 'SiO₂', 'Cl₂ only'], 0, { ...SIEPI(), look: 'epi-layer' },
    'Chlorosilanes are H₂-reduced; silane is pyrolysed.', 'Balance Cl.', { obj: 'epi-layer' }),
  act('epi-t', ['s11-conditions'], 'Bring the reactor into slide 11’s temperature window for silicon epitaxy.', SIEPI({ T: 1150 }),
    ST('deposition', 'siepi', [{ path: 'epi.T', max: 1100 }]), { epi: { T: 1050 } }, '900–1100 °C.', { obj: 'barrel' }),
  predict('whyepi', ['s12-profile'], 'A design needs a 3 Ω·cm layer at the surface of a 0.01 Ω·cm wafer. Predict how it is made.', SIEPI(),
    ['grow it by epitaxy: diffusion can only add dopant, lowering resistivity', 'diffuse in more dopant', 'implant it', 'oxidise the surface'], 0, { ...SIEPI(), look: 'epi-layer' },
    'Diffusion lowers resistivity; to raise it, grow a new layer.', 'More resistive than the bulk.', { obj: 'epi-layer' }),
  predict('autodope', ['s13-autodoping', 's13-graph'], 'An undoped epi layer is grown on an n⁺ substrate. Predict its doping profile.', SIEPI(),
    ['dopant leaks in: out-diffusion near the interface, then a gas-phase tail', 'perfectly undoped from the interface up', 'more heavily doped than the substrate', 'p-type'], 0, { ...SIEPI(), look: 'epi-layer' },
    'Autodoping: solid-state out-diffusion plus dopant from the gas phase.', 'Watch the chart.', { obj: 'epi-layer' }),
  predict('range', ['s13-ranges', 's13-intentional'], 'Predict the highest intentional doping you can get in silicon epi with arsine.', SIEPI(),
    ['about 10²⁰ cm⁻³', '10¹³ cm⁻³', '10²⁴ cm⁻³', 'none: arsine cannot dope'], 0, { ...SIEPI(), look: 'epi-layer' },
    'B 10¹⁶–10¹⁹; As and P 10¹⁶–10²⁰ cm⁻³; incorporation is not linear in the gas.', 'Slide 13.'),
  act('seal', ['s14-minimise'], 'Cut the autodoping from the back of the n⁺ wafer.', SIEPI({ seal: false }),
    ST('deposition', 'siepi', [{ path: 'epi.seal', eq: true }]), { epi: { seal: true } }, 'Seal it.', { obj: 'epi-layer' }),
  predict('slow-diff', ['s14-diffusivity'], 'Predict which substrate dopant out-diffuses least into the epi layer.', SIEPI({ sub: 'B' }),
    ['antimony', 'boron', 'phosphorus', 'indium'], 0, SIEPI({ sub: 'Sb' }),
    'As and Sb diffuse slowest.', 'The diffusivity plot.'),

  // MBE (slides 17–23)
  predict('uhv', ['s18-req', 's17-mbe'], 'The MBE chamber rises to 10⁻⁶ Torr. Predict the effect.', MBE(),
    ['the beams are still collision-free, but the surface picks up contamination', 'nothing at all', 'the beams scatter completely', 'the cells cool down'], 0, { ...MBE(), look: 'mbe-chamber' },
    'Collision-free beams need < 10⁻⁴ Torr; a clean surface needs < 10⁻⁹ Torr.', 'Two thresholds.', { obj: 'mbe-chamber' }),
  label('cell', ['s19-chamber'], 'Click the effusion cells that make the molecular beams.', ['mbe-cell'], MBE(), 'Aimed at the substrate.'),
  act('shutter', ['s21-principles'], 'Stop the gallium beam without cooling its cell.', MBE({ shutter: true }),
    ST('mbe', undefined, [{ path: 'epi.shutter', eq: false }]), { epi: { shutter: false } }, 'A mechanical flap.', { obj: 'mbe-shutter' }),
  predict('sharp', ['s22-chars'], 'Predict why MBE can make an interface one atom sharp.', MBE(),
    ['the growth is slow and cool, and the shutters switch the beams in a fraction of a monolayer', 'it is grown at 1200 °C', 'it is wet-etched afterwards', 'it uses a plasma'], 0, { ...MBE(), look: 'mbe-shutter' },
    'Low rate and temperature: thickness control, sharp interfaces, negligible diffusion.', 'Slow and cool.'),
  gen('flux', ['s23-flux'], 'A Ga beam (M = 69.72) at {P} Pa reaches the substrate from a cell at T = {T} K. What is the impingement rate, in molecules cm⁻² s⁻¹?', 'flux',
    { P: [1e-4, 5e-4, 2e-4, 1e-3], M: [69.72], T: [1200, 1100, 1250] }, 'φ = 2.64 × 10²⁰ · P/√(MT).'),
  predict('aperture', ['s23-rate'], 'The effusion cell is moved twice as far from the substrate. Predict the growth rate.', MBE(),
    ['it falls to about a quarter: rate ∝ A/πL²', 'it halves', 'it doubles', 'it is unchanged'], 0, { ...MBE(), look: 'mbe-cell' },
    'Growth rate = φ·(A/πL²)·(ML thickness)/(surface density).', 'Inverse square.', { obj: 'mbe-cell' }),

  // RHEED (slides 24–27)
  label('screen', ['s24-rheed'], 'Click where the diffracted electrons land as streaks.', ['rheed-screen'], MBE(), 'Opposite the gun.'),
  gen('rheed', ['s25-osc'], 'The RHEED intensity oscillates with a period of {per} s while growing a zinc-blende crystal of lattice constant {a} Å on (001). What is the growth rate in µm/h?', 'rheed',
    { per: [1, 2, 0.8, 1.5, 4], a: [5.65, 5.87, 6.06] }, 'One period is one monolayer, a/2 thick.'),
  predict('half', ['s25-osc'], 'Half a monolayer has been deposited. Predict the RHEED intensity.', MBE(),
    ['at a minimum: half-covered terraces scatter most', 'at a maximum', 'zero for ever', 'unchanged from the start'], 0, { ...MBE(), look: 'rheed-screen' },
    'Highest at θ = 0, 1; lowest at θ = 0.5.', 'Rough surface.', { obj: 'rheed-screen' }),
  predict('sl', ['s27-superlattice'], 'Predict what the shutters do to make a superlattice like slide 27’s.', MBE(),
    ['open and close the Al shutter every 15 monolayers, alternating AlGaAs and GaAs', 'keep all shutters open', 'heat the substrate in steps', 'nothing: it forms by itself'], 0, { ...MBE(), look: 'mbe-shutter' },
    'Alternating 15-ML AlGaAs and GaAs layers.', 'Layers of a cake.'),

  // SOI (slides 28–31)
  predict('bathtub', ['s28-soi'], 'Predict why a transistor in SOI switches faster than one in bulk silicon.', SOI(5),
    ['its n⁺ regions reach the buried oxide, so there is little junction capacitance to the body', 'the silicon is thicker', 'it runs hotter', 'the gate is longer'], 0, { ...SOI(5), look: 'soi-box' },
    'Thin Si on oxide: less capacitance, faster devices.', 'The bathtubs touch the oxide.', { obj: 'soi-box' }),
  predict('simox', ['s28-makers'], 'Predict how IBM’s SIMOX makes the buried oxide, unlike smart cut.', SOI(0),
    ['by implanting oxygen into the wafer and annealing', 'by bonding two wafers', 'by spinning on glass', 'by MBE'], 0, SOI(2),
    'SIMOX: separation by implantation of oxygen.', 'Read the acronym.'),
  act('split', ['s29-smartcut'], 'Step the smart-cut process on to the point where the donor wafer splits along the hydrogen layer.', SOI(0),
    ST('wafer', 'soi', [{ path: 'epi.soi', min: 4 }]), { epi: { soi: 4 } }, 'Oxidise, implant, bond, then heat.', { obj: 'soi-split' }),
  label('box', ['s30-tem', 's31-cmos'], 'Click the buried oxide that isolates the thin silicon layer.', ['soi-box'], SOI(5), 'Between the layers.'),
]
