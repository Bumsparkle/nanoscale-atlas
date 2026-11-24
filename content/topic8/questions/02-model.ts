import { kit, ST } from '../../kit'
import { T8 } from '../../../src/sources'
import { ALIGN, BANDS, CONFINE, DOS, FAB, FREE, LAYERS, QMBE, SAMPLE, SCALE, TEM, WELL } from '../scenes'

/** Topic 8 questions that use the model: the scale, the sample's ladder, the wells, wires and dots, the DoS and the fabrication routes. */
const { act, predict, label, gen } = kit('t8', T8)

export default [
  // the nanoscale (slides 2–3)
  act('nano', ['s02-nano', 's02-differ'], 'Slide the size into the nanotechnology range.', SCALE({ logSize: -6 }),
    ST('qsample', 'scale', [{ path: 'nano.logSize', min: -9, max: -7 }]), { nano: { logSize: -8 } }, '1–100 nm.', { obj: 'qs-nanoband' }),
  predict('virus', ['s02-scale'], 'Predict which object is about 100 nm across.', SCALE({ logSize: -8 }),
    ['a virus', 'a bacterium', 'a glucose molecule', 'a full stop'], 0, SCALE({ logSize: -7 }), 'Water 0.1 nm, glucose 1, antibody 10, virus 100 nm, bacteria 1 µm.', 'Between antibody and bacterium.', { obj: 'qs-scale' }),
  predict('qdsize', ['s03-sizes', 's03-bands'], 'A GaAs crystal shrinks from 1 cm to 10 nm. Predict what its electrons see.', SCALE({ logSize: -2 }),
    ['discrete levels: 10 nm is their de Broglie wavelength at 300 K', 'the same bands as bulk', 'nothing changes', 'it becomes a metal'], 0, SCALE({ logSize: -8 }), 'Volume semiconductor → waveguide (1 µm) → quantum dot (10 nm) → atom (1 Å).', 'Slide 3.', { obj: 'qs-nanoband' }),

  // Schrödinger and the free electron (slides 4–5)
  predict('free', ['s05-free', 's04-tise', 's04-1d'], 'With V = 0 everywhere, predict the energies an electron can have.', FREE({ k: 0.3 }),
    ['any: E = ħ²k²/2m for every k, a continuum', 'only discrete levels', 'only zero', 'only negative'], 0, FREE({ k: 0.9 }), 'ψ = Ae^(ikx) solves d²ψ/dx² + (2m/ħ²)Eψ = 0 for any k.', 'No walls.', { obj: 'qv-dispersion' }),
  gen('free-e', ['s05-free'], 'A free electron of effective mass {m} m₀ has k = {k} nm⁻¹. What is its energy, in meV?', 'free-e',
    { m: [0.067, 1, 0.023], k: [0.5, 0.3, 1] }, 'E = ħ²k²/2m, ħ²/2m₀ = 38.1 meV·nm².'),

  // the infinite well (slides 6–8)
  label('well', ['s06-well'], 'Click the potential well.', ['qv-well'], WELL(), 'The walls.'),
  predict('general', ['s06-general', 's07-bc'], 'Inside the well ψ = A sin kx + B cos kx. Predict what ψ(0) = 0 forces.', WELL(),
    ['B = 0; then sin kL = 0 picks k = nπ/L', 'A = 0', 'k = 0', 'nothing'], 0, WELL({ level: 2 }), 'cos 0 = 1, so B must vanish; ψ(L) = 0 then quantises k.', 'cos(0) = 1.', { obj: 'qv-psi' }),
  gen('well-e', ['s07-levels', 's08-plot'], 'An infinite well of width L = {L} nm holds an electron of effective mass {m} m₀. What is E{n}, in meV?', 'well-e',
    { L: [10, 5, 8, 15], m: [1, 0.067, 0.041], n: [1, 2, 3] }, 'Eₙ = n²π²ħ²/(2mL²); π²ħ²/2m₀ = 0.376 eV·nm².'),
  gen('well-de', ['s07-levels', 's10-only'], 'L = {L} nm, m* = {m} m₀. What is the transition energy E{n2} − E{n1}, in meV?', 'well-de',
    { L: [10, 6, 8], m: [0.067, 1, 0.023], n1: [1, 2], n2: [2, 3, 4] }, 'Eₙ ∝ n².'),
  gen('norm', ['s07-norm'], 'Derive the normalisation constant A of ψ = A sin(nπx/L) for L = {L} nm. What is A, in nm^-½?', 'norm',
    { L: [10, 5, 8, 2] }, 'Require ∫₀ᴸ A² sin² dx = 1; the integral is A²L/2.'),
  act('nodes', ['s08-plot'], 'Select the level whose wavefunction has two nodes inside the well.', WELL({ level: 1 }),
    ST('qwave', 'well', [{ path: 'nano.level', eq: 3 }, { path: 'nano.finite', eq: false }]), { nano: { level: 3 } }, 'n − 1 nodes.', { obj: 'qv-psi' }),

  // quantum wells (slides 9–10)
  predict('dbw', ['s09-qw', 's09-dbw'], 'Widen a GaAs well from 5 nm to 60 nm. Predict the levels.', WELL({ L: 5, m: 0.067 }),
    ['they crowd together: confinement only matters near the de Broglie wavelength', 'they spread further apart', 'they stay the same', 'they disappear'], 0, WELL({ L: 60, m: 0.067 }), 'Subbands appear when the width is comparable to the de Broglie wavelength.', 'Eₙ ∝ 1/L².', { obj: 'qv-level' }),
  act('classical', ['s10-classical'], 'Make the well wide enough that its levels look almost continuous (L ≥ 40 nm).', WELL({ L: 10 }),
    ST('qwave', 'well', [{ path: 'nano.L', min: 40 }]), { nano: { L: 50 } }, 'Eₙ₊₁ − Eₙ ∝ 1/L².', { obj: 'qv-level' }),
  predict('zero', ['s10-zero'], 'Predict the energy of the lowest state of an infinite well.', WELL({ level: 1 }),
    ['positive: π²ħ²/(2mL²), never zero', 'exactly zero', 'negative', 'infinite'], 0, { ...WELL({ level: 1 }), look: 'qv-level' }, 'n = 0 would mean ψ = 0: no particle.', 'Zero-point energy.', { obj: 'qv-level' }),
  act('leak', ['s10-leak', 's10-tunnel'], 'Make the well finite and show |ψ|²: let the probability leak into the barriers.', WELL({ finite: false, prob: false }),
    ST('qwave', 'well', [{ path: 'nano.finite', eq: true }, { path: 'nano.prob', eq: true }]), { nano: { finite: true, prob: true, V0: 0.15 } }, 'Two switches.', { obj: 'qv-psi' }),
  predict('lower', ['s10-lower'], 'Make the 10 nm GaAs well finite (0.3 eV deep). Predict its ground level compared with the infinite well.', WELL({ finite: false }),
    ['lower: the wavefunction spreads into the barriers, as if the well were wider', 'higher', 'the same', 'it has no bound level'], 0, WELL({ finite: true, V0: 0.3 }), '28–35 meV rather than 56 meV.', 'Effective width.', { obj: 'qv-level' }),
  act('deep', ['s10-deeper'], 'Deepen the finite well to at least 1 eV and compare its levels with the infinite ones.', WELL({ finite: true, V0: 0.15 }),
    ST('qwave', 'well', [{ path: 'nano.V0', min: 1 }, { path: 'nano.finite', eq: true }]), { nano: { V0: 1.2 } }, 'Low levels approach the infinite well.', { obj: 'qv-well' }),

  // heterostructures (slide 11)
  act('type2', ['s11-type2'], 'Pick a pair that forms a type-II heterostructure (InP between InAlAs).', ALIGN(),
    ST('qbands', 'align', [{ path: 'nano.well', eq: 'InP' }, { path: 'nano.barrier', eq: 'InAlAs' }]), { nano: { well: 'InP', barrier: 'InAlAs' } }, 'Staggered gaps.', { obj: 'qb-hole' }),
  predict('type1', ['s11-type1'], 'GaAs between AlGaAs barriers. Predict where the electron and hole go.', ALIGN({ well: 'InP', barrier: 'InAlAs' }),
    ['both into the GaAs: type I, efficient recombination', 'electron in GaAs, hole in AlGaAs', 'both in AlGaAs', 'neither is confined'], 0, ALIGN({ well: 'GaAs', barrier: 'AlGaAs' }), 'The GaAs gap nests inside AlGaAs’s.', 'Nested gaps.', { obj: 'qb-electron' }),
  label('hole', ['s11-type2'], 'Type II: click the carrier that ends up in the barrier layers.', ['qb-hole'], ALIGN({ well: 'InP', barrier: 'InAlAs' }), 'It floats to the highest valence band.'),
  label('levels', ['s09-qw'], 'Click the confined levels in the quantum well.', ['qb-level'], BANDS(), 'Lines inside the dip.'),

  // wires and dots (slides 12–13)
  act('wire', ['s12-wire', 's12-psi'], 'Confine a second direction to make a quantum wire.', CONFINE({ dims: 1 }),
    ST('qwave', 'confine', [{ path: 'nano.dims', eq: 2 }]), { nano: { dims: 2 } }, 'Two directions.', { obj: 'qv-box' }),
  gen('wire-e', ['s12-e'], 'A quantum wire of cross-section {a} × {b} nm, m* = {m} m₀. What is its lowest level (n = l = 1, k_x = 0), in meV?', 'wire-e',
    { a: [10, 5, 8], b: [10, 20, 8], m: [0.067, 1], n: [1], l: [1] }, 'E = (ħ²π²/2m*)(n²/a² + l²/b²).'),
  act('dot', ['s13-dot', 's13-psi'], 'Confine all three directions to make a quantum dot.', CONFINE({ dims: 2 }),
    ST('qwave', 'confine', [{ path: 'nano.dims', eq: 3 }]), { nano: { dims: 3 } }, 'An artificial atom.', { obj: 'qv-box' }),
  gen('dot-e', ['s13-e'], 'A cubic quantum dot of side a = {a} nm, m* = {m} m₀. What is the energy of the ({n},{l},{j}) state, in meV?', 'dot-e',
    { a: [10, 6, 8], m: [0.067, 0.023], n: [1, 2], l: [1], j: [1, 2] }, 'E = (ħ²π²/2m*a²)(n² + l² + j²).'),
  predict('degenerate', ['s13-e', 's12-e'], 'In a cubic dot, predict how many states share the second level, (2,1,1).', CONFINE({ dims: 3 }),
    ['three: (2,1,1), (1,2,1), (1,1,2)', 'one', 'six', 'none'], 0, CONFINE({ dims: 3, c: 12 }), 'Equal sides make permutations degenerate; changing one side splits them.', 'Permute the numbers.', { obj: 'qv-level' }),

  // making them (slides 14–22)
  label('tem', ['s09-dbw'], 'Click a quantum-well layer in the cross-section.', ['hs-well'], TEM({ sample: 'mqw' }), 'The dark stripes.'),
  act('grow', ['s22-mbe', 's09-qw'], 'Grow the GaAs quantum-well sample up to and including the well.', QMBE({ grown: 1 }),
    ST('qmbe', undefined, [{ path: 'nano.grown', min: 3 }]), { nano: { grown: 3 } }, 'Layer 3.', { obj: 'qmbe-stack' }),
  label('gates', ['s15-wire'], 'Click the split gates.', ['nf-gates'], FAB('wires'), 'Two strips on top.'),
  act('vls', ['s16-vls'], 'Step the VLS growth to the point where the wire grows under the droplet.', FAB('vls', { fstep: 0 }),
    ST('nanofab', 'vls', [{ path: 'nano.fstep', min: 3 }]), { nano: { fstep: 3 } }, 'Step 4.', { obj: 'nf-nanowire' }),
  act('self', ['s16-seeds'], 'Switch to a self-catalysed (Ga) seed.', FAB('vls', { seed: 'au', fstep: 3 }),
    ST('nanofab', 'vls', [{ path: 'nano.seed', eq: 'self' }]), { nano: { seed: 'self' } }, 'No gold.', { obj: 'nf-droplet' }),
  predict('pillars', ['s17-goal', 's18-pillars', 's18-disadv'], 'A quantum-well wafer is patterned by e-beam lithography and etched into pillars. Predict the result.', FAB('pillars', { fstep: 0 }),
    ['dots confined in 3D, but few, slow to make and damaged at the walls', 'a perfect dense array of dots', 'quantum wires', 'nothing: etching destroys the well'], 0, FAB('pillars', { fstep: 1 }), 'The well confines vertically; the walls the other two directions.', 'Slide 18.', { obj: 'nf-pillar' }),
  act('red', ['s19-colour'], 'Grow the colloidal dots until they glow red (diameter ≥ 6.5 nm).', FAB('colloid', { dotNm: 4 }),
    ST('nanofab', 'colloid', [{ path: 'nano.dotNm', min: 6.5 }]), { nano: { dotNm: 7 } }, 'Bigger is redder.', { obj: 'nf-colloid' }),
  predict('colloid', ['s19-colloid', 's19-dispersion'], 'Predict the main drawback of dots precipitated from solution.', FAB('colloid'),
    ['their sizes vary (size dispersion), so their colours do', 'they need UHV', 'they are III–V only', 'they cannot be capped'], 0, FAB('colloid', { dotNm: 5 }), 'Typically II–VI (CdS, CdSe), capped, core–shell; size dispersion.', 'Slide 19.', { obj: 'nf-colloid' }),
  predict('pattern', ['s20-patterned', 's20-disadv'], 'Dots grow in pyramid recesses etched through a mask. Predict what limits how many you get.', FAB('patterned', { fstep: 0 }),
    ['the mask pattern sets the density', 'nothing: they are unlimited', 'the colour', 'the gold'], 0, FAB('patterned', { fstep: 1 }), 'One dot per recess.', 'Slide 20.', { obj: 'nf-pyramid' }),
  act('sk', ['s21-sk', 's22-size'], 'Deposit enough InAs for islands to form on the wetting layer.', FAB('sk', { fstep: 1 }),
    ST('nanofab', 'sk', [{ path: 'nano.fstep', min: 4 }]), { nano: { fstep: 5 } }, 'Past ≈ 1.7 monolayers.', { obj: 'nf-island' }),
  predict('sk-dis', ['s21-disadv', 's22-size'], 'Predict the weakness of self-assembled InAs islands.', FAB('sk', { fstep: 3 }),
    ['size and shape fluctuations, and poor ordering', 'they are too large to confine', 'they need gold', 'they are amorphous'], 0, FAB('sk', { fstep: 6 }), 'Typically 2–10 nm high, 20–40 nm wide, with a spread.', 'Slide 21.', { obj: 'nf-island' }),

  // density of states (slides 23–31)
  act('show2d', ['s23-dims', 's27-2d'], 'Show the density of states of a quantum well (two degrees of freedom).', DOS({ dof: 3 }),
    ST('qwave', 'dos', [{ path: 'nano.dof', eq: 2 }]), { nano: { dof: 2 } }, 'A step.', { obj: 'qv-kspace' }),
  label('kspace', ['s24-cell', 's23-def'], 'Click the grid of allowed states.', ['qv-kspace'], DOS(), 'Each point a standing wave.'),
  gen('n3', ['s25-count', 's24-cell'], 'States below k = {k} nm⁻¹ in a cube of side L = {L} nm (two spins): how many?', 'nstates3',
    { k: [0.5, 0.3, 1], L: [60, 100, 30] }, 'N = k³L³/(3π²).'),
  gen('dos3', ['s25-dos'], 'Bulk with m* = {m} m₀: what is the 3D density of states {E} meV above the band edge, in eV⁻¹ cm⁻³?', 'dos3',
    { m: [0.067, 1, 0.5], E: [50, 100, 25] }, 'ρ = (1/2π²)(2m/ħ²)^(3/2) √E.'),
  gen('dos2', ['s27-2d', 's26-2d'], 'What is the 2D density of states of one subband for m* = {m} m₀, in eV⁻¹ cm⁻²?', 'dos2',
    { m: [0.067, 1, 0.5, 0.041] }, 'ρ = m/(πħ²).'),
  gen('dos1', ['s29-1d', 's28-1d'], 'A quantum wire subband with m* = {m} m₀: what is the 1D DoS {E} meV above its edge, in eV⁻¹ cm⁻¹?', 'dos1',
    { m: [0.067, 1], E: [10, 50, 25] }, 'ρ = (1/π)√(2m/ħ²)E^(−½), with N = 2kL/π.'),
  act('show0d', ['s30-0d'], 'Show the density of states of a quantum dot.', DOS({ dof: 1 }),
    ST('qwave', 'dos', [{ path: 'nano.dof', eq: 0 }]), { nano: { dof: 0 } }, 'Delta functions.', { obj: 'qv-kspace' }),
  predict('edge', ['s27-2d', 's25-dos'], 'Just above the band edge, predict which has more available states: bulk or a quantum well.', DOS({ dof: 3, E: 5 }),
    ['the well: its DoS steps straight up, while bulk rises from zero as √E', 'bulk', 'equal', 'neither has any'], 0, DOS({ dof: 2, E: 5 }), 'ρ₂D = m/πħ² right at the edge.', 'Compare the curves at small E.', { obj: 'qv-kspace' }),
  predict('wire1d', ['s28-1d', 's29-1d'], 'Predict the shape of a quantum wire’s DoS just above each subband edge.', DOS({ dof: 2 }),
    ['a spike falling as (E − Eₙ)^(−½)', 'a flat step', 'a smooth √E rise', 'a single line'], 0, DOS({ dof: 1 }), 'ρ₁D = (1/π)√(2m/ħ²)E^(−½) per subband.', 'Slide 31, green.', { obj: 'qv-kspace' }),

  // why dots, the QD laser (slides 32–33)
  predict('narrow', ['s32-narrow', 's30-0d'], 'Predict the emission spectrum of an ensemble of identical dots.', DOS({ dof: 0 }),
    ['narrow, from the δ-function density of states', 'broad, like bulk', 'continuous white light', 'none'], 0, FAB('laser'), 'Discrete levels, narrow lines.', 'δ-function DoS.', { obj: 'nf-laser' }),
  act('hot', ['s33-curves', 's32-separation'], 'Heat the QD laser to 85 °C or more and compare thresholds.', FAB('laser', { T: 25 }),
    ST('nanofab', 'laser', [{ path: 'nano.T', min: 85 }]), { nano: { T: 90 } }, 'The QW threshold climbs; the QD one stays.', { obj: 'nf-laser' }),
  predict('threshold', ['s32-volume', 's33-laser'], 'Predict the threshold current density of a QD laser compared with a QW laser.', FAB('laser'),
    ['lower: the active volume is tiny', 'higher', 'the same', 'it cannot lase'], 0, FAB('laser', { T: 60 }), 'Low threshold current density and stable operation.', 'Slide 33.', { obj: 'nf-laser' }),
  predict('sample', ['s02-differ'], 'The grown sample is cleaved. Predict whether you can see the quantum well by eye.', SAMPLE(),
    ['no: it is nm thick on a substrate ~0.5 mm thick', 'yes, as a coloured stripe', 'yes, it glows', 'it is the whole wafer'], 0, LAYERS(), 'The layers show only at nanometre scale.', 'Compare the sizes.', { obj: 'qs-edge' }),
]
