import { createWafer } from '../../sim/model'
import { deposit, develop, etch, expose, identity, implant, oxidise, spinResist, strip } from '../../sim/ops'
import { Process, type Step } from '../../sim/recipe'
import type { Mask } from '../../sim/types'
import { CONTACT, GRID, METAL, NPLUS, NWELL, POLY, PPLUS } from './masks'

/**
 * Film thicknesses and depths (nm). Only the gate oxide (< 20 Å, slide 37)
 * is on the slides; the rest are typical for a 0.6 µm process and are
 * "beyond the lecture" (Plummer, Deal & Griffin, Silicon VLSI Technology, ch. 2).
 */
export const T = {
  substrate: 2400, // simulated depth; a real 300 mm wafer is 775 µm thick
  maskOx: 200,
  resist: 800,
  nwell: 1500,
  gox: 2,
  poly: 300,
  junction: 250,
  fox: 600,
  al: 700,
}

const BEYOND_THICK = 'Thickness is a typical 0.6 µm-process value, not from the slides (Plummer, Deal & Griffin, ch. 2).'

/** The four steps that pattern a film with resist, as on slides 31–34. */
function litho(group: string, mask: Mask, slide: number, keep: boolean, target: { mat: 'ox' | 'poly' | 'fox' | 'al'; tool: string; chem: string; slide: number; note: string; beyond?: string }, extra: Step[] = []): Step[] {
  return [
    {
      id: `${group}-spin`, title: 'Spin on photoresist', slide: 31, group, kind: 'spin',
      tool: 'Spin coater, yellow-light bay', chemistry: 'Light-sensitive organic polymer',
      note: 'Resist is spun on and baked; it covers the wafer flat.', op: spinResist(T.resist),
    },
    {
      id: `${group}-expose`, title: `Expose through the ${mask.name} mask`, slide, group, kind: 'expose', mask: mask.id,
      tool: 'Mask aligner (UV)', chemistry: 'Positive resist softens where exposed',
      note: keep
        ? `Light passes everywhere except where ${mask.name.toLowerCase()} is drawn, so resist survives on the drawing.`
        : `Light passes where ${mask.name.toLowerCase()} is drawn; the resist there softens.`,
      beyond: keep ? 'Dark-field mask polarity (keeping the film where it is drawn) is implied by slides 38 and 45, not named on them.' : undefined,
      op: expose(mask, { keep }),
    },
    {
      id: `${group}-develop`, title: 'Develop: strip exposed resist', slide: 32, group, kind: 'develop',
      tool: 'Develop track', chemistry: 'Aqueous developer dissolves the softened resist',
      note: 'Exposed resist washes away; the rest is now a stencil.', op: develop(),
    },
    {
      id: `${group}-etch`, title: `Etch ${target.mat === 'al' ? 'aluminium' : target.mat === 'poly' ? 'polysilicon' : 'oxide'}`,
      slide: target.slide, group, kind: 'etch', tool: target.tool, chemistry: target.chem, note: target.note,
      beyond: target.beyond, op: etch(target.mat),
    },
    ...extra,
    {
      id: `${group}-strip`, title: 'Strip photoresist', slide: 34, group, kind: 'strip',
      tool: 'Wet bench', chemistry: 'Piranha etch (mixture of acids)',
      note: 'Remaining resist is stripped so it does not melt in the next hot step.',
      beyond: 'Piranha is H₂SO₄ + H₂O₂ (Plummer, Deal & Griffin, ch. 4).', op: strip('resist'),
    },
  ]
}

const HF = { tool: 'Wet bench', chem: 'Hydrofluoric acid (HF)' }

