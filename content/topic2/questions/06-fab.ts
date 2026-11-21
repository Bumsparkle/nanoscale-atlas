import { act, calc, CELL, FAB, H, label, predict, recall, short } from './_kit'

/** Slides 29–45: the fabrication sequence. "do" questions are checked against the timeline step. */
const go = (id: string, slide: number, facts: string[], prompt: string, from: string, steps: string[], hint: string, sol: string) =>
  act(id, slide, facts, prompt, FAB(from), { kind: 'fab', steps }, { view: 'fab', step: steps[0] }, [H(hint)], sol, { d: 1 })
const SPINS = ['n-well-spin', 'gate-spin', 'n+-spin', 'p+-spin', 'contacts-spin', 'metal-spin']

export default [
  go('q-s29-start', 29, ['s29-start'], 'Go back to the very first step: the blank wafer.', 'al', ['start'], 'Drag the timeline to its start, or press Home.', 'Start with a blank wafer and build the inverter from the bottom up (slide 29).'),
  recall('q-s29-bottom', 29, ['s29-start'], 'The inverter is built…', ['from the top down', 'from the bottom up', 'in a single step', 'on the back of the wafer'], 1,
    [H('Wells come before gates, gates before metal.')], 'From the bottom up (slide 29).'),
  predict('q-s29-first', 29, ['s29-first'], 'The wafer is blank. Predict the first structure the process forms.', FAB('start'),
    ['the polysilicon gate', 'the n-well', 'the contacts', 'the metal wires'], 1,
    { view: 'fab', step: 'nwell-implant' }, 'The n-well appears: it must exist before anything is built on top of it.',
    [H('Bottom up: which region lies deepest?')], 'The first step forms the n-well (slide 29).'),
  label('q-s29-first-l', 29, ['s29-first'], 'Click the first structure the process forms.', ['nwell'], FAB('nwell-strip-ox'),
    [H('It is the only region formed so far.')], 'The n-well (slide 29).'),
  recall('q-s29-seq', 29, ['s29-sequence'], 'Which order forms the n-well (slide 29)?', ['implant, cover with SiO₂, remove SiO₂, strip', 'cover with SiO₂, remove SiO₂ where the well goes, implant/diffuse, strip SiO₂', 'strip SiO₂, implant, cover', 'deposit poly, implant, etch'], 1,
    [H('The oxide is the stencil, so it must be there and opened before the dopants arrive.')], 'Cover with SiO₂, remove it where the n-well goes, implant or diffuse n dopants, strip the SiO₂ (slide 29).'),
  go('q-s29-implant', 29, ['s29-sequence', 's35-methods'], 'Step to where n dopants enter the exposed wafer.', 'start', ['nwell-implant'], 'Watch for the ion beam.', 'The n-well implant (or diffusion) comes after the oxide is opened (slides 29, 35).'),

  // 30
  go('q-s30-grow', 30, ['s30-grow'], 'Step to where SiO₂ is grown on the wafer.', 'start', ['nwell-ox'], 'Look for the furnace glow.', 'Grow SiO₂ on top of the Si wafer (slide 30).'),
  label('q-s30-oxide', 30, ['s30-grow'], 'Click the oxide just grown.', ['mask-oxide'], FAB('nwell-ox'),
    [H('It covers the whole wafer.')], 'The SiO₂ grown in the furnace (slide 30).'),
  recall('q-s30-temp', 30, ['s30-temp'], 'Thermal oxidation runs at…', ['200–400 °C in air', '900–1200 °C with H₂O or O₂', '1500–2000 °C in argon', 'room temperature in HF'], 1,
    [H('Hot enough to glow; the gas supplies the oxygen.')], '900–1200 °C with H₂O or O₂ in an oxidation furnace (slide 30).'),
  calc('q-s30-kelvin', 30, ['s30-temp'], 'What is the upper end of the oxidation temperature range in kelvin?', 1473, 1, 'K',
    [H('Take the top of the slide 30 range and add 273.')], 'The range is 900–1200 °C; 1200 + 273 = 1473 K (slide 30).'),

  // 31
  go('q-s31-spin', 31, ['s31-spin'], 'Step to a photoresist spin.', 'nwell-ox', SPINS, 'Find the yellow-light step that coats the wafer.', 'Spin on photoresist (slide 31).'),
  label('q-s31-resist', 31, ['s31-spin', 's31-resist'], 'Click the photoresist.', ['photoresist'], FAB('n-well-spin'),
    [H('The amber layer on top.')], 'Photoresist, a light-sensitive organic polymer (slide 31).'),
  recall('q-s31-what', 31, ['s31-resist'], 'Photoresist is…', ['a metal', 'a light-sensitive organic polymer', 'an oxide', 'a dopant gas'], 1,
    [H('It reacts to light.')], 'A light-sensitive organic polymer (slide 31).'),
  predict('q-s31-soft', 31, ['s31-soften'], 'The resist has just been exposed (paler areas). Predict what developing does.', FAB('n-well-expose'),
    ['the exposed, softened resist washes away', 'the unexposed resist washes away', 'all the resist washes away', 'the oxide washes away'], 0,
    { view: 'fab', step: 'n-well-develop' }, 'The softened resist dissolves, opening a window to the oxide.',
    [H('Light softens this resist.')], 'Photoresist softens where exposed to light, so the exposed areas are stripped (slides 31–32).', { obj: 'photoresist' }),
  recall('q-s31-soft-r', 31, ['s31-soften'], 'This photoresist…', ['hardens where exposed to light', 'softens where exposed to light', 'is unaffected by light', 'conducts when lit'], 1,
    [H('Exposed areas are the ones later removed.')], 'Softens where exposed (slide 31).'),

  // 32
  go('q-s32-expose', 32, ['s32-expose'], 'Step to where the resist is exposed through the n-well mask.', 'n-well-spin', ['n-well-expose'], 'The reticle hovers over the wafer.', 'Expose photoresist through the n-well mask (slide 32).'),
  recall('q-s32-mask', 32, ['s32-expose'], 'The first mask used in the process is the…', ['metal mask', 'contact mask', 'n-well mask', 'poly mask'], 2,
    [H('The first structure formed is…')], 'The n-well mask (slide 32).'),
  go('q-s32-strip', 32, ['s32-strip'], 'Step to where the exposed photoresist is stripped off.', 'n-well-expose', ['n-well-develop'], 'The step right after exposure.', 'Strip off the exposed photoresist (slide 32).'),
  recall('q-s32-which', 32, ['s32-strip'], 'After exposure, which photoresist is stripped?', ['the exposed resist', 'the unexposed resist', 'all of it', 'none'], 0,
    [H('Exposure softened it.')], 'The exposed photoresist (slide 32).'),

  // 33
  go('q-s33-etch', 33, ['s33-hf'], 'Step to the oxide etch.', 'n-well-develop', ['n-well-etch'], 'The wet bench appears.', 'Etch oxide with hydrofluoric acid (slide 33).'),
  short('q-s33-acid', 33, ['s33-hf'], 'Which acid etches the oxide?', ['hf', 'hydrofluoric acid', 'hydrofluoric'],
    [H('Two letters; slide 33 warns it is nasty.')], 'Hydrofluoric acid, HF (slide 33).'),
  recall('q-s33-danger', 33, ['s33-danger'], 'Why does slide 33 call HF "nasty stuff"?', ['it smells bad', 'it seeps through skin and eats bone', 'it is radioactive', 'it explodes on contact'], 1,
    [H('Slide 33 gives the warning.')], 'HF seeps through skin and eats bone (slide 33).'),
  predict('q-s33-only', 33, ['s33-only'], 'The resist has been developed. Predict where HF removes oxide.', FAB('n-well-develop'),
    ['everywhere', 'only where the resist has been removed', 'only under the resist', 'nowhere: HF only etches silicon'], 1,
    { view: 'fab', step: 'n-well-etch' }, 'Oxide disappears only in the window; under the resist it survives.',
    [H('The resist protects what it covers.')], 'HF only attacks oxide where the resist has been exposed and removed (slide 33).'),
  label('q-s33-left', 33, ['s33-only'], 'Click the oxide that HF did not attack.', ['mask-oxide'], FAB('n-well-etch'),
    [H('It is still covered by resist.', 'photoresist')], 'Oxide under the remaining resist survives the etch (slide 33).'),

  // 34
  short('q-s34-piranha', 34, ['s34-piranha'], 'The acid mixture used to strip the remaining photoresist is called…', ['piranha', 'piranha etch', 'piranah', 'piranah etch'],
    [H('Named after a fish.')], 'Piranha etch (slide 34).'),
  go('q-s34-strip', 34, ['s34-piranha'], 'Step to where the remaining photoresist is stripped.', 'n-well-etch', ['n-well-strip'], 'After the etch, the resist has done its job.', 'Strip the remaining photoresist with piranha (slide 34).'),
  recall('q-s34-why', 34, ['s34-why'], 'Why strip the photoresist before the next step?', ['to save money', "so it doesn't melt in the next (hot) step", 'to expose it again', 'it is toxic'], 1,
    [H('The next step is a furnace or implanter.')], "So the resist doesn't melt in the next step (slide 34)."),
  predict('q-s34-next', 34, ['s34-why'], 'The next step forms the n-well in a hot furnace or implanter. Predict what must be removed first.', FAB('n-well-etch'),
    ['the photoresist', 'the oxide', 'the substrate', 'nothing'], 0,
    { view: 'fab', step: 'n-well-strip' }, 'The resist is stripped; only the oxide stencil remains.',
    [H('Which layer is an organic polymer?')], "The resist would melt, so it is stripped first (slide 34)."),

  // 35
  recall('q-s35-methods', 35, ['s35-methods'], 'The n-well is formed by…', ['sputtering or CVD', 'diffusion or ion implantation', 'oxidation', 'lithography alone'], 1,
    [H('Two ways to get dopants into silicon.')], 'Diffusion or ion implantation (slide 35).'),
  predict('q-s35-diff', 35, ['s35-diffusion'], 'The wafer goes into a furnace with arsenic gas. Predict which atoms enter the exposed silicon.', FAB('n-well-strip'),
    ['boron', 'arsenic', 'oxygen', 'aluminium'], 1,
    { view: 'fab', step: 'nwell-implant' }, 'As atoms enter the exposed Si and form the n-well.',
    [H('The gas in the furnace is the source.')], 'Heat until As atoms diffuse into the exposed Si (slide 35).'),
  recall('q-s35-diff-r', 35, ['s35-diffusion'], 'In the diffusion method, the wafer is…', ['blasted with a beam of ions', 'placed in a furnace with arsenic gas and heated', 'dipped in HF', 'spun with resist'], 1,
    [H('Diffusion needs heat and a gas source.')], 'Furnace with arsenic gas, heated until As diffuses into exposed Si (slide 35).'),
  recall('q-s35-implant', 35, ['s35-implant'], 'In ion implantation, the wafer is…', ['heated in silane', 'blasted with a beam of As ions', 'covered with aluminium', 'exposed to UV'], 1,
    [H('Implantation is a beam process.')], 'Blasted with a beam of As ions (slide 35).'),
  label('q-s35-implant-l', 35, ['s35-implant'], 'Click the region the As ions have formed.', ['nwell'], FAB('nwell-implant'),
    [H('It sits where the oxide was opened.')], 'The n-well (slide 35).'),
  predict('q-s35-block', 35, ['s35-block'], 'The oxide stencil is in place. Predict where the As ions end up in the silicon.', FAB('n-well-strip'),
    ['everywhere in the wafer', 'only where the silicon is exposed', 'only under the oxide', 'nowhere'], 1,
    { view: 'fab', step: 'nwell-implant' }, 'Ions stop in the oxide; they enter only the exposed window.',
    [H('Watch where the ions stop in the beam.')], 'Ions are blocked by SiO₂ and only enter exposed Si (slide 35).'),
  recall('q-s35-block-r', 35, ['s35-block'], 'What blocks the As ions outside the n-well?', ['the substrate', 'the SiO₂ layer', 'the metal', 'nothing'], 1,
    [H('The stencil layer.')], 'SiO₂ (slide 35).'),

  // 36
  go('q-s36-strip', 36, ['s36-strip'], 'Step to where the remaining oxide is stripped, leaving a bare wafer with an n-well.', 'nwell-implant', ['nwell-strip-ox'], 'Right after the well is formed.', 'Strip off the remaining oxide using HF (slide 36).'),
  recall('q-s36-hf', 36, ['s36-strip'], 'The remaining oxide is stripped using…', ['piranha', 'HF', 'silane', 'arsenic gas'], 1,
    [H('The same acid that etched it.')], 'HF, leaving a bare wafer with an n-well (slide 36).'),
  recall('q-s36-similar', 36, ['s36-similar'], 'What does slide 36 say about the remaining steps?', ['they are all different', 'they involve a similar series of steps', 'they need no masks', 'they happen in one furnace'], 1,
    [H('Oxide, resist, expose, develop, etch, strip…')], 'Subsequent steps involve a similar series of steps (slide 36).'),

  // 37
  go('q-s37-gox', 37, ['s37-gox'], 'Step to where the thin gate oxide is deposited.', 'nwell-strip-ox', ['gate-ox'], 'The step right after the n-well is finished.', 'Deposit a very thin layer of gate oxide (slide 37).'),
  label('q-s37-gox-l', 37, ['s37-gox'], 'Click the very thin layer just deposited.', ['gate-oxide'], FAB('gate-ox'),
    [H('It is drawn 50× thicker than reality.')], 'The gate oxide, < 20 Å (slide 37).'),
  calc('q-s37-nm', 37, ['s37-thickness'], 'The gate oxide is less than 20 Å thick. Express 20 Å in nm.', 2, 0.001, 'nm',
    [H('1 nm = 10 Å.')], '20 Å = 2 nm, about 6–7 atomic layers (slide 37).', { obj: 'gate-oxide' }),
  recall('q-s37-layers', 37, ['s37-thickness'], 'About how many atomic layers is < 20 Å of gate oxide?', ['1', '6–7', '60–70', '600'], 1,
    [H('Zoom to the gate oxide layer and count.', 'gate-oxide')], '6–7 atomic layers (slide 37).', { obj: 'oxide-film' }),
  short('q-s37-silane', 37, ['s37-cvd'], 'Which gas is used for the CVD of the silicon layer?', ['silane', 'sih4'],
    [H('SiH₄.')], 'Silane, SiH₄ (slide 37).'),
  go('q-s37-cvd', 37, ['s37-cvd'], 'Step to the chemical vapour deposition of silicon.', 'gate-ox', ['gate-poly'], 'The step after the thin oxide.', 'CVD of silicon in a furnace with silane (slide 37).'),
  label('q-s37-poly', 37, ['s37-poly'], 'Click the many small crystals formed by CVD.', ['oxide-poly'], { layer: 'oxide' },
    [H('Above the oxide.', 'oxide-film')], 'CVD forms many small crystals: polysilicon (slide 37).'),
  recall('q-s37-poly-r', 37, ['s37-poly'], 'CVD of silicon from silane forms…', ['single-crystal silicon', 'polysilicon', 'amorphous oxide', 'aluminium'], 1,
    [H('Many small crystals.')], 'Polysilicon (slide 37).'),
  recall('q-s37-doped', 37, ['s37-doped'], 'Why is the polysilicon heavily doped?', ['to make it transparent', 'to be a good conductor', 'to make it insulate', 'to stop it melting'], 1,
    [H('It is the gate electrode.')], 'Heavily doped to be a good conductor (slide 37).'),

  // 38
  go('q-s38-pattern', 38, ['s38-pattern'], 'Step to where the polysilicon is patterned (etched away outside the gates).', 'gate-develop', ['gate-etch'], 'A plasma etch removes unmasked poly.', 'The same lithography process patterns the poly (slide 38).'),
  predict('q-s38-p', 38, ['s38-pattern'], 'The resist is patterned over the poly. Predict what is left after the etch.', FAB('gate-develop'),
    ['poly only where the resist was', 'poly everywhere', 'no poly at all', 'poly only in the n-well'], 0,
    { view: 'fab', step: 'gate-etch' }, 'Only the U-shaped gate line survives.',
    [H('Same idea as the oxide etch on slide 33.')], 'Same lithography: poly remains only under the resist (slide 38).'),

  // 39
  go('q-s39-open', 39, ['s39-expose'], 'Step to where the oxide is opened over the regions that will get n+ dopants.', 'n-ox', ['n+-etch'], 'Look for the HF etch in the n+ group.', 'Oxide and masking expose where n+ dopants go (slide 39).'),
  recall('q-s39-how', 39, ['s39-expose'], 'How are the n+ regions selected?', ['by heat', 'with oxide and masking', 'with the metal mask', 'they are not selected'], 1,
    [H('Same stencil idea as the n-well.')], 'Use oxide and masking to expose where n+ dopants should go (slide 39).'),
  label('q-s39-forms', 39, ['s39-forms'], 'n-diffusion forms the nMOS source and drain, and one more part. Click it.', ['well-tap'], CELL,
    [H('It is inside the n-well, under VDD.', 'nwell')], 'The n-well contact (well tap) (slide 39).'),
  recall('q-s39-forms-r', 39, ['s39-forms'], 'n-diffusion forms…', ['the pMOS source and drain', 'the nMOS source, drain and n-well contact', 'the substrate tap', 'the gate'], 1,
    [H('n+ regions.')], 'nMOS source, drain and n-well contact (slide 39).'),

  // 40
  go('q-s40-n', 40, ['s40-pattern'], 'Step to where the n+ regions are formed.', 'n+-strip', ['n-implant'], 'Ions again.', 'Pattern oxide and form n+ regions (slide 40).'),
  label('q-s40-n-l', 40, ['s40-pattern'], 'Click an n+ region just formed.', ['nmos-source', 'nmos-drain', 'well-tap'], FAB('n-implant'),
    [H('Next to the nMOS gate, or inside the well.')], 'n+ forms the nMOS source and drain and the well tap (slide 40).'),
  predict('q-s40-sa', 40, ['s40-selfaligned'], 'Predict what happens under the poly gate during the n+ implant.', FAB('n+-strip'),
    ['it becomes n+ too', 'the gate blocks the implant, so it stays p-type', 'the gate melts', 'the oxide becomes n+'], 1,
    { view: 'fab', step: 'n-implant' }, 'Ions stop in the poly; source and drain line up with the gate edges.',
    [H('Which material is sitting on the silicon there?', 'poly-gate')], 'Self-aligned process: the gate blocks the diffusion (slide 40).', { obj: 'poly-gate' }),
  recall('q-s40-sa-r', 40, ['s40-selfaligned'], '"Self-aligned" means…', ['the mask aligns itself', 'the gate blocks the diffusion, so source and drain line up with it', 'the wafer is flat', 'the n-well aligns to the metal'], 1,
    [H('What blocks the dopants under the gate?')], 'The gate blocks the diffusion (slide 40).'),
  recall('q-s40-poly', 40, ['s40-poly-better'], 'Why is polysilicon better than metal for self-aligned gates?', ['it is cheaper', "it doesn't melt during later processing", 'it is transparent', 'it is a better insulator'], 1,
    [H('The gate goes in before several hot steps.')], "Poly doesn't melt during later processing (slide 40)."),
  label('q-s40-poly-l', 40, ['s40-poly-better'], 'Click the material chosen for the gate because it survives the later hot steps.', ['poly-gate'], CELL,
    [H('It crosses both transistors.')], 'The polysilicon gate (slide 40).'),
  recall('q-s41-name', 41, ['s41-history'], 'Today the n+ regions are usually made by ion implantation. What are they still called?', ['implants', 'diffusion', 'wells', 'taps'], 1,
    [H('A historical name.')], 'Still called diffusion, because historically the dopants were diffused (slide 41).'),

  // 42
  go('q-s42-strip', 42, ['s42-strip'], 'Step to where the oxide is stripped to complete the n+ patterning.', 'n-implant', ['n-strip-ox'], 'Right after the n+ implant.', 'Strip off oxide to complete the patterning step (slide 42).'),
  recall('q-s42-r', 42, ['s42-strip'], 'What completes the n+ patterning step?', ['stripping the oxide', 'sputtering aluminium', 'growing gate oxide', 'spinning resist'], 0,
    [H('The stencil is no longer needed.')], 'Strip off the oxide (slide 42).'),

  // 43
  go('q-s43-p', 43, ['s43-pdiff'], 'Step to where the p+ regions are formed.', 'p+-strip', ['p-implant'], 'The second implant.', 'A similar set of steps forms p+ diffusion (slide 43).'),
  label('q-s43-sub', 43, ['s43-pdiff'], 'Besides the pMOS source and drain, p+ diffusion forms one more part. Click it.', ['substrate-tap'], CELL,
    [H('Under the GND rail.', 'metal-gnd')], 'The substrate contact (tap) (slide 43).'),
  recall('q-s43-order', 43, ['s43-xsec'], 'After p-diffusion, the slide 43 cross-section reads…', ['p+ n+ n+ p+ p+ n+', 'n+ p+ p+ n+ n+ p+', 'p+ p+ n+ n+', 'n+ n+ n+'], 0,
    [H('Taps at the ends, transistors in between.')], 'p+ n+ n+ p+ p+ n+ (slide 43).'),
  label('q-s43-4th', 43, ['s43-xsec'], 'Reading p+ n+ n+ p+ p+ n+ from the left, click the fourth region.', ['pmos-drain'], { layer: 'cell', view: 'section', section: 'slide27' },
    [H('After the substrate tap and the two nMOS regions comes the pMOS.')], 'The fourth region is the pMOS drain, p+, which connects to Y (slide 43).'),

  // 44
  recall('q-s44-why', 44, ['s44-why'], 'What is the goal of the contact and metal steps?', ['to grow the gate oxide', 'to wire the devices together', 'to dope the well', 'to clean the wafer'], 1,
    [H('Slide 44 opens with "Now we need to…".')], 'Wire together the devices (slide 44).'),
  go('q-s44-fox', 44, ['s44-fox'], 'Step to where the chip is covered with thick field oxide.', 'p-strip-ox', ['fox'], 'After both diffusions.', 'Cover the chip with thick field oxide (slide 44).'),
  label('q-s44-fox-l', 44, ['s44-fox'], 'Click the thick field oxide.', ['field-oxide'], FAB('fox'),
    [H('It covers everything.')], 'The thick field oxide (slide 44).'),
  go('q-s44-cuts', 44, ['s44-cuts'], 'Step to where contact cuts are etched through the oxide.', 'fox', ['contacts-etch'], 'In the contacts group.', 'Etch oxide where contact cuts are needed (slide 44).'),
  predict('q-s44-cuts-p', 44, ['s44-cuts'], 'The contact mask pattern is in the resist. Predict where the etch opens the field oxide.', FAB('contacts-develop'),
    ['everywhere', 'only at the contact cuts, down to the diffusions', 'only over the gates', 'nowhere'], 1,
    { view: 'fab', step: 'contacts-etch' }, 'Six cuts open down to the diffusions.',
    [H('The contact mask is six small squares.')], 'Contact cuts are etched only where needed (slide 44).'),

  // 45
  go('q-s45-al', 45, ['s45-sputter'], 'Step to where aluminium is sputtered over the whole wafer.', 'contacts-strip', ['al'], 'After the contact cuts.', 'Sputter on aluminium over the whole wafer (slide 45).'),
  recall('q-s45-how', 45, ['s45-sputter'], 'How is the aluminium deposited?', ['CVD from silane', 'sputtered over the whole wafer', 'diffused in a furnace', 'implanted'], 1,
    [H('A physical deposition method named on slide 45.')], 'Sputtered over the whole wafer (slide 45).'),
  go('q-s45-wires', 45, ['s45-pattern'], 'Step to where the excess metal is removed, leaving wires.', 'metal-develop', ['metal-etch'], 'The metal etch.', 'Pattern to remove excess metal, leaving wires (slide 45).'),
  predict('q-s45-wires-p', 45, ['s45-pattern'], 'The metal mask is printed in resist. Predict what remains after the metal etch.', FAB('metal-develop'),
    ['the whole aluminium film', 'separate wires: GND, Y and VDD', 'only the contacts', 'no metal'], 1,
    { view: 'fab', step: 'metal-etch' }, 'Three wires remain: GND, Y and VDD.',
    [H('The metal mask has three shapes.')], 'Patterning removes the excess metal, leaving wires (slide 45).'),
]
