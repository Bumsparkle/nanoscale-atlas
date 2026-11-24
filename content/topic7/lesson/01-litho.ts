import { T2, T5, T7 } from '../../../src/sources'
import type { LessonSectionSchema } from '../../../src/learn/schema'
import type { z } from 'zod'
import { FRESNEL, LIFTOFF, MTF, NGL, OPTICS, PROX, RESIST, ROADMAP, TOOL, WRITE } from '../scenes'

/**
 * Chapter 6: Printing smaller (Topic 7). Nine sections: why lithography
 * matters, sources and exposure tools, diffraction, resolution and depth of
 * focus, MTF and coherence, proximity printing, resists, beyond optical
 * lithography, and e-beam writing.
 */
type S = z.input<typeof LessonSectionSchema>
const f = (...n: string[]) => n.map((x) => `t7-${x}`)
const q = (...n: string[]) => n.map((x) => `q-t7-${x}`)
export const questions: unknown[] = []

export const sections: S[] = [
  {
    id: 'l7-why', title: 'Why lithography rules the roadmap',
    intro: 'Every layer of a chip is patterned by lithography. This section reads the roadmap: how fast features shrink, what that demands, and where the plan ran out.',
    steps: [
      {
        id: 'l7-stakes', title: 'The most important step', scene: ROADMAP({ year: 1998 }), sources: [T7(1), T7(2)],
        factIds: f('s02-most', 's02-cost'),
        text: 'Topic 7 is lithography and patterning. A chip has dozens of patterned layers and each one passes under an exposure tool, so the tools are among the most expensive machines in a fab and lithography takes roughly a third of the money spent making a wafer. The lecture calls it arguably the single most important technology in IC manufacturing, because the smallest feature it can print sets transistor size, and so speed, power and cost.',
        example: { kind: 'demo', text: 'Slide the year: the lines are drawn at each node’s half pitch, the wave is the light that prints them.' },
        checks: q('cost'),
      },
      {
        id: 'l7-shrink', title: '0.7× every three years', scene: ROADMAP({ year: 2000 }), sources: [T7(2)],
        factIds: f('s02-shrink', 's02-cd'),
        text: 'The roadmap shrinks linear dimensions by a factor of 0.7 every three years, which halves the area of a transistor. The half pitch goes 250, 180, 130, 90, 65, 45, 32, 22 and 18 nm from 1998 to 2018, and the printed MPU gate is shorter still, from 100 nm in 2000 to 10 nm. Shrinking is not enough on its own: the critical dimension has to be held to about a tenth of the smallest size, and each layer must land on the one below to about a third of a feature.',
        example: { kind: 'worked', text: 'Two three-year steps: 0.7 × 0.7 ≈ 0.49, so a 250 nm node becomes about 122 nm six years later.' },
        checks: q('shrink', 's02-cd'),
      },
      {
        id: 'l7-tech', title: 'Light shorter than the features', scene: ROADMAP({ year: 2007 }), sources: [T7(2)],
        factIds: f('s02-tech'),
        text: 'Until 2002 the exposure light was 248 nm; then 193 nm with resolution-enhancement tricks, and from 2010 water between lens and wafer. Look at the scale: from the late 1990s the lines are narrower than the light printing them. Beyond 2013 the exposure row simply reads “???”, the largest uncertainty in the plan. Meanwhile the field printed in one shot stays the same size every year, so chips grow from hundreds of millions to billions of transistors and each mask level carries terabytes of data.',
        example: { kind: 'demo', text: 'Compare 2004 and 2013: the λ wave barely changes, the lines shrink threefold.' },
        checks: q('tech'),
      },
      {
        id: 'l7-flow', title: 'From layout to wafer', scene: TOOL(), sources: [T7(3), T2(27), T2(46)],
        factIds: f('s03-patterning', 's03-parts'),
        text: 'Patterning starts on a computer: the layout is drawn, simulated and checked against design rules. A mask is then made, a quartz plate with the pattern in chrome, and the wafer is printed from it many times. Printing itself is easiest to think about in three parts: A, the light source; B, the exposure system that carries the mask’s image to the wafer; and C, the resist that records it.',
        example: { kind: 'demo', text: 'The stepper in front of you is drawn from top to bottom in that order: source, condenser, mask, lens, wafer.' },
        checks: q('mask-made'),
      },
    ],
    review: q('overlay', 's02-shrink', 's02-tech'),
  },
  {
    id: 'l7-tools', title: 'Light sources and exposure tools',
    intro: 'Which light, and how it gets from the mask to the wafer. By the end you can pick a source and an exposure system and say what each costs you.',
    steps: [
      {
        id: 'l7-lamps', title: 'Mercury lamps', scene: TOOL({ source: 'g' }), sources: [T7(4)],
        factIds: f('s04-shorter', 's04-hg', 's04-lines'),
        text: 'Diffraction blurs an image by an amount proportional to the wavelength, so every shrink has needed bluer light. For decades the source was a mercury vapour lamp: electrons in a hot plasma are knocked into higher levels by collisions and emit photons as they fall back, giving a handful of sharp lines. Two were used for printing, the g-line at 436 nm and the shorter i-line, which carried the 0.5 µm and 0.35 µm generations.',
        example: { kind: 'demo', text: 'Switch between the lamp lines and watch the colour of the beam and the resolution readout.' },
        checks: q('iline'),
      },
      {
        id: 'l7-excimer', title: 'Excimer lasers', scene: TOOL({ source: 'krf' }), sources: [T7(4)],
        factIds: f('s04-excimer', 's04-lasers', 's04-issues'),
        text: 'In the deep UV the brightest sources are excimer lasers: a discharge drives krypton and NF₃ into an excited KrF molecule that exists only in that state and emits as it falls apart. KrF gives 248 nm (0.25 down to 0.13 µm), ArF 193 nm (130 and 90 nm), and molecular fluorine 157 nm, which the slide abbreviates as “FF”. The hard part is not the laser but everything it shines through: few resists and lens materials stay usable at these wavelengths.',
        example: { kind: 'demo', text: 'Step through KrF, ArF and F₂: R falls with λ.' },
        checks: q('f2'),
      },
      {
        id: 'l7-systems', title: 'Contact and proximity', scene: TOOL({ system: 'contact', source: 'g' }), sources: [T7(5)],
        factIds: f('s05-three', 's05-contact', 's05-gap', 's05-proximity'),
        text: 'Three geometries have been used. In contact printing the mask is pressed onto the resist: the image is sharp, but every contact picks up particles and scratches, and the defect density is unacceptable. Proximity printing holds the mask a few to a few tens of micrometres above the resist; nothing touches, but light spreads in the gap, so features below a few micrometres are hard to print except with X-rays. Both copy the mask at the same size.',
        example: { kind: 'demo', text: 'Try contact, then proximity, and set the gap.' },
        checks: q('contact'),
      },
      {
        id: 'l7-projection', title: 'Projection steppers', scene: TOOL({ system: 'proximity' }), sources: [T7(5)],
        factIds: f('s05-projection', 's05-ratio'),
        text: 'Projection printing puts a lens between mask and wafer. The mask never touches anything, so defects stay low, and the lens images it with high resolution. Because the mask is drawn four or five times larger and demagnified, its features are easier to make and small mask flaws shrink too. The stepper exposes one field, moves, and exposes the next: this is the machine that dominates manufacturing.',
        example: { kind: 'demo', text: 'Switch to projection: a lens appears and the light converges onto the wafer.' },
        checks: q('proj'),
      },
    ],
    review: q('issues', 'prox', 's02-cost'),
  },
  {
    id: 'l7-diffraction', title: 'Diffraction: why a point blurs',
    intro: 'Light does not travel in straight lines through small openings. This section builds the Airy disk and the Rayleigh criterion that define what a lens can resolve.',
    steps: [
      {
        id: 'l7-huygens', title: 'Wavelets', scene: OPTICS({ sep: 0 }), sources: [T7(6)],
        factIds: f('s06-rays', 's06-huygens', 's06-spread'),
        text: 'Ray diagrams work when every opening is many wavelengths across. Huygens and Fresnel’s picture explains what happens otherwise: each point of a wavefront acts as a source of spherical wavelets of the same wavelength, and their sum is the next wavefront. Far from any edge the wavelets rebuild a flat wave; through a narrow opening there are too few of them to do so, and the light leaving it fans out, more so the narrower the opening.',
        example: { kind: 'demo', text: 'One point source: its image is a bright disk with faint rings, not a point.' },
        checks: q('spread'),
      },
      {
        id: 'l7-airy', title: 'The Airy disk', scene: OPTICS({ sep: 0 }), sources: [T7(7)],
        factIds: f('s07-lens', 's07-airy'),
        text: 'To image an aperture onto the resist a lens collects the diffracted light and refocuses it. A lens of finite diameter catches only part of the spread, and the information carried by the rest is lost, so even a perfect point images as a pattern: a central bright disk ringed by dark and bright circles, the Airy disk. Its first dark ring sits at a radius Φ = 1.22λf/d, with f the focal length and d the lens diameter. (The slide draws Φ across the whole disk; its own profile shows it is the radius.)',
        example: { kind: 'worked', text: 'λ = 0.5 µm, f/d = 2: Φ = 1.22 × 0.5 × 2 = 1.22 µm from the centre to the first dark ring.' },
        checks: q('airy', 'airy-r'),
      },
      {
        id: 'l7-point', title: 'When is an image a point?', scene: OPTICS({ sep: 0 }), sources: [T7(7), T7(13)],
        factIds: f('s07-point', 's07-lens', 's07-regimes', 's13-near'),
        text: 'Φ only vanishes in idealised limits of the formula: zero wavelength, zero focal length, or a lens of unbounded diameter. Real optics therefore always blur, and the blur scales with λ. Diffraction is described in two limits: close to the opening (near field, named after Fresnel), the pattern still resembles the opening with ringing edges; far away or at a lens focus (far field, after Fraunhofer), it becomes the Airy-like pattern. Masks a few µm above resist live in the first; projection steppers in the second.',
        example: { kind: 'demo', text: 'Compare this tab with the proximity-gap tab later on.' },
        checks: q('point'),
      },
      {
        id: 'l7-rayleigh', title: 'Rayleigh’s criterion', scene: OPTICS({ sep: 2 }), sources: [T7(8)],
        factIds: f('s08-metrics', 's08-rayleigh'),
        text: 'A projection system is judged by its resolution, depth of focus, field of view, modulation transfer function, alignment accuracy and throughput. For resolution Rayleigh proposed a working rule: two points can just be told apart when the central maximum of one image falls on the first dark ring of the other. Closer than that the two disks merge into one blob; further apart a clear dip separates them.',
        example: { kind: 'demo', text: 'Drag the separation down and watch the dip in the middle of the chart fill in.' },
        checks: q('rayleigh'),
      },
    ],
    review: q('regimes', 's06-huygens', 's04-lines'),
  },
  {
    id: 'l7-resolution', title: 'Resolution and depth of focus',
    intro: 'The two numbers that size every stepper. You will compute R and the DOF, and see why raising one costs the other.',
    steps: [
      {
        id: 'l7-r', title: 'R = k₁λ/NA', scene: TOOL(), sources: [T7(8)],
        factIds: f('s08-r', 's08-na', 's08-k1'),
        text: 'Put Rayleigh’s criterion through a lens of diameter d at distance f: since d = 2f sin α (with n the index of the medium), R = 1.22λf/d = 0.61λ/(n sin α). The product n sin α, where α is the half-angle of the cone of light the lens accepts, is its numerical aperture: how much of the diffracted light it can collect. Writing R = k₁λ/NA replaces Rayleigh’s 0.61 by a factor k₁ that also absorbs the resist and process.',
        example: { kind: 'worked', text: 'λ = 365 nm, NA = 0.5, k₁ = 0.6: R = 0.6 × 365 / 0.5 = 438 nm.' },
        checks: q('res'),
      },
      {
        id: 'l7-k1', title: 'Three ways to print finer', scene: TOOL({ k1: 0.75 }), sources: [T7(9)],
        factIds: f('s09-k1', 's09-improve'),
        text: 'In practice k₁ is measured, not calculated: between about 0.4 and 0.8 depending on the tool and resist. The formula then lists every lever the industry has pulled. Lower k₁ with better resists and illumination tricks; shorten λ with new sources; raise NA with bigger, faster lenses. Each has a price, the subject of the next step.',
        example: { kind: 'demo', text: 'Drag k₁ and NA on the panel and watch R.' },
        checks: q('k1'),
      },
      {
        id: 'l7-dof', title: 'Depth of focus', scene: TOOL({ NA: 0.6 }), sources: [T7(9)],
        factIds: f('s09-dof', 's09-tradeoff'),
        text: 'A lens focuses sharply only within a short distance of the image plane. That range is the depth of focus, ±k₂λ/NA², with k₂ found experimentally (k₂ = ½ gives the textbook ±λ/2NA²). It shrinks with the square of NA: the same wide cone that resolves finer detail also converges steeply, so a slight height error defocuses it. High-NA tools therefore need wafers planarised flat.',
        example: { kind: 'demo', text: 'Raise NA and watch the amber focus band on the wafer thin out.' },
        checks: q('dof', 'tradeoff'),
      },
      {
        id: 'l7-example', title: 'A KrF stepper', scene: TOOL({ source: 'krf', NA: 0.6, k1: 0.75, k2: 0.5 }), sources: [T7(9)],
        factIds: f('s09-example'),
        text: 'Slide 9 works one through: a KrF laser, a lens of NA 0.6, k₁ of 0.75 and k₂ of 0.5. Put the numbers into both formulas, keeping λ in µm, and check them against the panel. The slide rounds its answers to “about 0.3 µm” and “about ±0.35 µm”; note that the DOF form that also appears with k₂ alone, without λ, would be dimensionless and cannot be right.',
        example: { kind: 'demo', text: 'The panel shows R and the DOF for exactly these settings.' },
        checks: q('example'),
      },
    ],
    review: q('shorter', 's08-na', 's07-airy'),
  },
  {
    id: 'l7-mtf', title: 'Contrast: the MTF and coherence',
    intro: 'A resist responds to light intensity, so what matters is contrast. This section measures it with the MTF and shows how the shape of the source changes it.',
    steps: [
      {
        id: 'l7-mtfdef', title: 'Modulation transfer function', scene: MTF({ feature: 600 }), sources: [T7(10)],
        factIds: f('s10-mtf', 's10-threshold'),
        text: 'Print a row of equal lines and spaces. Under the bright lines the intensity peaks at I_max, under the dark spaces it falls to I_min. The modulation transfer function is the contrast (I_max − I_min)/(I_max + I_min): 1 for a perfect square wave, 0 for even grey. A photoresist has a threshold; it needs a contrast of roughly one half or better to tell a line from a space.',
        example: { kind: 'worked', text: 'I_max = 0.8, I_min = 0.2: (0.8 − 0.2)/(0.8 + 0.2) = 0.6, enough to print.' },
        checks: q('mtf'),
      },
      {
        id: 'l7-overlap', title: 'Overlapping Airy discs', scene: MTF({ feature: 300 }), sources: [T7(10)],
        factIds: f('s10-aerial', 's10-optics', 's10-depends', 's10-coherent'),
        text: 'In a stepper the light passes the condenser lens, the mask, an aperture and the projection lens to reach the resist. At the mask the pattern is perfect: well-separated structures several times larger than on the wafer give the full square wave. On the wafer each opening becomes an Airy-like spot, and when openings are close their spots spill into each other: the bright tops sag and the dark gaps lighten. The MTF therefore depends on feature size and on how coherent the source is. Strictly it is defined for coherent light, and steppers are only partly coherent.',
        example: { kind: 'demo', text: 'Shrink the line width: the waves flatten and sink towards the red threshold plane.' },
        checks: q('aerial'),
      },
      {
        id: 'l7-coherence', title: 'Spatial coherence', scene: MTF({ S: 0.6 }), sources: [T7(11)],
        factIds: f('s11-coherence', 's11-s', 's11-typical'),
        text: 'An ideal point source behind the condenser sends a single plane wave onto the mask: every ray arrives at one angle, the light is spatially coherent. A real lamp or laser spot has size, so the mask is lit from a spread of angles. The spread is measured by S, the source diameter over the condenser diameter, equivalently the condenser’s NA over the projection lens’s NA. Modern tools run at S of about 0.5 to 0.7.',
        example: { kind: 'worked', text: 'A condenser of NA 0.4 under a projection lens of NA 0.8: S = 0.4/0.8 = 0.5.' },
        checks: q('coh', 'angles'),
      },
      {
        id: 'l7-mtfcurve', title: 'MTF against feature size', scene: MTF({ feature: 400, S: 0.1 }), sources: [T7(12)],
        factIds: f('s12-curve', 's12-s'),
        text: 'Plot MTF against feature size and it starts near 1 for broad features and drops towards nothing as diffraction erases the small ones. Changing S reshapes the curve: more incoherent light (S rising) costs some contrast on mid-sized features but extends printing to finer ones, past the point where coherent light gives none at all. As S goes to zero the light gets weaker, another reason for the compromise of 0.5–0.7.',
        example: { kind: 'demo', text: 'Set lines near 160 nm and drag S from 0.1 to 0.9; the chart’s three dashed curves show S = 0, 0.5 and 0.9.' },
        checks: q('s-small'),
      },
    ],
    review: q('lose', 'curve', 's09-tradeoff'),
  },
  {
    id: 'l7-proximity', title: 'Contact and proximity printing',
    intro: 'Back to the near field. You will see why a gap between mask and resist sets a hard lower limit, W_min ≈ √(λg).',
    steps: [
      {
        id: 'l7-fresnel', title: 'Ringing edges', scene: FRESNEL({ S: 0 }), sources: [T7(13)],
        factIds: f('s13-ringing'),
        text: 'Under a proximity mask there is always some gap between mask and resist. Imagine point sources filling the opening of width W, each sending out spherical waves; at the resist they add with different path lengths, reinforcing in some places and cancelling in others. The image is the opening, but with ripples at its edges and light leaking past them into resist that should stay dark. With partly incoherent light the ripples from different source points fall in different places and wash out.',
        example: { kind: 'demo', text: 'Drag the incoherence slider: the overshoots at the edges flatten.' },
        checks: q('ring'),
      },
      {
        id: 'l7-wmin', title: 'The smallest printable opening', scene: FRESNEL({ source: 'i', gap: 10, W: 4 }), sources: [T7(14)],
        factIds: f('s14-range', 's14-wmin', 's14-example'),
        text: 'This near-field picture holds while the gap is longer than a wavelength but shorter than W²/λ; beyond that the far-field picture takes over. Inside that range the smallest opening that still prints is about the square root of λ times the gap. With i-line light and a 10 µm gap that comes to roughly two micrometres, which is why proximity printers stopped at a few micrometres.',
        example: { kind: 'demo', text: 'Narrow W below the W_min readout: the image blurs into a single low hump.' },
        checks: q('wmin', 'gmax'),
      },
      {
        id: 'l7-limits', title: 'Three images compared', scene: FRESNEL({ gap: 1 }), sources: [T7(14)],
        factIds: f('s14-contact', 's14-summary'),
        text: 'Shrink the gap to nothing and the image follows the opening almost exactly: contact printing could in principle reach about a tenth of a micrometre, but the damage from contact rules it out. With a gap the edges ring and spread (proximity). Through a lens the image is a smooth rounded hump whose width is set by λ/NA rather than by any gap (projection).',
        example: { kind: 'demo', text: 'Take the gap down to 0.5 µm and compare the profile with the dashed outline of the opening.' },
        checks: q('contact-lim'),
      },
    ],
    review: q('wfail', 's14-range', 's10-threshold'),
  },
  {
    id: 'l7-resist', title: 'Resists and the resist process',
    intro: 'The film that records the image, and the eight steps that turn a bare wafer into a hard-baked stencil.',
    steps: [
      {
        id: 'l7-resists', title: 'What a resist is', scene: RESIST({ rstep: 3 }), sources: [T7(15), T2(31)],
        factIds: f('s15-resist', 's15-older', 's15-sensitivity', 's15-resolution', 's15-etch'),
        text: 'Photoresists are hydrocarbon polymers that change their chemistry when light hits them, spun into a film well under a micrometre thick and baked. Negative resists, the older kind, become harder to dissolve where lit; positive resists become easier. Three properties matter. Sensitivity is the dose needed for the change, in mJ cm⁻²: about a hundred for g- and i-line resists, newer ones much less. Resolution is mostly limited by the exposure tool, not the resist. And it must survive the etch it protects against.',
        example: { kind: 'demo', text: 'Step to develop and turn the dose down: the openings no longer clear.' },
        checks: q('under'),
      },
      {
        id: 'l7-prep', title: 'Clean, prime, spin', scene: RESIST({ rstep: 0 }), sources: [T7(16)],
        factIds: f('s16-clean', 's16-hmds', 's16-spin'),
        text: 'The wafer is first cleaned and baked dry, because resist sticks badly to a surface carrying water. A primer, HMDS, is spun on to make the oxide surface water-repellent so the resist adheres. Then resist is dispensed and spun at a few thousand revolutions per minute: centrifugal force flings off the excess and leaves an even film about half a micrometre thick, thinner the faster it spins.',
        example: { kind: 'demo', text: 'Step through the first three stages; drag the spin speed and read the thickness.' },
        checks: q('hmds'),
      },
      {
        id: 'l7-bake', title: 'Bake and expose', scene: RESIST({ rstep: 3 }), sources: [T7(16)],
        factIds: f('s16-clean', 's16-prebake', 's16-expose'),
        text: 'Fresh resist is still full of solvent, so it is pre-baked on a hot plate, typically for ten to thirty minutes just under the boiling point of water. The wafer then goes into the stepper, which aligns it at each exposure site to the layers already on it and exposes that field, a dose of order 150 mJ cm⁻², before stepping to the next.',
        example: { kind: 'demo', text: 'Step to the exposure: UV passes the clear parts of the mask.' },
        checks: q('prebake'),
      },
      {
        id: 'l7-finish', title: 'Post-exposure bake, develop, post-bake', scene: RESIST({ rstep: 5 }), sources: [T7(16)],
        factIds: f('s16-peb', 's16-develop', 's16-postbake'),
        text: 'Light reflecting off the wafer interferes with the incoming light and prints stripes through the resist thickness. A short bake after exposure, around ten minutes at 100 °C, lets the exposed chemistry diffuse and smooths them out. Development is quick, under a minute at room temperature by spray or immersion, and dissolves the exposed (positive) resist. A final bake of ten to thirty minutes at 100–140 °C hardens what remains for the etch.',
        example: { kind: 'demo', text: 'Step from exposure through the post-exposure bake: the stripes disappear.' },
        checks: q('waves'),
      },
    ],
    review: q('thin', 'resolution', 'develop', 's05-contact'),
  },
  {
    id: 'l7-future', title: 'Beyond optical lithography',
    intro: 'What comes after 193 nm? The slides weigh immersion, EUV, electrons, ions and X-rays, and the wavelengths behind them.',
    steps: [
      {
        id: 'l7-immersion', title: 'Still optical at 7 nm', scene: NGL(), sources: [T7(17)],
        factIds: f('s17-7nm', 's17-future', 's17-immersion'),
        text: 'Optical lithography has outlived every forecast of its end and still prints 7 nm CMOS. One reason is immersion: NA = n sin θ, and replacing air with a fluid of higher index raises NA past 1. Socha’s chart for k₁ = 0.3 and sin θ = 0.93 shows resolution falling as the fluid’s index rises, for both 193 and 157 nm. There is no consensus on what comes next; e-beam, X-ray and EUV are candidates and all would need new resists.',
        example: { kind: 'worked', text: 'Dry 193 nm at k₁ = 0.3, sin θ = 0.93: R = 0.3 × 193 / 0.93 ≈ 62 nm.' },
        checks: q('immerse'),
      },
      {
        id: 'l7-ngl', title: 'Four candidates', scene: NGL(), sources: [T7(18)],
        factIds: f('s18-verdicts', 's18-figure'),
        text: 'Slide 18 gives a verdict on each next-generation technique. Extreme UV struggles with its source and its reflective mask. Electron beams and ion projection both write too slowly for production but are excellent research tools. X-ray proximity printing has dropped off the roadmap. Its sketch shows how each exposes resist: light spreads about half a micrometre, electrons scatter sideways and back, X-rays pass straight through a 1:1 mask, ions travel almost straight.',
        example: { kind: 'demo', text: 'The four beams are side by side in the scene, in the same order as the sketch.' },
        checks: q('verdicts'),
      },
      {
        id: 'l7-lambda', title: 'Photons and particles', scene: NGL(), sources: [T7(18)],
        factIds: f('s18-table', 's18-particles'),
        text: 'For light, wavelength and photon energy are tied by E = hc/λ, with hc = 1240 eV·nm: UV at 400 nm is 3.1 eV, deep UV at 250 nm about 5 eV, X-rays at half a nanometre over 2 keV. Electrons and ions have mass, so their wavelength is de Broglie’s h/p instead. The slide applies the photon formula to 20 keV electrons and 100 keV ions and lists 0.62 Å and 0.12 Å; the true de Broglie wavelengths are far shorter, so diffraction is no limit at all for particle beams.',
        example: { kind: 'worked', text: 'Non-relativistic electrons: λ = 12.26 Å/√(E in eV); at 10 keV that is 12.26/100 ≈ 0.12 Å.' },
        checks: q('photon', 'debroglie'),
      },
    ],
    review: q('7nm', 'na', 's16-peb'),
  },
  {
    id: 'l7-ebeam', title: 'Writing with electrons',
    intro: 'The e-beam writer: no mask, a 1 nm beam, and one pixel at a time. You will run a lift-off and see the proximity effect.',
    steps: [
      {
        id: 'l7-direct', title: 'Direct write', scene: WRITE(), sources: [T7(19), T7(22)],
        factIds: f('s19-direct', 's19-column', 's22-adv'),
        text: 'An e-beam writer is built like a scanning electron microscope: an electron gun, an alignment coil, two condenser lenses, a limiting aperture and a final lens with deflection coils, above a precisely moving stage. A computer with a pattern generator drives the deflection and a pair of plates that can kick the beam aside. Because the pattern comes straight from the computer there is no mask; the beam is tiny, and resolution is limited by electron scattering in the resist to around 10 nm.',
        example: { kind: 'demo', text: 'Watch the beam raster across the stage, switching off between shapes.' },
        checks: q('blank'),
      },
      {
        id: 'l7-slow', title: 'Why it is not used for production', scene: WRITE(), sources: [T7(19), T7(22)],
        factIds: f('s19-throughput', 's22-disadv', 's22-lcn'),
        text: 'Writing pixel by pixel is the catch. To match even ten wafers an hour, the beam current would have to reach tens of milliamps, far beyond what keeps a beam fine. Add the cost, the high vacuum and the precision magnetic lenses, and e-beam lithography is commercially viable only for a few jobs, such as making masks. Research labs love it: the London Centre for Nanotechnology’s Raith 150-TWO writes 20 nm features in PMMA on pieces up to 150 mm across.',
        example: { kind: 'demo', text: 'Count the rows the beam needs for this tiny field, then imagine a 300 mm wafer.' },
        checks: q('throughput'),
      },
      {
        id: 'l7-lift', title: 'Lift-off', scene: LIFTOFF({ eb: 1 }), sources: [T7(20), T5(39)],
        factIds: f('s20-liftoff', 's20-sem'),
        text: 'E-beam patterns are often transferred by lift-off instead of etching. A wafer with 58 nm of oxide is coated in PMMA, written, and developed so the exposed PMMA dissolves. A thin titanium sticking layer and gold are evaporated over everything. Dissolving the PMMA then removes the metal that sits on it, leaving metal only in the written openings. Beside the steps the slide shows an SEM column with scan coils and a detector, noting this route is cheaper, but also slower.',
        example: { kind: 'demo', text: 'Step through the six stages and watch the metal on the resist lift away.' },
        checks: q('lift'),
      },
      {
        id: 'l7-prox', title: 'The proximity effect', scene: PROX({ keV: 10 }), sources: [T7(21)],
        factIds: f('s21-scatter', 's21-secondary', 's21-fast', 's21-energy'),
        text: 'Electrons entering resist scatter. Small-angle forward scattering widens the beam slightly; large-angle events, mostly in the substrate, send electrons back up through the resist far from where they entered, exposing it there too. The bulk of the exposure is done by slow secondary electrons of a few to fifty eV, which travel only nanometres; a few faster ones near 1 keV reach a few tenths of a micrometre. Faster beams penetrate deeper and their backscatter returns further away.',
        example: { kind: 'demo', text: 'Compare 10 and 20 keV: the cloud of trajectories in the silicon grows.' },
        checks: q('kev'),
      },
    ],
    review: q('traj', 'secondary', 'direct', 's18-verdicts'),
  },
]