export const STEPS: Step[] = [
  {
    id: 'start', title: 'Blank p-type wafer', slide: 29, group: 'start', kind: 'start',
    tool: '—', chemistry: 'Lightly doped p-type single-crystal silicon',
    note: 'Start with a blank wafer and build the inverter from the bottom up.', op: identity,
  },
  // ── n-well (slides 29–36)
  {
    id: 'nwell-ox', title: 'Grow SiO₂', slide: 30, group: 'n-well', kind: 'oxidise',
    tool: 'Oxidation furnace', chemistry: 'H₂O or O₂ at 900–1200 °C',
    note: 'A protective layer of oxide covers the wafer.', beyond: BEYOND_THICK, op: oxidise('ox', T.maskOx),
  },
  ...litho('n-well', NWELL, 32, false, {
    mat: 'ox', tool: HF.tool, chem: HF.chem, slide: 33,
    note: 'HF only attacks oxide where the resist has been removed.',
  }),
  {
    id: 'nwell-implant', title: 'Form the n-well', slide: 35, group: 'n-well', kind: 'implant',
    tool: 'Ion implanter (or diffusion furnace with As gas)', chemistry: 'Arsenic, a group V donor',
    note: 'As ions are blocked by the oxide and only enter the exposed silicon.',
    beyond: 'Well depth 1.5 µm is typical, not from the slides. Production n-wells usually use phosphorus (Plummer, Deal & Griffin, ch. 8).',
    op: implant('nwell', T.nwell),
  },
  {
    id: 'nwell-strip-ox', title: 'Strip oxide', slide: 36, group: 'n-well', kind: 'strip',
    tool: HF.tool, chemistry: HF.chem, note: 'Back to a bare wafer, now with an n-well.', op: strip('ox'),
  },
  // ── gate (slides 37–38)
  {
    id: 'gate-ox', title: 'Thin gate oxide', slide: 37, group: 'gate', kind: 'oxidise',
    tool: 'Oxidation furnace', chemistry: 'SiO₂, < 20 Å (6–7 atomic layers)',
    note: 'Deposit a very thin layer of gate oxide: the insulator of the MOS capacitor.',
    beyond: 'Slide 37 says "deposit"; gate oxide is normally grown thermally in a furnace (Plummer, Deal & Griffin, ch. 6).',
    op: oxidise('gox', T.gox),
  },
  {
    id: 'gate-poly', title: 'Deposit polysilicon', slide: 37, group: 'gate', kind: 'deposit',
    tool: 'CVD furnace', chemistry: 'Silane (SiH₄) → many small Si crystals',
    note: 'Polysilicon forms from silane and is heavily doped to conduct.', beyond: BEYOND_THICK, op: deposit('poly', T.poly),
  },
  ...litho(
    'gate', POLY, 38, true,
    {
      mat: 'poly', tool: 'Plasma etcher', chem: 'Reactive ions remove unmasked poly', slide: 38,
      note: 'The same lithography sequence patterns the poly gates.',
      beyond: 'Slide 38 says "same lithography process"; a dry plasma etch is the usual tool (Plummer, Deal & Griffin, ch. 10).',
    },
    [
      {
        id: 'gate-etch-gox', title: 'Clear the thin oxide', slide: 38, group: 'gate', kind: 'etch',
        tool: HF.tool, chemistry: HF.chem, note: 'Gate oxide now remains only under the poly.', op: etch('gox'),
      },
    ],
  ),
  // ── n+ diffusion (slides 39–42)
  {
    id: 'n-ox', title: 'Cover with oxide', slide: 39, group: 'n+', kind: 'oxidise',
    tool: 'Oxidation furnace', chemistry: 'SiO₂ over silicon and poly',
    note: 'Oxide plus masking will expose only where n+ dopants should go.', beyond: BEYOND_THICK, op: oxidise('ox', T.maskOx),
  },
  ...litho('n+', NPLUS, 40, false, { mat: 'ox', tool: HF.tool, chem: HF.chem, slide: 40, note: 'Oxide opens over the nMOS and the well tap; the gate stays covered by its own poly.' }),
  {
    id: 'n-implant', title: 'Form n+ regions (self-aligned)', slide: 41, group: 'n+', kind: 'implant',
    tool: 'Ion implanter', chemistry: 'Group V donor (As or P, slide 5)',
    note: 'The poly gate blocks the implant, so source and drain line up with the gate by themselves.',
    beyond: 'Junction depth 250 nm is typical, not from the slides.', op: implant('n+', T.junction),
  },
  { id: 'n-strip-ox', title: 'Strip oxide', slide: 42, group: 'n+', kind: 'strip', tool: HF.tool, chemistry: HF.chem, note: 'Strip the oxide to complete the patterning step.', op: strip('ox') },
  // ── p+ diffusion (slide 43)
  {
    id: 'p-ox', title: 'Cover with oxide', slide: 43, group: 'p+', kind: 'oxidise',
    tool: 'Oxidation furnace', chemistry: 'SiO₂', note: 'Same set of steps, now for p+.', beyond: BEYOND_THICK, op: oxidise('ox', T.maskOx),
  },
  ...litho('p+', PPLUS, 43, false, { mat: 'ox', tool: HF.tool, chem: HF.chem, slide: 43, note: 'Oxide opens over the pMOS and the substrate tap.' }),
  {
    id: 'p-implant', title: 'Form p+ regions (self-aligned)', slide: 43, group: 'p+', kind: 'implant',
    tool: 'Ion implanter', chemistry: 'Group III acceptor (B, slide 5)',
    note: 'p+ makes the pMOS source and drain and the substrate contact.', beyond: 'Junction depth 250 nm is typical, not from the slides.',
    op: implant('p+', T.junction),
  },
  { id: 'p-strip-ox', title: 'Strip oxide', slide: 43, group: 'p+', kind: 'strip', tool: HF.tool, chemistry: HF.chem, note: 'Both transistors are now in the silicon.', op: strip('ox') },
  // ── contacts (slide 44)
  {
    id: 'fox', title: 'Thick field oxide', slide: 44, group: 'contacts', kind: 'deposit',
    tool: 'CVD reactor', chemistry: 'SiO₂', note: 'Cover the chip with thick oxide before wiring.', beyond: BEYOND_THICK, op: deposit('fox', T.fox),
  },
  ...litho('contacts', CONTACT, 44, false, { mat: 'fox', tool: HF.tool, chem: HF.chem, slide: 44, note: 'Contact cuts open down to the diffusions.' }),
  // ── metal (slide 45)
  {
    id: 'al', title: 'Sputter aluminium', slide: 45, group: 'metal', kind: 'sputter',
    tool: 'Sputter tool', chemistry: 'Aluminium over the whole wafer',
    note: 'Aluminium fills the contact cuts and covers everything.', beyond: BEYOND_THICK,
    op: deposit('al', T.al, { planar: true, markPlugs: true }),
  },
  ...litho('metal', METAL, 45, true, {
    mat: 'al', tool: 'Metal etcher', chem: 'Removes unmasked aluminium', slide: 45,
    note: 'Pattern to remove excess metal, leaving wires.',
    beyond: 'Chlorine plasma is the usual Al etch (Plummer, Deal & Griffin, ch. 10).',
  }),
]

export const initialWafer = () => createWafer(GRID, T.substrate, 'p')

let cached: Process | null = null
export function inverterProcess(): Process {
  if (!cached) cached = new Process(initialWafer(), STEPS)
  return cached
}
